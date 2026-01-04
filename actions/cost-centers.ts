"use server"

import { db } from "@/db"
import { costCenters } from "@/db/schema"
import { eq, and, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function getCostCenters(companyId: number) {
    try {
        const data = await db.query.costCenters.findMany({
            where: eq(costCenters.companyId, companyId),
            orderBy: [sql`${costCenters.code} ASC`]
        })
        return { success: true, data }
    } catch (error) {
        console.error("Fetch cost centers error:", error)
        return { success: false, error: "Failed to fetch cost centers" }
    }
}

export async function createCostCenter(data: {
    companyId: number
    code: string
    name: string
    description?: string
}) {
    try {
        const [newCenter] = await db.insert(costCenters).values({
            companyId: data.companyId,
            code: data.code,
            name: data.name,
            description: data.description || null,
            isActive: true
        }).returning()

        revalidatePath("/company-admin/cost-centers")
        return { success: true, data: newCenter }
    } catch (error: any) {
        console.error("Create cost center error:", error)
        if (error.code === '23505') {
            return { success: false, error: "Cost center code already exists" }
        }
        return { success: false, error: "Failed to create cost center" }
    }
}

export async function updateCostCenter(id: number, data: {
    code?: string
    name?: string
    description?: string
    isActive?: boolean
}) {
    try {
        const [updated] = await db.update(costCenters)
            .set({
                ...data,
                updatedAt: sql`CURRENT_TIMESTAMP`
            })
            .where(eq(costCenters.id, id))
            .returning()

        revalidatePath("/company-admin/cost-centers")
        return { success: true, data: updated }
    } catch (error: any) {
        console.error("Update cost center error:", error)
        if (error.code === '23505') {
            return { success: false, error: "Cost center code already exists" }
        }
        return { success: false, error: "Failed to update cost center" }
    }
}

export async function deleteCostCenter(id: number) {
    try {
        // Soft delete by setting isActive to false
        await db.update(costCenters)
            .set({ isActive: false, updatedAt: sql`CURRENT_TIMESTAMP` })
            .where(eq(costCenters.id, id))

        revalidatePath("/company-admin/cost-centers")
        return { success: true }
    } catch (error) {
        console.error("Delete cost center error:", error)
        return { success: false, error: "Failed to delete cost center" }
    }
}

export async function getCostCenterReport(costCenterId: number, startDate?: string, endDate?: string) {
    try {
        // This will require joining with journal_lines to aggregate totals
        // Placeholder for future enhancement
        const costCenter = await db.query.costCenters.findFirst({
            where: eq(costCenters.id, costCenterId)
        })

        if (!costCenter) {
            return { success: false, error: "Cost center not found" }
        }

        // TODO: Implement financial aggregation logic
        const report = {
            costCenter,
            totalDebits: 0,
            totalCredits: 0,
            netBalance: 0,
            transactionCount: 0
        }

        return { success: true, data: report }
    } catch (error) {
        console.error("Cost center report error:", error)
        return { success: false, error: "Failed to generate report" }
    }
}
