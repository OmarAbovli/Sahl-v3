"use server"

import { db } from "@/db"
import {
    chartOfAccounts,
    journalEntries,
    journalLines,
    salesInvoices,
    salesInvoiceLines,
    inventory,
    accounts,
    customers // Add customers
} from "@/db/schema"
import { eq, and, sql, desc, sum, gte, lte, gt } from "drizzle-orm" // Add gt
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"

// --- Helper Types ---
interface FinancialMetric {
    label: string
    value: number
    change?: number // Percentage change
    trend?: 'up' | 'down' | 'neutral'
}

interface TrendPoint {
    name: string
    revenue: number
    expenses: number
    profit: number
}

// --- CORE ANALYTICS ENGINE ---

export async function getFinancialMetrics(companyId: number) {
    try {
        // 1. Calculate Revenue (Class 4) and Expenses (Class 5)
        // We need to query journal lines linked to accounts of type 'revenue' and 'expense'

        // This is a heavy query. In a real system, we might use materialized views.
        // For now, we aggregate on the fly.

        const revenueAccounts = await db.query.chartOfAccounts.findMany({
            where: and(eq(chartOfAccounts.companyId, companyId), eq(chartOfAccounts.accountType, 'revenue'))
        })
        const expenseAccounts = await db.query.chartOfAccounts.findMany({
            where: and(eq(chartOfAccounts.companyId, companyId), eq(chartOfAccounts.accountType, 'expense'))
        })

        // Helper to get balance for a list of accounts
        // Revenue is Credit normal (-Balance in some systems, but here we stored +Credit)
        // Let's assume Credit is positive for Revenue in our mental model, but in DB:
        // Journal Line: Debit / Credit columns. 
        // Revenue Balance = Sum(Credit) - Sum(Debit)
        // Expense Balance = Sum(Debit) - Sum(Credit)

        // Optimized way: 
        // SELECT SUM(credit - debit) as balance FROM journal_lines WHERE account_id IN (...)

        const revIds = revenueAccounts.map(a => a.id)
        const expIds = expenseAccounts.map(a => a.id)

        let totalRevenue = 0
        let totalExpenses = 0

        if (revIds.length > 0) {
            const revRes = await db
                .select({ value: sql`SUM(${journalLines.credit} - ${journalLines.debit})` })
                .from(journalLines)
                .where(sql`${journalLines.accountId} IN ${revIds}`)
            totalRevenue = parseFloat(revRes[0]?.value as string) || 0
        }

        if (expIds.length > 0) {
            const expRes = await db
                .select({ value: sql`SUM(${journalLines.debit} - ${journalLines.credit})` })
                .from(journalLines)
                .where(sql`${journalLines.accountId} IN ${expIds}`)
            totalExpenses = parseFloat(expRes[0]?.value as string) || 0
        }

        const netProfit = totalRevenue - totalExpenses
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

        // Cash on Hand (Assets type 'asset' and likely 'Cash' or 'Bank' in name or a specific range)
        // Let's look for accounts starting with '10' (standard liquid assets) or just sum all Assets for now?
        // No, user wants accuracy. 
        // Let's rely on accountType = 'asset' for Total Assets.
        // For Cash, let's look for known cash accounts if possible, or just return Total Assets.
        // Let's return "Net Cash Flow" or "Cash Balance" if we can identify cash accounts.
        // We created '1010' and '1020' in `treasury.ts`.

        const cashAccounts = await db.query.chartOfAccounts.findMany({
            where: and(
                eq(chartOfAccounts.companyId, companyId),
                sql`${chartOfAccounts.accountCode} LIKE '10%'`
            )
        })
        const cashIds = cashAccounts.map(a => a.id)
        let cashBalance = 0
        if (cashIds.length > 0) {
            const cashRes = await db
                .select({ value: sql`SUM(${journalLines.debit} - ${journalLines.credit})` }) // Asset is Dr normal
                .from(journalLines)
                .where(sql`${journalLines.accountId} IN ${cashIds}`)
            cashBalance = parseFloat(cashRes[0]?.value as string) || 0
        }

        return {
            success: true,
            data: {
                revenue: totalRevenue,
                expenses: totalExpenses,
                netProfit,
                profitMargin,
                cashBalance
            }
        }
    } catch (error) {
        console.error("Metrics Error:", error)
        return { success: false, error: "Failed to calc metrics" }
    }
}

export async function getFinancialTrend(companyId: number) {
    try {
        const months = 6
        const result: TrendPoint[] = []

        for (let i = months - 1; i >= 0; i--) {
            const date = subMonths(new Date(), i)
            const start = startOfMonth(date).toISOString()
            const end = endOfMonth(date).toISOString()

            // Query Revenue/Expense for this period
            // We join JournalLines -> JournalEntries to filter by Date

            // This is N+1 queries effectively (looping). For 6 months it's fine.
            // Optimized SQL would use GROUP BY month, but Drizzle GROUP BY with date functions can be tricky across DBs (PG vs SQLite).
            // We use Postgres here so `date_trunc` works.

            // Let's try the loop first for reliability.

            // 1. Get Rev/Exp Account IDs (Cached ideally)
            const revenueAccounts = await db.query.chartOfAccounts.findMany({
                where: and(eq(chartOfAccounts.companyId, companyId), eq(chartOfAccounts.accountType, 'revenue'))
            })
            const revIds = revenueAccounts.map(a => a.id)

            const expenseAccounts = await db.query.chartOfAccounts.findMany({
                where: and(eq(chartOfAccounts.companyId, companyId), eq(chartOfAccounts.accountType, 'expense'))
            })
            const expIds = expenseAccounts.map(a => a.id)

            let revenue = 0
            if (revIds.length > 0) {
                const res = await db.execute(sql`
                    SELECT SUM(jl.credit - jl.debit) as val
                    FROM ${journalLines} jl
                    JOIN ${journalEntries} je ON jl.journal_entry_id = je.id
                    WHERE jl.account_id IN ${revIds}
                    AND je.entry_date >= ${start} AND je.entry_date <= ${end}
                `)
                // Drizzle execute returns raw result. 
                // For 'neondatabase/serverless', it's rows.
                revenue = parseFloat((res.rows[0] as any)?.val) || 0
            }

            let expenses = 0
            if (expIds.length > 0) {
                const res = await db.execute(sql`
                    SELECT SUM(jl.debit - jl.credit) as val
                    FROM ${journalLines} jl
                    JOIN ${journalEntries} je ON jl.journal_entry_id = je.id
                    WHERE jl.account_id IN ${expIds}
                    AND je.entry_date >= ${start} AND je.entry_date <= ${end}
                `)
                expenses = parseFloat((res.rows[0] as any)?.val) || 0
            }

            result.push({
                name: format(date, 'MMM'),
                revenue,
                expenses,
                profit: revenue - expenses
            })
        }

        return { success: true, data: result }

    } catch (error) {
        console.error("Trend Error:", error)
        return { success: false, error: "Failed to fetch trends" }
    }
}

export async function getTopSellingItems(companyId: number) {
    try {
        const data = await db
            .select({
                name: sql<string>`${inventory.itemName}`,
                value: sql<number>`SUM(${salesInvoiceLines.lineTotal})`
            })
            .from(salesInvoiceLines)
            .innerJoin(salesInvoices, eq(salesInvoiceLines.salesInvoiceId, salesInvoices.id))
            .innerJoin(inventory, eq(salesInvoiceLines.inventoryItemId, inventory.id)) // Join inventory to get name
            .where(eq(salesInvoices.companyId, companyId))
            .groupBy(inventory.itemName)
            .orderBy(desc(sql`SUM(${salesInvoiceLines.lineTotal})`))
            .limit(5)

        return { success: true, data }
    } catch (error) {
        return { success: false, error: "Failed to fetch top items" }
    }
}

export async function getBalanceSheet(companyId: number) {
    // Assets = Liabilities + Equity
    try {
        // Fetch All Accounts with Balances
        // Calculated from Journal Lines

        const allAccounts = await db.query.chartOfAccounts.findMany({
            where: eq(chartOfAccounts.companyId, companyId)
        })

        // Calculate balance for each
        const report = {
            assets: [] as any[],
            liabilities: [] as any[],
            equity: [] as any[],
            totalAssets: 0,
            totalLiabilities: 0,
            totalEquity: 0
        }

        for (const acc of allAccounts) {
            const res = await db
                .select({
                    debit: sql`SUM(${journalLines.debit})`,
                    credit: sql`SUM(${journalLines.credit})`
                })
                .from(journalLines)
                .where(eq(journalLines.accountId, acc.id))

            const debit = parseFloat(res[0]?.debit as string) || 0
            const credit = parseFloat(res[0]?.credit as string) || 0

            let balance = 0
            if (acc.accountType === 'asset' || acc.accountType === 'expense') {
                balance = debit - credit
            } else {
                balance = credit - debit
            }

            // Only non-zero accounts? Or all? Let's show all active.

            const item = { code: acc.accountCode, name: acc.accountName, balance }

            if (acc.accountType === 'asset') {
                report.assets.push(item)
                report.totalAssets += balance
            } else if (acc.accountType === 'liability') {
                report.liabilities.push(item)
                report.totalLiabilities += balance
            } else if (acc.accountType === 'equity') {
                report.equity.push(item)
                report.totalEquity += balance
            }
            // Revenue/Expense are for P&L, usually "Retained Earnings" (Equity) captures them in BS.
            // For a live BS, we must calculate Current Year Earnings (Rev - Exp) and add to Equity.
        }

        // Calculate Current Earnings
        const metrics = await getFinancialMetrics(companyId)
        if (metrics.success) {
            const currentEarnings = metrics.data?.netProfit || 0
            report.equity.push({ code: '9999', name: 'Current Year Earnings', balance: currentEarnings })
            report.totalEquity += currentEarnings
        }

        return { success: true, data: report }

    } catch (error) {
        return { success: false, error: "Failed BS" }
    }
}

export async function getExportData(companyId: number, type: string, start?: string, end?: string) {
    try {
        let data: any[] = []
        if (type === 'sales') {
            data = await db.query.salesInvoices.findMany({
                where: eq(salesInvoices.companyId, companyId),
                with: {
                    customer: true
                }
            })
        } else if (type === 'inventory') {
            data = await db.query.inventory.findMany({
                where: eq(inventory.companyId, companyId)
            })
        }
        return { success: true, data }
    } catch (error) {
        console.error("Export Error:", error)
        return { success: false, error: "Failed to export data" }
    }
}

export async function getIncomeStatement(companyId: number) {
    try {
        const revAccs = await db.query.chartOfAccounts.findMany({
            where: and(eq(chartOfAccounts.companyId, companyId), eq(chartOfAccounts.accountType, 'revenue'))
        })
        const expAccs = await db.query.chartOfAccounts.findMany({
            where: and(eq(chartOfAccounts.companyId, companyId), eq(chartOfAccounts.accountType, 'expense'))
        })

        const revenue = []
        let totalRevenue = 0
        for (const acc of revAccs) {
            const res = await db.select({ val: sql`SUM(${journalLines.credit} - ${journalLines.debit})` }).from(journalLines).where(eq(journalLines.accountId, acc.id))
            const bal = parseFloat(res[0]?.val as string) || 0
            if (bal !== 0) {
                revenue.push({ name: acc.accountName, code: acc.accountCode, balance: bal })
                totalRevenue += bal
            }
        }

        const expenses = []
        let totalExpenses = 0
        for (const acc of expAccs) {
            const res = await db.select({ val: sql`SUM(${journalLines.debit} - ${journalLines.credit})` }).from(journalLines).where(eq(journalLines.accountId, acc.id))
            const bal = parseFloat(res[0]?.val as string) || 0
            if (bal !== 0) {
                expenses.push({ name: acc.accountName, code: acc.accountCode, balance: bal })
                totalExpenses += bal
            }
        }

        return {
            success: true,
            data: {
                revenue,
                expenses,
                totalRevenue,
                totalExpenses,
                netIncome: totalRevenue - totalExpenses
            }
        }
    } catch (error) {
        return { success: false, error: "Failed to load income statement" }
    }
}

export async function getCashFlowStatement(companyId: number) {
    try {
        // Simple Cash Flow: Sum of all Dr In / Cr Out from Cash/Bank accounts
        const liquidAccs = await db.query.chartOfAccounts.findMany({
            where: and(eq(chartOfAccounts.companyId, companyId), sql`${chartOfAccounts.accountCode} LIKE '10%'`)
        })
        const ids = liquidAccs.map(a => a.id)
        if (ids.length === 0) return { success: true, data: { inflows: [], outflows: [], totalNet: 0 } }

        const activities = await db.select({
            type: sql`CASE WHEN ${journalLines.debit} > 0 THEN 'inflow' ELSE 'outflow' END`,
            amount: sql`SUM(ABS(${journalLines.debit} - ${journalLines.credit}))`,
            desc: journalEntries.description
        })
            .from(journalLines)
            .innerJoin(journalEntries, eq(journalLines.journalEntryId, journalEntries.id))
            .where(sql`${journalLines.accountId} IN ${ids}`)
            .groupBy(sql`CASE WHEN ${journalLines.debit} > 0 THEN 'inflow' ELSE 'outflow' END`, journalEntries.description)
            .limit(20)

        const inflows = activities.filter((a: any) => a.type === 'inflow')
        const outflows = activities.filter((a: any) => a.type === 'outflow')

        const totalIn = inflows.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0)
        const totalOut = outflows.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0)

        return {
            success: true,
            data: {
                inflows,
                outflows,
                totalNet: totalIn - totalOut
            }
        }
    } catch (error) {
        return { success: false, error: "Failed to load cash flow" }
    }
}
