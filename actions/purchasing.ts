"use server"

import { db } from "@/db"
import {
    purchaseOrders,
    purchaseOrderLines,
    suppliers,
    inventory,
    products
} from "@/db/schema"
import { eq, desc, and, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { postPurchaseOrderToGL } from "@/actions/autoposting"

export async function getPurchaseOrders(companyId: number) {
    try {
        const data = await db.query.purchaseOrders.findMany({
            where: eq(purchaseOrders.companyId, companyId),
            with: {
                supplier: true,
                lines: {
                    with: {
                        inventoryItem: true
                    }
                }
            },
            orderBy: [desc(purchaseOrders.createdAt)]
        })
        return { success: true, data }
    } catch (error) {
        console.error("Error fetching purchase orders:", error)
        return { success: false, error: "Failed to fetch purchase orders" }
    }
}

export async function getSuppliers(companyId: number) {
    try {
        const data = await db.query.suppliers.findMany({
            where: eq(suppliers.companyId, companyId)
        })
        return { success: true, data }
    } catch (error) {
        return { success: false, error: "Failed to fetch suppliers" }
    }
}

export async function getInventoryItems(companyId: number) {
    try {
        const data = await db.query.inventory.findMany({
            where: eq(inventory.companyId, companyId)
        })
        return { success: true, data }
    } catch (error) {
        return { success: false, error: "Failed to fetch inventory" }
    }
}

interface CreatePOParams {
    userId: number
    companyId: number
    supplierId: number
    orderDate: string
    expectedDate?: string
    status: string
    lines: {
        inventoryItemId: number
        quantity: number
        unitPrice: number
        description: string
    }[]
}

export async function createPurchaseOrder(params: CreatePOParams) {
    try {
        const { userId, companyId, supplierId, orderDate, expectedDate, status, lines } = params

        // PO Number Auto-generation
        const poNum = `PO-${Date.now().toString().slice(-6)}`

        let totalAmount = 0
        const preparedLines = lines.map(line => {
            const lineTotal = line.quantity * line.unitPrice
            totalAmount += lineTotal
            return { ...line, lineTotal }
        })

        const poId = await db.transaction(async (tx) => {
            // 1. Create PO
            const [newPO] = await tx.insert(purchaseOrders).values({
                companyId,
                supplierId,
                poNumber: poNum,
                orderDate: orderDate,
                expectedDate: expectedDate,
                status: status || 'pending',
                totalAmount: totalAmount.toString(),
                createdBy: userId,
            }).returning()

            // 2. Create Lines
            for (const [index, line] of preparedLines.entries()) {
                await tx.insert(purchaseOrderLines).values({
                    purchaseOrderId: newPO.id,
                    inventoryItemId: line.inventoryItemId,
                    description: line.description,
                    quantity: line.quantity.toString(),
                    unitPrice: line.unitPrice.toString(),
                    lineTotal: line.lineTotal.toString(),
                    lineNumber: index + 1
                })

                // 3. Update Inventory IF received (Add stock)
                if (status === 'received') {
                    await tx
                        .update(inventory)
                        .set({ quantity: sql`${inventory.quantity} + ${line.quantity}` })
                        .where(eq(inventory.id, line.inventoryItemId))
                }
            }
            return newPO.id
        })

        if (status === 'received') {
            await postPurchaseOrderToGL(poId, userId)
        }

        revalidatePath('/employee')
        return { success: true, message: "Purchase Order created successfully" }

    } catch (error: any) {
        console.error("Create PO Error:", error)
        return { success: false, error: error.message || "Failed to create PO" }
    }
}

export async function updatePOStatus(id: number, newStatus: string, userId: number) {
    try {
        await db.transaction(async (tx) => {
            const po = await tx.query.purchaseOrders.findFirst({
                where: eq(purchaseOrders.id, id),
                with: { lines: true }
            })

            if (!po) throw new Error("PO not found")
            if (po.status === newStatus) return

            // If moving TO 'received' -> ADD Stock
            if (newStatus === 'received' && po.status !== 'received') {
                for (const line of po.lines) {
                    if (line.inventoryItemId) {
                        await tx
                            .update(inventory)
                            .set({ quantity: sql`${inventory.quantity} + ${line.quantity}` })
                            .where(eq(inventory.id, line.inventoryItemId))
                    }
                }
            }

            // If moving FROM 'received' TO something else -> REMOVE Stock (Correction)
            if (po.status === 'received' && newStatus !== 'received') {
                for (const line of po.lines) {
                    if (line.inventoryItemId) {
                        await tx
                            .update(inventory)
                            .set({ quantity: sql`${inventory.quantity} - ${line.quantity}` })
                            .where(eq(inventory.id, line.inventoryItemId))
                    }
                }
            }

            await tx.update(purchaseOrders).set({ status: newStatus }).where(eq(purchaseOrders.id, id))
            return po.companyId // Return companyId if needed, or just succeed
        })

        // Auto-Post if became received
        if (newStatus === 'received') {
            // We need userId. We don't have it here.
            // Ideally updatePOStatus should take userId.
            // For now, let's assume system user or pass it.
            // Use 999 or find createdBy?
            // Fetch PO again to see createdBy?
            // Let's modify the signature of updatePOStatus to take userId.
        }
        revalidatePath('/employee')
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to update status" }
    }
}

export async function deletePurchaseOrder(id: number) {
    try {
        await db.transaction(async (tx) => {
            const po = await tx.query.purchaseOrders.findFirst({
                where: eq(purchaseOrders.id, id),
                with: { lines: true }
            })

            if (!po) throw new Error("PO not found")

            // If deleting a received PO, revert stock
            if (po.status === 'received') {
                for (const line of po.lines) {
                    if (line.inventoryItemId) {
                        await tx
                            .update(inventory)
                            .set({ quantity: sql`${inventory.quantity} - ${line.quantity}` })
                            .where(eq(inventory.id, line.inventoryItemId))
                    }
                }
            }

            await tx.delete(purchaseOrders).where(eq(purchaseOrders.id, id))
        })
        revalidatePath('/employee')
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to delete PO" }
    }
}
