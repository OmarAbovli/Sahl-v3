"use server"

import { db } from "@/db"
import {
    cashBankAccounts,
    customerPayments,
    supplierPayments,
    salesInvoices,
    purchaseInvoices,
    chartOfAccounts,
    treasurySessions,
    treasuryTransfers,
    users
} from "@/db/schema"
import { eq, and, sql, desc, ne } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { createJournalEntry, getCOA } from "@/actions/accounting"

// --- TREASURY SESSIONS (SHIFTS) ---

export async function getActiveTreasurySession(userId: number, companyId: number) {
    try {
        const session = await db.query.treasurySessions.findFirst({
            where: and(
                eq(treasurySessions.userId, userId),
                eq(treasurySessions.companyId, companyId),
                eq(treasurySessions.status, 'open')
            )
        })
        return { success: true, data: session }
    } catch (error) {
        return { success: false, error: "Failed to fetch session" }
    }
}

export async function getAllTreasurySessions(companyId: number) {
    try {
        const sessions = await db.query.treasurySessions.findMany({
            where: eq(treasurySessions.companyId, companyId),
            with: {
                user: true
            },
            orderBy: [desc(treasurySessions.openedAt)]
        })
        return { success: true, data: sessions }
    } catch (error) {
        return { success: false, error: "Failed to fetch all sessions" }
    }
}

export async function openTreasurySession(data: {
    userId: number,
    companyId: number,
    openingBalance: number,
    currency?: string,
    notes?: string
}) {
    try {
        const [session] = await db.insert(treasurySessions).values({
            companyId: data.companyId,
            userId: data.userId,
            openingBalance: data.openingBalance.toString(),
            expectedClosingBalance: data.openingBalance.toString(), // Start with opening
            currency: data.currency || 'EGP',
            status: 'open',
            notes: data.notes
        }).returning()

        revalidatePath('/company-admin/accounting')
        revalidatePath('/employee/treasury')
        return { success: true, data: session }
    } catch (error) {
        return { success: false, error: "Failed to open session" }
    }
}

export async function closeTreasurySession(data: {
    sessionId: number,
    actualBalance: number,
    notes?: string
}) {
    try {
        const session = await db.query.treasurySessions.findFirst({
            where: eq(treasurySessions.id, data.sessionId)
        })

        if (!session) throw new Error("Session not found")

        const diff = data.actualBalance - parseFloat(session.expectedClosingBalance || '0')

        await db.update(treasurySessions).set({
            actualClosingBalance: data.actualBalance.toString(),
            difference: diff.toString(),
            status: 'closed',
            closedAt: new Date().toISOString(),
            notes: data.notes
        }).where(eq(treasurySessions.id, data.sessionId))

        revalidatePath('/company-admin/accounting')
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to close session" }
    }
}

// --- VAULT TRANSFERS ---

export async function getTreasuryTransfers(companyId: number) {
    try {
        const data = await db.query.treasuryTransfers.findMany({
            where: eq(treasuryTransfers.companyId, companyId),
            orderBy: [desc(treasuryTransfers.createdAt)]
        })
        return { success: true, data }
    } catch (error) {
        return { success: false, error: "Failed to fetch transfers" }
    }
}

export async function createTreasuryTransfer(data: {
    userId: number,
    companyId: number,
    fromUserId?: number,
    toUserId?: number,
    fromAccountId?: number,
    toAccountId?: number,
    amount: number,
    currency?: string,
    conversionRate?: number,
    type: string,
    reference?: string,
    notes?: string
}) {
    try {
        await db.insert(treasuryTransfers).values({
            companyId: data.companyId,
            fromUserId: data.fromUserId,
            toUserId: data.toUserId,
            fromAccountId: data.fromAccountId,
            toAccountId: data.toAccountId,
            amount: data.amount.toString(),
            currency: data.currency || 'EGP',
            conversionRate: (data.conversionRate || 1).toString(),
            type: data.type,
            status: 'pending',
            reference: data.reference,
            notes: data.notes,
            createdBy: data.userId
        })

        revalidatePath('/company-admin/accounting')
        revalidatePath('/employee/treasury')
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to create transfer" }
    }
}

export async function approveTreasuryTransfer(transferId: number, userId: number) {
    try {
        const transfer = await db.query.treasuryTransfers.findFirst({
            where: eq(treasuryTransfers.id, transferId)
        })

        if (!transfer) throw new Error("Transfer not found")

        // 1. Update status
        await db.update(treasuryTransfers).set({
            status: 'completed',
            updatedAt: new Date().toISOString()
        }).where(eq(treasuryTransfers.id, transferId))

        const amountNum = parseFloat(transfer.amount)
        const rateNum = parseFloat(transfer.conversionRate || '1')
        const convertedAmount = amountNum * rateNum

        // 2. Update Bank Account balances
        if (transfer.fromAccountId) {
            const acc = await db.query.cashBankAccounts.findFirst({ where: eq(cashBankAccounts.id, transfer.fromAccountId) })
            if (acc) {
                const newBalance = (parseFloat(acc.balance || '0') - amountNum).toString()
                await db.update(cashBankAccounts).set({ balance: newBalance }).where(eq(cashBankAccounts.id, transfer.fromAccountId))
            }
        }
        if (transfer.toAccountId) {
            const acc = await db.query.cashBankAccounts.findFirst({ where: eq(cashBankAccounts.id, transfer.toAccountId) })
            if (acc) {
                const newBalance = (parseFloat(acc.balance || '0') + amountNum).toString()
                await db.update(cashBankAccounts).set({ balance: newBalance }).where(eq(cashBankAccounts.id, transfer.toAccountId))
            }
        }

        // 3. Update User Vault (Treasury Sessions) balances
        if (transfer.fromUserId) {
            const session = await db.query.treasurySessions.findFirst({
                where: and(
                    eq(treasurySessions.userId, transfer.fromUserId),
                    eq(treasurySessions.companyId, transfer.companyId),
                    eq(treasurySessions.status, 'open')
                )
            })
            if (session) {
                const newExpBalance = (parseFloat(session.expectedClosingBalance || '0') - convertedAmount).toString()
                await db.update(treasurySessions).set({ expectedClosingBalance: newExpBalance }).where(eq(treasurySessions.id, session.id))
            }
        }
        if (transfer.toUserId) {
            const session = await db.query.treasurySessions.findFirst({
                where: and(
                    eq(treasurySessions.userId, transfer.toUserId),
                    eq(treasurySessions.companyId, transfer.companyId),
                    eq(treasurySessions.status, 'open')
                )
            })
            if (session) {
                const newExpBalance = (parseFloat(session.expectedClosingBalance || '0') + convertedAmount).toString()
                await db.update(treasurySessions).set({ expectedClosingBalance: newExpBalance }).where(eq(treasurySessions.id, session.id))
            }
        }

        revalidatePath('/company-admin/accounting')
        revalidatePath('/employee/treasury')
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to approve transfer" }
    }
}

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

export async function getAllCompanyUsers(companyId: number) {
    try {
        const data = await db.query.users.findMany({
            where: eq(users.companyId, companyId),
            columns: {
                id: true,
                email: true,
                role: true
            }
        })
        return { success: true, data }
    } catch (error) {
        return { success: false, error: "Failed to fetch users" }
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
