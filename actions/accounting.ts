"use server"

import { db } from "@/db"
import {
    chartOfAccounts,
    journalEntries,
    journalEntryLines,
    companies
} from "@/db/schema"
import { eq, desc, and, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

// --- CHART OF ACCOUNTS ---

export async function getCOA(companyId: number) {
    try {
        const data = await db.query.chartOfAccounts.findMany({
            where: eq(chartOfAccounts.companyId, companyId),
            orderBy: [chartOfAccounts.accountCode]
        })
        return { success: true, data }
    } catch (error) {
        console.error("Error fetching COA:", error)
        return { success: false, error: "Failed to fetch Chart of Accounts" }
    }
}

export async function createAccount(companyId: number, data: any) {
    try {
        await db.insert(chartOfAccounts).values({
            companyId,
            accountCode: data.accountCode,
            accountName: data.accountName,
            accountType: data.accountType,
            parentAccountId: data.parentAccountId ? parseInt(data.parentAccountId) : null,
            isActive: true,
            balance: "0"
        })
        revalidatePath('/employee')
        return { success: true, message: "Account created" }
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to create account" }
    }
}

export async function updateAccount(id: number, data: any) {
    try {
        await db.update(chartOfAccounts).set({
            accountName: data.accountName,
            accountType: data.accountType,
            parentAccountId: data.parentAccountId ? parseInt(data.parentAccountId) : null,
        }).where(eq(chartOfAccounts.id, id))

        revalidatePath('/employee')
        return { success: true, message: "Account updated" }
    } catch (error: any) {
        return { success: false, error: "Failed to update account" }
    }
}

// --- JOURNAL ENTRIES ---

export async function getJournalEntries(companyId: number) {
    try {
        const data = await db.query.journalEntries.findMany({
            where: eq(journalEntries.companyId, companyId),
            with: {
                lines: {
                    with: {
                        account: true
                    }
                },
                creator: true
            },
            orderBy: [desc(journalEntries.entryDate), desc(journalEntries.createdAt)]
        })
        return { success: true, data }
    } catch (error) {
        return { success: false, error: "Failed to fetch journal entries" }
    }
}

interface CreateJournalEntryParams {
    userId: number
    companyId: number
    entryDate: string
    description: string
    reference?: string
    lines: {
        accountId: number
        description?: string
        debit: number
        credit: number
    }[]
}

export async function createJournalEntry(params: CreateJournalEntryParams) {
    try {
        const { userId, companyId, entryDate, description, reference, lines } = params

        // 1. Validate Balance
        const totalDebit = lines.reduce((acc, line) => acc + line.debit, 0)
        const totalCredit = lines.reduce((acc, line) => acc + line.credit, 0)

        // Allow small float point errors? No, this is accounting. Must be exact.
        // We handle this by using epsilon if needed, but visually we enforce it.
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new Error(`Entry is not balanced. Debit: ${totalDebit}, Credit: ${totalCredit}`)
        }

        const entryNum = `JE-${Date.now().toString().slice(-6)}`

        await db.transaction(async (tx) => {
            // 2. Create Header
            const [entry] = await tx.insert(journalEntries).values({
                companyId,
                entryNumber: entryNum,
                entryDate,
                description,
                reference,
                totalDebit: totalDebit.toString(),
                totalCredit: totalCredit.toString(),
                isPosted: true, // Auto-post for now
                createdBy: userId
            }).returning()

            // 3. Create Lines & Update Account Balances
            for (const line of lines) {
                await tx.insert(journalEntryLines).values({
                    journalEntryId: entry.id,
                    accountId: line.accountId,
                    description: line.description || description,
                    debitAmount: line.debit.toString(),
                    creditAmount: line.credit.toString()
                })

                // Update Balance: Asset/Expense (Debit increases), Liability/Equity/Revenue (Credit increases)
                // Actually, standard is: Balance = Debit - Credit.
                // Let's stick to signed balance.
                // But `balance` in schema is just numeric.
                // Convention: Assets/Expenses have positive debit balances.
                // Liabilities/Equity/Income have positive credit balances (essentially negative).
                // WE WILL USE: Balance = Total Debits - Total Credits (Net Debit).
                // So if it's an Asset, it will be positive. If Liability, it will be negative.

                const netChange = line.debit - line.credit

                await tx.update(chartOfAccounts)
                    .set({
                        balance: sql`${chartOfAccounts.balance} + ${netChange.toString()}`
                    })
                    .where(eq(chartOfAccounts.id, line.accountId))
            }
        })

        revalidatePath('/employee')
        return { success: true, message: "Journal Entry posted successfully" }

    } catch (error: any) {
        console.error("Create JE Error:", error)
        return { success: false, error: error.message || "Failed to post entry" }
    }
}

// --- REPORTS ---

export async function getTrialBalance(companyId: number) {
    // Return all accounts with their current balance
    return getCOA(companyId)
}
