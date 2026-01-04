"use server"

import { db } from "@/db"
import {
    cashBankAccounts,
    customerPayments,
    supplierPayments,
    salesInvoices,
    purchaseOrders,
    chartOfAccounts
} from "@/db/schema"
import { eq, and, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { createJournalEntry, getCOA } from "@/actions/accounting"

// --- ACCOUNTS ---

export async function getCashBankAccounts(companyId: number) {
    try {
        const data = await db.query.cashBankAccounts.findMany({
            where: eq(cashBankAccounts.companyId, companyId)
        })
        return { success: true, data }
    } catch (error) {
        return { success: false, error: "Failed to fetch accounts" }
    }
}

export async function createCashBankAccount(companyId: number, data: any) {
    try {
        await db.insert(cashBankAccounts).values({
            companyId,
            name: data.name,
            accountNumber: data.accountNumber,
            bankName: data.bankName,
            type: data.type, // 'cash' or 'bank'
            isActive: true
        })
        revalidatePath('/employee')
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to create account" }
    }
}

// --- PAYMENTS (AR/AP) ---

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

export async function recordCustomerPayment(data: {
    userId: number,
    companyId: number,
    customerId: number,
    invoiceId: number,
    amount: number,
    paymentDate: string,
    method: string,
    reference?: string
    bankAccountId: number // Where money went
}) {
    try {
        // 1. Record Payment
        await db.insert(customerPayments).values({
            companyId: data.companyId,
            customerId: data.customerId,
            invoiceId: data.invoiceId,
            amount: data.amount.toString(),
            paymentDate: data.paymentDate,
            method: data.method,
            reference: data.reference,
            createdBy: data.userId
        })

        // 2. Update Invoice Status if fully paid (Simplified: Assuming full payment for now or checking total)
        const invoice = await db.query.salesInvoices.findFirst({
            where: eq(salesInvoices.id, data.invoiceId)
        })

        if (invoice && parseFloat(invoice.paidAmount || '0') + data.amount >= parseFloat(invoice.totalAmount)) {
            await db.update(salesInvoices).set({ status: 'paid', paidAmount: (parseFloat(invoice.paidAmount || '0') + data.amount).toString() }).where(eq(salesInvoices.id, data.invoiceId))
        } else if (invoice) {
            // Partial
            await db.update(salesInvoices).set({ paidAmount: (parseFloat(invoice.paidAmount || '0') + data.amount).toString() }).where(eq(salesInvoices.id, data.invoiceId))
        }

        // 3. GL Posting: Dr Bank, Cr AR
        // Find GL Account for the selected BankAccount? 
        // Ideally `cashBankAccounts` table should link to `chartOfAccounts` ID.
        // For now, I will fetch "Cash on Hand" or "Bank" COA based on type.
        // Better: Let's assume standard COA: 1010 (Cash), 1020 (Bank).

        const bankAcc = await db.query.cashBankAccounts.findFirst({ where: eq(cashBankAccounts.id, data.bankAccountId) })
        const bankGLCode = bankAcc?.type === 'cash' ? '1010' : '1020'
        const bankGLName = bankAcc?.type === 'cash' ? 'Cash on Hand' : 'Bank Account'

        const bankGLId = await getAccountId(data.companyId, bankGLCode, bankGLName, 'asset')
        const arId = await getAccountId(data.companyId, "1100", "Accounts Receivable", "asset")

        await createJournalEntry({
            userId: data.userId,
            companyId: data.companyId,
            entryDate: data.paymentDate,
            description: `Payment for Invoice #${invoice?.invoiceNumber}`,
            reference: data.reference || `PAY-INV-${data.invoiceId}`,
            lines: [
                { accountId: bankGLId, debit: data.amount, credit: 0, description: `Received into ${bankAcc?.name}` },
                { accountId: arId, debit: 0, credit: data.amount, description: `Payment from Customer` }
            ]
        })

        revalidatePath('/employee')
        return { success: true, message: "Payment Recorded" }
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to record payment" }
    }
}

export async function getCustomerPayments(companyId: number) {
    try {
        const data = await db.query.customerPayments.findMany({
            where: eq(customerPayments.companyId, companyId),
            with: {
                customer: true,
                invoice: true
            },
            orderBy: [desc(customerPayments.paymentDate)]
        })
        return { success: true, data }
    } catch (error) {
        console.error("Error fetching customer payments:", error)
        return { success: false, error: "Failed to fetch payments" }
    }
}

export async function getSupplierPayments(companyId: number) {
    try {
        const data = await db.query.supplierPayments.findMany({
            where: eq(supplierPayments.companyId, companyId),
            with: {
                supplier: true,
                purchaseOrder: true
            },
            orderBy: [desc(supplierPayments.paymentDate)]
        })
        return { success: true, data }
    } catch (error) {
        console.error("Error fetching supplier payments:", error)
        return { success: false, error: "Failed to fetch payments" }
    }
}

export async function recordSupplierPayment(data: {
    userId: number,
    companyId: number,
    supplierId: number,
    purchaseOrderId: number,
    amount: number,
    paymentDate: string,
    method: string,
    reference?: string
    bankAccountId: number // Source of funds
}) {
    try {
        // 1. Record Payment
        await db.insert(supplierPayments).values({
            companyId: data.companyId,
            supplierId: data.supplierId,
            purchaseOrderId: data.purchaseOrderId,
            amount: data.amount.toString(),
            paymentDate: data.paymentDate,
            method: data.method,
            reference: data.reference,
            createdBy: data.userId
        })

        // 2. Update PO Status? (Maybe mark as paid?)
        // purchaseOrders doesn't have 'paidAmount' in schema I saw.
        // But status can be 'paid'.
        // Let's just update status to 'paid' if amount matches?
        // For simplicity, let's keep it 'received' or move to 'completed'.
        // Or if I didn't add paidAmount column, I can't track partials easily.
        // I'll skip PO status update for now, focusing on GL.

        // 3. GL Posting: Dr AP, Cr Bank
        const bankAcc = await db.query.cashBankAccounts.findFirst({ where: eq(cashBankAccounts.id, data.bankAccountId) })
        const bankGLCode = bankAcc?.type === 'cash' ? '1010' : '1020'
        const bankGLName = bankAcc?.type === 'cash' ? 'Cash on Hand' : 'Bank Account'

        const bankGLId = await getAccountId(data.companyId, bankGLCode, bankGLName, 'asset')
        const apId = await getAccountId(data.companyId, "2100", "Accounts Payable", "liability")

        await createJournalEntry({
            userId: data.userId,
            companyId: data.companyId,
            entryDate: data.paymentDate,
            description: `Payment for PO #${data.purchaseOrderId}`, // Need number ideally
            reference: data.reference || `PAY-PO-${data.purchaseOrderId}`,
            lines: [
                { accountId: apId, debit: data.amount, credit: 0, description: `Payment to Supplier` },
                { accountId: bankGLId, debit: 0, credit: data.amount, description: `Paid from ${bankAcc?.name}` }
            ]
        })

        revalidatePath('/employee')
        return { success: true, message: "Payment Sent" }
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to record payment" }
    }
}
