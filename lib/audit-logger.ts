import { db } from "@/db"
import { auditLogs } from "@/db/schema"
import { eq, and, desc, sql, gte, lte } from "drizzle-orm"

export interface AuditLogData {
    companyId: number
    userId: number
    action: string
    tableName?: string
    recordId?: number
    details?: any
}

/**
 * Core audit logging function
 * Automatically logs critical operations for compliance and troubleshooting
 */
export async function logAudit(data: AuditLogData) {
    try {
        await db.insert(auditLogs).values({
            companyId: data.companyId,
            userId: data.userId,
            action: data.action,
            tableName: data.tableName || null,
            recordId: data.recordId || null,
            details: data.details ? JSON.stringify(data.details) : null
        })
    } catch (error) {
        // Silent failure - audit logging should never break the main operation
        console.error("Audit log error:", error)
    }
}

/**
 * Get audit logs with filters
 */
export async function getAuditLogs(filters: {
    companyId: number
    userId?: number
    action?: string
    tableName?: string
    startDate?: string
    endDate?: string
    limit?: number
}) {
    try {
        const conditions = [eq(auditLogs.companyId, filters.companyId)]

        if (filters.userId) {
            conditions.push(eq(auditLogs.userId, filters.userId))
        }
        if (filters.action) {
            conditions.push(eq(auditLogs.action, filters.action))
        }
        if (filters.tableName) {
            conditions.push(eq(auditLogs.tableName, filters.tableName))
        }
        if (filters.startDate) {
            conditions.push(gte(auditLogs.createdAt, filters.startDate))
        }
        if (filters.endDate) {
            conditions.push(lte(auditLogs.createdAt, filters.endDate))
        }

        const data = await db.query.auditLogs.findMany({
            where: and(...conditions),
            orderBy: [desc(auditLogs.createdAt)],
            limit: filters.limit || 100,
            with: {
                user: {
                    columns: {
                        id: true,
                        email: true
                    }
                }
            }
        })

        return { success: true, data }
    } catch (error) {
        console.error("Get audit logs error:", error)
        return { success: false, error: "Failed to fetch audit logs" }
    }
}

/**
 * Get audit trail for a specific record
 */
export async function getRecordAuditTrail(
    companyId: number,
    tableName: string,
    recordId: number
) {
    try {
        const data = await db.query.auditLogs.findMany({
            where: and(
                eq(auditLogs.companyId, companyId),
                eq(auditLogs.tableName, tableName),
                eq(auditLogs.recordId, recordId)
            ),
            orderBy: [desc(auditLogs.createdAt)],
            with: {
                user: {
                    columns: {
                        id: true,
                        email: true
                    }
                }
            }
        })

        return { success: true, data }
    } catch (error) {
        console.error("Get record audit trail error:", error)
        return { success: false, error: "Failed to fetch record audit trail" }
    }
}

/**
 * Get audit statistics
 */
export async function getAuditStatistics(companyId: number, days: number = 30) {
    try {
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        const stats = await db
            .select({
                action: auditLogs.action,
                count: sql<number>`count(*)::int`
            })
            .from(auditLogs)
            .where(
                and(
                    eq(auditLogs.companyId, companyId),
                    gte(auditLogs.createdAt, startDate.toISOString())
                )
            )
            .groupBy(auditLogs.action)

        return { success: true, data: stats }
    } catch (error) {
        console.error("Get audit statistics error:", error)
        return { success: false, error: "Failed to fetch audit statistics" }
    }
}

/**
 * Delete old audit logs (for GDPR compliance / data retention policies)
 * Typically run as a scheduled job
 */
export async function cleanOldAuditLogs(companyId: number, retentionDays: number = 365) {
    try {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

        const result = await db
            .delete(auditLogs)
            .where(
                and(
                    eq(auditLogs.companyId, companyId),
                    lte(auditLogs.createdAt, cutoffDate.toISOString())
                )
            )

        return { success: true, message: "Old audit logs cleaned" }
    } catch (error) {
        console.error("Clean audit logs error:", error)
        return { success: false, error: "Failed to clean audit logs" }
    }
}
