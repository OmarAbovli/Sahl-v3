"use server"

import { db } from "@/db"
import { leads, deals, activities, customers, salesInvoices } from "@/db/schema"
import { eq, and, desc, asc, like, or, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { hasPermission } from "@/actions/permissions"

/**
 * Leads Management
 */
export async function getLeads(companyId: number, query?: string) {
    const permissions = await hasPermission('leads')
    if (!permissions.canView) return { success: false, error: "Unauthorized" }

    try {
        const conditions = [eq(leads.companyId, companyId)]

        if (query) {
            conditions.push(or(
                like(leads.firstName, `%${query}%`),
                like(leads.lastName, `%${query}%`),
                like(leads.companyName, `%${query}%`),
                like(leads.email, `%${query}%`)
            ))
        }

        // Fetch basic leads data using Core API
        const leadList = await db.select().from(leads)
            .where(and(...conditions))
            .orderBy(desc(leads.createdAt))

        if (!leadList.length) return { success: true, data: [] }

        // Fetch related deals and activities separately using Core API
        const leadIds = leadList.map(l => l.id)

        const [allDeals, allActivities] = await Promise.all([
            db.select().from(deals).where(and(eq(deals.companyId, companyId), sql`lead_id IN (${sql.join(leadIds, sql`, `)})`)),
            db.select().from(activities).where(and(eq(activities.companyId, companyId), sql`lead_id IN (${sql.join(leadIds, sql`, `)})`)).orderBy(desc(activities.createdAt))
        ])

        const data = leadList.map(lead => ({
            ...lead,
            deals: allDeals.filter(d => d.leadId === lead.id),
            activities: allActivities.filter(a => a.leadId === lead.id).slice(0, 1)
        }))

        return { success: true, data }
    } catch (error) {
        console.error("Get leads error:", error)
        return { success: false, error: "Failed to fetch leads" }
    }
}

export async function createLead(data: typeof leads.$inferInsert) {
    const permissions = await hasPermission('leads')
    if (!permissions.canCreate) return { success: false, error: "Unauthorized" }

    try {
        await db.insert(leads).values(data)
        revalidatePath("/company-admin/crm/leads")
        return { success: true }
    } catch (error) {
        console.error("Create lead error:", error)
        return { success: false, error: "Failed to create lead" }
    }
}

export async function updateLeadStatus(leadId: number, status: string) {
    const permissions = await hasPermission('leads')
    if (!permissions.canEdit) return { success: false, error: "Unauthorized" }

    try {
        await db.update(leads)
            .set({ status, updatedAt: new Date().toISOString() })
            .where(eq(leads.id, leadId))
        revalidatePath("/company-admin/crm/leads")
        return { success: true }
    } catch (error) {
        console.error("Update lead status error:", error)
        return { success: false, error: "Failed to update lead status" }
    }
}

/**
 * Deals Pipeline
 */
export async function getDeals(companyId: number) {
    const permissions = await hasPermission('sales')
    if (!permissions.canView) return { success: false, error: "Unauthorized" }

    try {
        const dealList = await db.select().from(deals)
            .where(eq(deals.companyId, companyId))
            .orderBy(desc(deals.createdAt))

        if (!dealList.length) return { success: true, data: [] }

        const leadIds = dealList.map(d => d.leadId).filter(Boolean) as number[]
        const customerIds = dealList.map(d => d.customerId).filter(Boolean) as number[]

        const [relatedLeads, relatedCustomers] = await Promise.all([
            leadIds.length ? db.select().from(leads).where(sql`id IN (${sql.join(leadIds, sql`, `)})`) : Promise.resolve([]),
            customerIds.length ? db.select().from(customers).where(sql`id IN (${sql.join(customerIds, sql`, `)})`) : Promise.resolve([])
        ])

        const data = dealList.map(deal => ({
            ...deal,
            lead: relatedLeads.find(l => l.id === deal.leadId),
            customer: relatedCustomers.find(c => c.id === deal.customerId)
        }))

        return { success: true, data }
    } catch (error) {
        console.error("Get deals error:", error)
        return { success: false, error: "Failed to fetch deals" }
    }
}

export async function updateDealStage(dealId: number, stage: string) {
    // This is often open to all sales team members
    try {
        await db.update(deals)
            .set({ stage, updatedAt: new Date().toISOString() })
            .where(eq(deals.id, dealId))
        revalidatePath("/company-admin/crm/pipeline")
        return { success: true }
    } catch (error) {
        console.error("Update deal stage error:", error)
        return { success: false, error: "Failed to update deal stage" }
    }
}

export async function createDeal(data: typeof deals.$inferInsert) {
    try {
        await db.insert(deals).values(data)
        revalidatePath("/company-admin/crm/pipeline")
        return { success: true }
    } catch (error) {
        console.error("Create deal error:", error)
        return { success: false, error: "Failed to create deal" }
    }
}

/**
 * Activities
 */
export async function getActivities(companyId: number, entityType?: 'lead' | 'deal', entityId?: number) {
    try {
        const conditions = [eq(activities.companyId, companyId)]

        if (entityType === 'lead' && entityId) conditions.push(eq(activities.leadId, entityId))
        if (entityType === 'deal' && entityId) conditions.push(eq(activities.dealId, entityId))

        const activityList = await db.select().from(activities)
            .where(and(...conditions))
            .orderBy(desc(activities.createdAt))

        if (!activityList.length) return { success: true, data: [] }

        const leadIds = activityList.map(a => a.leadId).filter(Boolean) as number[]
        const dealIds = activityList.map(a => a.dealId).filter(Boolean) as number[]

        const [relatedLeads, relatedDeals] = await Promise.all([
            leadIds.length ? db.select().from(leads).where(sql`id IN (${sql.join(leadIds, sql`, `)})`) : Promise.resolve([]),
            dealIds.length ? db.select().from(deals).where(sql`id IN (${sql.join(dealIds, sql`, `)})`) : Promise.resolve([])
        ])

        const data = activityList.map(act => ({
            ...act,
            lead: relatedLeads.find(l => l.id === act.leadId),
            deal: relatedDeals.find(d => d.id === act.dealId)
        }))

        return { success: true, data }
    } catch (error) {
        console.error("Get activities error:", error)
        return { success: false, error: "Failed to fetch activities" }
    }
}

export async function logActivity(data: typeof activities.$inferInsert) {
    try {
        await db.insert(activities).values(data)
        revalidatePath("/company-admin/crm")
        return { success: true }
    } catch (error) {
        console.error("Log activity error:", error)
        return { success: false, error: "Failed to log activity" }
    }
}

/**
 * Dashboard Stats
 */
export async function getCRMStats(companyId: number) {
    try {
        const [totalLeads] = await db.select({ count: sql<number>`count(*)` }).from(leads).where(eq(leads.companyId, companyId))
        const [openDeals] = await db.select({ count: sql<number>`count(*)` }).from(deals).where(and(eq(deals.companyId, companyId), sql`${deals.stage} != 'won' AND ${deals.stage} != 'lost'`))
        const [wonDeals] = await db.select({
            count: sql<number>`count(*)`,
            value: sql<number>`COALESCE(SUM(${deals.value}), 0)`
        }).from(deals).where(and(eq(deals.companyId, companyId), eq(deals.stage, 'won')))

        return {
            success: true,
            data: {
                leads: totalLeads.count,
                openDeals: openDeals.count,
                wonValue: wonDeals.value
            }
        }
    } catch (error) {
        return { success: false, error: "Failed to fetch stats" }
    }
}
