import { db } from "@/db"
import {
    salesInvoices,
    purchaseInvoices,
    customers,
    inventory,
    fixedAssets,
    approvals,
    cashBankAccounts,
    aiInsights
} from "@/db/schema"
import { eq, and, gte, lte, sql, desc } from "drizzle-orm"

export type InsightCategory = "financial" | "customer" | "inventory" | "operational"
export type InsightSeverity = "low" | "medium" | "high" | "critical"

interface Insight {
    insightType: string
    category: InsightCategory
    title: string
    description: string
    severity: InsightSeverity
    metadata?: any
    actionUrl?: string
}

/**
 * Main insight generation engine
 */
export async function generateInsights(companyId: number): Promise<Insight[]> {
    const insights: Insight[] = []

    // Run all insight generators in parallel
    const [financial, customer, inventory, operational] = await Promise.all([
        detectFinancialInsights(companyId),
        detectCustomerInsights(companyId),
        detectInventoryInsights(companyId),
        detectOperationalInsights(companyId)
    ])

    insights.push(...financial, ...customer, ...inventory, ...operational)

    // Store insights in database
    for (const insight of insights) {
        try {
            await db.insert(aiInsights).values({
                companyId,
                insightType: insight.insightType,
                category: insight.category,
                title: insight.title,
                description: insight.description,
                severity: insight.severity,
                metadata: insight.metadata ? JSON.stringify(insight.metadata) : null
            })
        } catch (e) {
            // Ignore duplicate insights
        }
    }

    return insights
}

/**
 * Financial Health Insights
 */
async function detectFinancialInsights(companyId: number): Promise<Insight[]> {
    const insights: Insight[] = []
    const today = new Date()
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)

    // Revenue trend analysis
    const [lastMonthRevenue] = await db
        .select({ total: sql<number>`COALESCE(SUM(${salesInvoices.totalAmount}), 0)::numeric` })
        .from(salesInvoices)
        .where(
            and(
                eq(salesInvoices.companyId, companyId),
                gte(salesInvoices.invoiceDate, lastMonth.toISOString().split('T')[0]),
                lte(salesInvoices.invoiceDate, thisMonthStart.toISOString().split('T')[0])
            )
        )

    const [thisMonthRevenue] = await db
        .select({ total: sql<number>`COALESCE(SUM(${salesInvoices.totalAmount}), 0)::numeric` })
        .from(salesInvoices)
        .where(
            and(
                eq(salesInvoices.companyId, companyId),
                gte(salesInvoices.invoiceDate, thisMonthStart.toISOString().split('T')[0])
            )
        )

    if (lastMonthRevenue && thisMonthRevenue) {
        const lastTotal = parseFloat(lastMonthRevenue.total.toString())
        const thisTotal = parseFloat(thisMonthRevenue.total.toString())

        if (lastTotal > 0) {
            const change = ((thisTotal - lastTotal) / lastTotal) * 100

            if (change < -10) {
                insights.push({
                    insightType: "REVENUE_DECLINE",
                    category: "financial",
                    title: "Revenue Declining",
                    description: `Revenue is down ${Math.abs(change).toFixed(1)}% compared to last month (${lastTotal.toLocaleString()} → ${thisTotal.toLocaleString()} EGP)`,
                    severity: change < -20 ? "high" : "medium",
                    metadata: { lastMonth: lastTotal, thisMonth: thisTotal, change },
                    actionUrl: "/company-admin/reports"
                })
            } else if (change > 20) {
                insights.push({
                    insightType: "REVENUE_GROWTH",
                    category: "financial",
                    title: "Strong Revenue Growth",
                    description: `Revenue is up ${change.toFixed(1)}% compared to last month - exceeding expectations!`,
                    severity: "low",
                    metadata: { lastMonth: lastTotal, thisMonth: thisTotal, change }
                })
            }
        }
    }

    // Cash flow warning
    const cashAccounts = await db.query.cashBankAccounts.findMany({
        where: eq(cashBankAccounts.companyId, companyId)
    })

    const totalCash = cashAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance.toString()), 0)
    const cashThreshold = 50000 // Configurable

    if (totalCash < cashThreshold) {
        insights.push({
            insightType: "LOW_CASH_BALANCE",
            category: "financial",
            title: "Cash Balance Warning",
            description: `Total cash balance (${totalCash.toLocaleString()} EGP) is below recommended threshold of ${cashThreshold.toLocaleString()} EGP`,
            severity: totalCash < cashThreshold * 0.5 ? "critical" : "high",
            metadata: { currentBalance: totalCash, threshold: cashThreshold },
            actionUrl: "/company-admin/cash-flow"
        })
    }

    return insights
}

/**
 * Customer Intelligence Insights
 */
async function detectCustomerInsights(companyId: number): Promise<Insight[]> {
    const insights: Insight[] = []

    // Overdue invoices analysis
    const today = new Date().toISOString().split('T')[0]
    const overdueInvoices = await db.query.salesInvoices.findMany({
        where: and(
            eq(salesInvoices.companyId, companyId),
            eq(salesInvoices.status, 'posted'),
            lte(salesInvoices.dueDate, today),
            sql`${salesInvoices.totalAmount} > ${salesInvoices.paidAmount}`
        ),
        with: {
            customer: true
        },
        limit: 100
    })

    if (overdueInvoices.length > 5) {
        const totalOverdue = overdueInvoices.reduce((sum, inv) => {
            const total = parseFloat(inv.totalAmount.toString())
            const paid = parseFloat(inv.paidAmount?.toString() || "0")
            return sum + (total - paid)
        }, 0)

        insights.push({
            insightType: "HIGH_OVERDUE_INVOICES",
            category: "customer",
            title: "High Overdue Invoices",
            description: `${overdueInvoices.length} invoices are overdue with total value of ${totalOverdue.toLocaleString()} EGP`,
            severity: overdueInvoices.length > 10 ? "high" : "medium",
            metadata: { count: overdueInvoices.length, totalAmount: totalOverdue },
            actionUrl: "/company-admin/receivables"
        })
    }

    // High-value customer detection
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    const topCustomers = await db
        .select({
            customerId: salesInvoices.customerId,
            total: sql<number>`SUM(${salesInvoices.totalAmount})::numeric`
        })
        .from(salesInvoices)
        .where(
            and(
                eq(salesInvoices.companyId, companyId),
                gte(salesInvoices.invoiceDate, threeMonthsAgo.toISOString().split('T')[0])
            )
        )
        .groupBy(salesInvoices.customerId)
        .orderBy(desc(sql`SUM(${salesInvoices.totalAmount})`))
        .limit(3)

    for (const customer of topCustomers) {
        const total = parseFloat(customer.total.toString())
        if (total > 100000) { // Threshold for "high-value"
            const customerData = await db.query.customers.findFirst({
                where: eq(customers.id, customer.customerId!)
            })

            if (customerData) {
                insights.push({
                    insightType: "HIGH_VALUE_CUSTOMER",
                    category: "customer",
                    title: "High-Value Customer Identified",
                    description: `${customerData.name} has spent ${total.toLocaleString()} EGP in the last 3 months - consider VIP treatment or loyalty program`,
                    severity: "low",
                    metadata: { customerId: customer.customerId, amount: total, customerName: customerData.name }
                })
            }
        }
    }

    return insights
}

/**
 * Inventory Intelligence Insights
 */
async function detectInventoryInsights(companyId: number): Promise<Insight[]> {
    const insights: Insight[] = []

    // Low stock alerts
    const lowStockItems = await db.query.inventory.findMany({
        where: and(
            eq(inventory.companyId, companyId),
            sql`${inventory.quantity} <= COALESCE(${inventory.reorderPoint}, 10)`
        ),
        limit: 20
    })

    if (lowStockItems.length > 0) {
        insights.push({
            insightType: "LOW_STOCK_ALERT",
            category: "inventory",
            title: "Low Stock Alert",
            description: `${lowStockItems.length} products are below reorder point and need restocking`,
            severity: lowStockItems.length > 5 ? "high" : "medium",
            metadata: {
                count: lowStockItems.length,
                items: lowStockItems.slice(0, 5).map(i => ({ id: i.id, name: i.itemName, qty: i.quantity }))
            },
            actionUrl: "/company-admin/inventory"
        })
    }

    // High quantity stock (potential slow-moving)
    const highStockItems = await db.query.inventory.findMany({
        where: and(
            eq(inventory.companyId, companyId),
            sql`${inventory.quantity} > 1000` // Configurable threshold
        ),
        limit: 10
    })

    if (highStockItems.length > 0) {
        insights.push({
            insightType: "EXCESS_INVENTORY",
            category: "inventory",
            title: "Excess Inventory Detected",
            description: `${highStockItems.length} products have high stock levels - consider promotions to reduce inventory holding costs`,
            severity: "low",
            metadata: {
                count: highStockItems.length,
                items: highStockItems.map(i => ({ id: i.id, name: i.itemName, qty: i.quantity }))
            },
            actionUrl: "/company-admin/inventory"
        })
    }

    return insights
}

/**
 * Operational Intelligence Insights
 */
async function detectOperationalInsights(companyId: number): Promise<Insight[]> {
    const insights: Insight[] = []

    // Pending approvals backlog
    const pendingApprovals = await db.query.approvals.findMany({
        where: and(
            eq(approvals.companyId, companyId),
            eq(approvals.status, 'pending')
        )
    })

    if (pendingApprovals.length > 5) {
        // Check if any are old (>5 days)
        const fiveDaysAgo = new Date()
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)

        const oldApprovals = pendingApprovals.filter(a =>
            new Date(a.requestedAt) < fiveDaysAgo
        )

        if (oldApprovals.length > 0) {
            insights.push({
                insightType: "APPROVAL_BACKLOG",
                category: "operational",
                title: "Approval Workflow Bottleneck",
                description: `${oldApprovals.length} approval requests have been pending for more than 5 days - workflow may be blocked`,
                severity: "high",
                metadata: { total: pendingApprovals.length, overdue: oldApprovals.length },
                actionUrl: "/company-admin/approvals"
            })
        }
    }

    // Depreciation not run
    const lastDepreciationRun = await db.query.fixedAssets.findFirst({
        where: eq(fixedAssets.companyId, companyId),
        orderBy: [desc(fixedAssets.lastDepreciationDate)],
        columns: { lastDepreciationDate: true }
    })

    if (lastDepreciationRun?.lastDepreciationDate) {
        const daysSinceDepreciation = Math.floor(
            (Date.now() - new Date(lastDepreciationRun.lastDepreciationDate).getTime()) / (1000 * 60 * 60 * 24)
        )

        if (daysSinceDepreciation > 35) {
            insights.push({
                insightType: "DEPRECIATION_OVERDUE",
                category: "operational",
                title: "Monthly Depreciation Overdue",
                description: `Fixed asset depreciation hasn't been run for ${daysSinceDepreciation} days - run batch process to update asset values`,
                severity: "medium",
                metadata: { daysSince: daysSinceDepreciation },
                actionUrl: "/company-admin/fixed-assets"
            })
        }
    }

    return insights
}

/**
 * Get active insights for display
 */
export async function getActiveInsights(companyId: number, category?: InsightCategory) {
    try {
        const conditions = [
            eq(aiInsights.companyId, companyId),
            eq(aiInsights.isArchived, false)
        ]

        if (category) {
            conditions.push(eq(aiInsights.category, category))
        }

        const data = await db.query.aiInsights.findMany({
            where: and(...conditions),
            orderBy: [
                sql`CASE ${aiInsights.severity} 
                    WHEN 'critical' THEN 1 
                    WHEN 'high' THEN 2 
                    WHEN 'medium' THEN 3 
                    ELSE 4 END`,
                desc(aiInsights.createdAt)
            ],
            limit: 50
        })

        return { success: true, data }
    } catch (error) {
        console.error("Get insights error:", error)
        return { success: false, error: "Failed to fetch insights" }
    }
}

/**
 * Mark insight as read/archived
 */
export async function updateInsight(insightId: number, updates: { isRead?: boolean; isArchived?: boolean }) {
    try {
        await db.update(aiInsights)
            .set(updates)
            .where(eq(aiInsights.id, insightId))

        return { success: true }
    } catch (error) {
        console.error("Update insight error:", error)
        return { success: false, error: "Failed to update insight" }
    }
}
