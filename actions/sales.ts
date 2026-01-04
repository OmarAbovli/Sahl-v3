"use server"

import { db } from "@/db"
import {
    salesInvoices,
    salesInvoiceLines,
    customers,
    inventory,
    products,
    companies,
    taxRules
} from "@/db/schema"
import { eq, desc, and, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { postSalesInvoiceToGL } from "@/actions/autoposting"

export async function getSalesInvoices(companyId: number) {
    try {
        const data = await db.query.salesInvoices.findMany({
            where: eq(salesInvoices.companyId, companyId),
            with: {
                customer: true,
                lines: {
                    with: {
                        inventoryItem: true
                    }
                }
            },
            orderBy: [desc(salesInvoices.createdAt)]
        })
        return { success: true, data }
    } catch (error) {
        console.error("Error fetching sales invoices:", error)
        return { success: false, error: "Failed to fetch invoices" }
    }
}

export async function getCustomers(companyId: number) {
    try {
        const data = await db.query.customers.findMany({
            where: eq(customers.companyId, companyId)
        })
        return { success: true, data }
    } catch (error) {
        return { success: false, error: "Failed to fetch customers" }
    }
}

// Get available inventory items to sell
export async function getSellableInventory(companyId: number) {
    try {
        const data = await db.query.inventory.findMany({
            where: and(
                eq(inventory.companyId, companyId),
                sql`${inventory.quantity} > 0`
            )
        })
        return { success: true, data }
    } catch (error) {
        return { success: false, error: "Failed to fetch inventory" }
    }
}

interface CreateInvoiceParams {
    userId: number
    companyId: number
    customerId: number
    invoiceDate: string // YYYY-MM-DD
    dueDate?: string
    status: string
    lines: {
        inventoryItemId: number
        quantity: number
        unitPrice: number
        description: string
        taxRate?: number
    }[]
}

interface SaveInvoiceParams extends CreateInvoiceParams {
    id?: number
}

export async function saveSalesInvoice(params: SaveInvoiceParams) {
    try {
        const { id, userId, companyId, customerId, invoiceDate, dueDate, status, lines } = params

        // VALIDATION: Check stock first (for the final state)
        // If updating, we should ignore currently held stock by THIS invoice
        // But for simplicity, we'll restore first then check.

        const invoiceId = await db.transaction(async (tx) => {
            let invObj: any = null

            if (id) {
                // UPDATE MODE
                invObj = await tx.query.salesInvoices.findFirst({
                    where: and(eq(salesInvoices.id, id), eq(salesInvoices.companyId, companyId)),
                    with: { lines: true }
                })
                if (!invObj) throw new Error("Invoice not found")

                // 1. Rollback previous stock deductions
                if (invObj.status !== 'draft') {
                    for (const line of invObj.lines) {
                        if (line.inventoryItemId) {
                            await tx.update(inventory)
                                .set({ quantity: sql`${inventory.quantity} + ${line.quantity}` })
                                .where(eq(inventory.id, line.inventoryItemId))
                        }
                    }
                }
            }

            // 2. Calculation
            let subtotal = 0
            let taxAmount = 0
            const preparedLines = lines.map(line => {
                const lineTotal = line.quantity * line.unitPrice
                const lineTax = lineTotal * ((line.taxRate || 0) / 100)
                subtotal += lineTotal
                taxAmount += lineTax
                return { ...line, lineTotal, lineTax }
            })
            const totalAmount = subtotal + taxAmount

            // 3. Upsert Invoice
            let currentInvoiceId = id
            if (id) {
                await tx.update(salesInvoices).set({
                    customerId,
                    invoiceDate,
                    dueDate,
                    status,
                    subtotal: subtotal.toString(),
                    taxAmount: taxAmount.toString(),
                    totalAmount: totalAmount.toString(),
                    updatedAt: new Date()
                }).where(eq(salesInvoices.id, id))

                // Delete old lines
                await tx.delete(salesInvoiceLines).where(eq(salesInvoiceLines.salesInvoiceId, id))
            } else {
                const invNum = `INV-${Date.now().toString().slice(-6)}`
                const [newInvoice] = await tx.insert(salesInvoices).values({
                    companyId,
                    customerId,
                    invoiceNumber: invNum,
                    invoiceDate,
                    dueDate,
                    status,
                    subtotal: subtotal.toString(),
                    taxAmount: taxAmount.toString(),
                    totalAmount: totalAmount.toString(),
                    createdBy: userId,
                }).returning()
                currentInvoiceId = newInvoice.id
            }

            // 4. Create New Lines & Deduct Stock
            for (const [index, line] of preparedLines.entries()) {
                await tx.insert(salesInvoiceLines).values({
                    salesInvoiceId: currentInvoiceId!,
                    inventoryItemId: line.inventoryItemId,
                    description: line.description,
                    quantity: line.quantity.toString(),
                    unitPrice: line.unitPrice.toString(),
                    lineTotal: line.lineTotal.toString(),
                    taxRate: (line.taxRate || 0).toString(),
                    lineNumber: index + 1
                })

                if (status !== 'draft') {
                    // Check stock again before deducting
                    const item = await tx.query.inventory.findFirst({
                        where: eq(inventory.id, line.inventoryItemId)
                    })
                    if (!item || item.quantity < line.quantity) {
                        throw new Error(`Insufficient stock for item: ${item?.itemName || 'Unknown'}`)
                    }

                    await tx.update(inventory)
                        .set({ quantity: sql`${inventory.quantity} - ${line.quantity}` })
                        .where(eq(inventory.id, line.inventoryItemId))
                }
            }

            return currentInvoiceId!
        })

        if (status !== 'draft') {
            await postSalesInvoiceToGL(invoiceId, userId)
        }

        revalidatePath('/employee')
        return { success: true, message: id ? "Invoice updated" : "Invoice created" }
    } catch (error: any) {
        console.error("Save Invoice Error:", error)
        return { success: false, error: error.message || "Failed to save invoice" }
    }
}

export async function deleteSalesInvoice(id: number) {
    try {
        await db.transaction(async (tx) => {
            // Check if we need to restore stock (if previously deducted)
            const existing = await tx.query.salesInvoices.findFirst({
                where: eq(salesInvoices.id, id),
                with: { lines: true }
            })

            if (!existing) throw new Error("Invoice not found")

            // If it was confirmed/delivered, we must restore stock
            if (existing.status !== 'draft') {
                for (const line of existing.lines) {
                    if (line.inventoryItemId) {
                        await tx
                            .update(inventory)
                            .set({ quantity: sql`${inventory.quantity} + ${line.quantity}` })
                            .where(eq(inventory.id, line.inventoryItemId))
                    }
                }
            }

            await tx.delete(salesInvoices).where(eq(salesInvoices.id, id))
        })
        revalidatePath('/employee')
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to delete invoice" }
    }
}

export async function getTaxRules(companyId: number) {
    try {
        const data = await db.query.taxRules.findMany({
            where: and(eq(taxRules.companyId, companyId), eq(taxRules.isActive, true))
        })
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
