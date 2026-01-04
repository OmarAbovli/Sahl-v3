"use server"

import { db } from "@/db"
import { approvals } from "@/db/schema"
import { eq, and, or, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { logAudit } from "@/lib/audit-logger"

export type ApprovalStatus = "pending" | "approved" | "rejected"
export type ApprovalModule =
    | "SALES_INVOICE"
    | "PURCHASE_INVOICE"
    | "JOURNAL_ENTRY"
    | "FIXED_ASSET"
    | "PAYMENT"

/**
 * Request approval for a record
 */
export async function requestApproval(data: {
    companyId: number
    module: ApprovalModule
    recordId: number
    requestedBy: number
}) {
    try {
        const [approval] = await db.insert(approvals).values({
            companyId: data.companyId,
            module: data.module,
            recordId: data.recordId,
            status: "pending",
            requestedBy: data.requestedBy
        }).returning()

        await logAudit({
            companyId: data.companyId,
            userId: data.requestedBy,
            action: "REQUEST_APPROVAL",
            tableName: "approvals",
            recordId: approval.id,
            details: { module: data.module, recordId: data.recordId }
        })

        revalidatePath("/company-admin/approvals")
        return { success: true, data: approval }
    } catch (error) {
        console.error("Request approval error:", error)
        return { success: false, error: "Failed to request approval" }
    }
}

/**
 * Approve a pending request
 */
export async function approveRequest(
    approvalId: number,
    approvedBy: number,
    companyId: number
) {
    try {
        const approval = await db.query.approvals.findFirst({
            where: eq(approvals.id, approvalId)
        })

        if (!approval) {
            return { success: false, error: "Approval not found" }
        }

        if (approval.status !== "pending") {
            return { success: false, error: "Approval already processed" }
        }

        // Prevent self-approval
        if (approval.requestedBy === approvedBy) {
            return { success: false, error: "Cannot approve your own request" }
        }

        const [updated] = await db.update(approvals)
            .set({
                status: "approved",
                approvedBy,
                approvedAt: sql`CURRENT_TIMESTAMP`
            })
            .where(eq(approvals.id, approvalId))
            .returning()

        await logAudit({
            companyId,
            userId: approvedBy,
            action: "APPROVE_REQUEST",
            tableName: "approvals",
            recordId: approvalId,
            details: {
                module: approval.module,
                recordId: approval.recordId
            }
        })

        revalidatePath("/company-admin/approvals")
        return { success: true, data: updated }
    } catch (error) {
        console.error("Approve request error:", error)
        return { success: false, error: "Failed to approve request" }
    }
}

/**
 * Reject a pending request
 */
export async function rejectRequest(
    approvalId: number,
    approvedBy: number,
    companyId: number,
    reason?: string
) {
    try {
        const approval = await db.query.approvals.findFirst({
            where: eq(approvals.id, approvalId)
        })

        if (!approval) {
            return { success: false, error: "Approval not found" }
        }

        if (approval.status !== "pending") {
            return { success: false, error: "Approval already processed" }
        }

        const [updated] = await db.update(approvals)
            .set({
                status: "rejected",
                approvedBy,
                approvedAt: sql`CURRENT_TIMESTAMP`
                // Note: rejectionReason field would need to be added to schema
            })
            .where(eq(approvals.id, approvalId))
            .returning()

        await logAudit({
            companyId,
            userId: approvedBy,
            action: "REJECT_REQUEST",
            tableName: "approvals",
            recordId: approvalId,
            details: {
                module: approval.module,
                recordId: approval.recordId,
                reason
            }
        })

        revalidatePath("/company-admin/approvals")
        return { success: true, data: updated }
    } catch (error) {
        console.error("Reject request error:", error)
        return { success: false, error: "Failed to reject request" }
    }
}

/**
 * Get pending approvals for a company
 */
export async function getPendingApprovals(companyId: number, userId?: number) {
    try {
        const conditions = [
            eq(approvals.companyId, companyId),
            eq(approvals.status, "pending")
        ]

        const data = await db.query.approvals.findMany({
            where: and(...conditions),
            orderBy: [sql`${approvals.requestedAt} DESC`]
        })

        return { success: true, data }
    } catch (error) {
        console.error("Get pending approvals error:", error)
        return { success: false, error: "Failed to fetch pending approvals" }
    }
}

/**
 * Get all approvals (with filters)
 */
export async function getApprovals(filters: {
    companyId: number
    module?: ApprovalModule
    status?: ApprovalStatus
    requestedBy?: number
}) {
    try {
        const conditions = [eq(approvals.companyId, filters.companyId)]

        if (filters.module) {
            conditions.push(eq(approvals.module, filters.module))
        }
        if (filters.status) {
            conditions.push(eq(approvals.status, filters.status))
        }
        if (filters.requestedBy) {
            conditions.push(eq(approvals.requestedBy, filters.requestedBy))
        }

        const data = await db.query.approvals.findMany({
            where: and(...conditions),
            orderBy: [sql`${approvals.requestedAt} DESC`],
            limit: 100
        })

        return { success: true, data }
    } catch (error) {
        console.error("Get approvals error:", error)
        return { success: false, error: "Failed to fetch approvals" }
    }
}

/**
 * Get approval history for a specific record
 */
export async function getApprovalHistory(
    companyId: number,
    module: ApprovalModule,
    recordId: number
) {
    try {
        const data = await db.query.approvals.findMany({
            where: and(
                eq(approvals.companyId, companyId),
                eq(approvals.module, module),
                eq(approvals.recordId, recordId)
            ),
            orderBy: [sql`${approvals.requestedAt} DESC`]
        })

        return { success: true, data }
    } catch (error) {
        console.error("Get approval history error:", error)
        return { success: false, error: "Failed to fetch approval history" }
    }
}

/**
 * Check if a record needs approval
 */
export async function checkApprovalRequired(
    module: ApprovalModule,
    amount?: number
): Promise<boolean> {
    // Approval rules configuration
    const rules: Record<ApprovalModule, { threshold: number | null }> = {
        SALES_INVOICE: { threshold: 50000 },
        PURCHASE_INVOICE: { threshold: 30000 },
        JOURNAL_ENTRY: { threshold: null }, // Always require
        FIXED_ASSET: { threshold: 100000 },
        PAYMENT: { threshold: 50000 }
    }

    const rule = rules[module]
    if (!rule) return false

    // If no threshold, always require approval
    if (rule.threshold === null) return true

    // If amount exceeds threshold, require approval
    return amount ? amount > rule.threshold : false
}

/**
 * Check if record is approved
 */
export async function checkRecordApproved(
    companyId: number,
    module: ApprovalModule,
    recordId: number
): Promise<boolean> {
    try {
        const approval = await db.query.approvals.findFirst({
            where: and(
                eq(approvals.companyId, companyId),
                eq(approvals.module, module),
                eq(approvals.recordId, recordId),
                eq(approvals.status, "approved")
            )
        })

        return !!approval
    } catch (error) {
        console.error("Check record approved error:", error)
        return false
    }
}
