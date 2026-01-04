"use server"

import { db } from "@/db"
import {
    chartOfAccounts,
    salesInvoices,
    purchaseOrders,
    inventory
} from "@/db/schema"
import { eq, and, like } from "drizzle-orm"
import { createJournalEntry, createAccount } from "@/actions/accounting"

// Helper to find or create standard accounts
async function getAccountId(companyId: number, code: string, name: string, type: string) {
    const existing = await db.query.chartOfAccounts.findFirst({
        where: and(
            eq(chartOfAccounts.companyId, companyId),
            eq(chartOfAccounts.accountCode, code)
        )
    })

    if (existing) return existing.id

    // Create if missing
    const [newAcc] = await db.insert(chartOfAccounts).values({
        companyId,
        accountCode: code,
        accountName: name,
        accountType: type,
        isActive: true,
        balance: "0"
    }).returning()

    return newAcc.id
}

export async function postSalesInvoiceToGL(invoiceId: number, userId: number) {
    try {
        const invoice = await db.query.salesInvoices.findFirst({
            where: eq(salesInvoices.id, invoiceId),
            with: { lines: { with: { inventoryItem: true } } }
        })

        if (!invoice) throw new Error("Invoice not found")
        if (invoice.status === 'draft') throw new Error("Cannot post draft invoice")

        const companyId = invoice.companyId

        // 1. Get Accounts (Standard Configuration)
        // Assets
        const arId = await getAccountId(companyId, "1100", "Accounts Receivable", "asset")
        const inventoryId = await getAccountId(companyId, "1200", "Inventory Asset", "asset")
        const cogsId = await getAccountId(companyId, "5000", "Cost of Goods Sold", "expense")
        // Revenue
        const salesId = await getAccountId(companyId, "4000", "Sales Revenue", "revenue")

        // 2. Calculate Totals
        const totalSales = parseFloat(invoice.totalAmount)

        // Calculate COGS (Standard Cost * Quantity)
        // Note: For real FIFO/LIFO, we need a lot more logic. 
        // We will use 'Weighted Average' or 'Standard Cost' stored in the item.
        let totalCOGS = 0

        for (const line of invoice.lines) {
            if (line.inventoryItem && line.inventoryItem.unitPrice) {
                // Assuming inventoryItem.unitPrice is the COST price
                const cost = parseFloat(line.inventoryItem.unitPrice) * parseFloat(line.quantity)
                totalCOGS += cost
            }
        }

        // 3. Create Journal Entries
        // Entry 1: Revenue Recognition (Dr AR, Cr Sales)
        await createJournalEntry({
            userId,
            companyId,
            entryDate: invoice.issueDate,
            description: `Invoice #${invoice.invoiceNumber} - Revenue`,
            reference: invoice.invoiceNumber,
            lines: [
                { accountId: arId, debit: totalSales, credit: 0, description: `Customer Invoice ${invoice.invoiceNumber}` },
                { accountId: salesId, debit: 0, credit: totalSales, description: `Sales Revenue` }
            ]
        })

        // Entry 2: Inventory Deduction (Dr COGS, Cr Inventory)
        if (totalCOGS > 0) {
            await createJournalEntry({
                userId,
                companyId,
                entryDate: invoice.issueDate,
                description: `Invoice #${invoice.invoiceNumber} - COGS`,
                reference: invoice.invoiceNumber,
                lines: [
                    { accountId: cogsId, debit: totalCOGS, credit: 0, description: `Cost of Goods Sold` },
                    { accountId: inventoryId, debit: 0, credit: totalCOGS, description: `Inventory Reduction` }
                ]
            })
        }

        return { success: true }

    } catch (error: any) {
        console.error("AutoPost Sales Error:", error)
        return { success: false, error: error.message }
    }
}

export async function postPurchaseOrderToGL(poId: number, userId: number) {
    try {
        const po = await db.query.purchaseOrders.findFirst({
            where: eq(purchaseOrders.id, poId),
            with: { lines: true }
        })

        if (!po) throw new Error("PO not found")
        if (po.status !== 'received') throw new Error("PO must be received to post")

        const companyId = po.companyId

        // 1. Get Accounts
        const inventoryId = await getAccountId(companyId, "1200", "Inventory Asset", "asset")
        // Liability
        const apId = await getAccountId(companyId, "2100", "Accounts Payable", "liability")

        const totalAmount = parseFloat(po.totalAmount)

        // 2. Create Journal Entry (Dr Inventory, Cr AP)
        await createJournalEntry({
            userId,
            companyId,
            entryDate: po.orderDate, // Or Received Date if available
            description: `PO #${po.poNumber} - Inventory Received`,
            reference: po.poNumber,
            lines: [
                { accountId: inventoryId, debit: totalAmount, credit: 0, description: `Inventory Addition` },
                { accountId: apId, debit: 0, credit: totalAmount, description: `Supplier Liability` }
            ]
        })

        return { success: true }

    } catch (error: any) {
        console.error("AutoPost Purchasing Error:", error)
        return { success: false, error: error.message }
    }
}
