"use server"

import { db } from "@/db"
import { salesInvoices, purchaseInvoices, inventory, employees, auditLogs } from "@/db/schema"
import { eq, sql, desc, and } from "drizzle-orm"

export async function getDashboardStats(companyId: number) {
    try {
        // 1. Total Sales (Lifetime)
        const salesRes = await db.select({ total: sql<string>`sum(total_amount)` })
            .from(salesInvoices)
            .where(eq(salesInvoices.companyId, companyId))

        // 2. Pending Receivables
        const receivablesRes = await db.select({ total: sql<string>`sum(total_amount - paid_amount)` })
            .from(salesInvoices)
            .where(and(eq(salesInvoices.companyId, companyId), sql`status != 'paid'`))

        // 3. Pending Payables
        const payablesRes = await db.select({ total: sql<string>`sum(total_amount - paid_amount)` })
            .from(purchaseInvoices)
            .where(and(eq(purchaseInvoices.companyId, companyId), sql`status != 'paid'`))

        // 4. Counts
        const [empCount] = await db.select({ count: sql<number>`count(*)` })
            .from(employees).where(eq(employees.companyId, companyId))

        const [invCount] = await db.select({ count: sql<number>`count(*)` })
            .from(inventory).where(eq(inventory.companyId, companyId))

        // 5. Monthly Revenue Chart Data (Last 6 months)
        const revenueChart = await db.select({
            month: sql<string>`to_char(invoice_date, 'Mon')`,
            revenue: sql<number>`sum(total_amount)::float`,
            sortKey: sql<string>`to_char(invoice_date, 'YYYY-MM')`
        })
            .from(salesInvoices)
            .where(eq(salesInvoices.companyId, companyId))
            .groupBy(sql`to_char(invoice_date, 'Mon'), to_char(invoice_date, 'YYYY-MM')`)
            .orderBy(sql`to_char(invoice_date, 'YYYY-MM') desc`)
            .limit(6)

        return {
            success: true,
            data: {
                totalSales: parseFloat(salesRes[0]?.total || '0'),
                receivables: parseFloat(receivablesRes[0]?.total || '0'),
                payables: parseFloat(payablesRes[0]?.total || '0'),
                employees: empCount?.count || 0,
                stockItems: invCount?.count || 0,
                revenueChart: revenueChart.reverse()
            }
        }
    } catch (error) {
        console.error("Dashboard stats error:", error)
        return { success: false, error: "Failed to fetch dashboard stats" }
    }
}

export async function getRecentActivity(companyId: number, limit: number = 5) {
    try {
        const logs = await db.query.auditLogs.findMany({
            where: eq(auditLogs.companyId, companyId),
            orderBy: [desc(auditLogs.createdAt)],
            limit
        })
        return { success: true, data: logs }
    } catch (error) {
        return { success: false, error: "Failed to fetch activity" }
    }
}
