"use server"

import { db } from "@/db"
import { auditLogs } from "@/db/schema"
import { desc, eq, and, gte, lte } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

export async function logActivity(data: {
    companyId?: number,
    userId?: number,
    action: string,
    tableName?: string,
    recordId?: number,
    oldValues?: any,
    newValues?: any,
    details?: string,
    severity?: 'info' | 'warning' | 'critical'
}) {
    const headersList = headers()
    const ipAddress = (await headersList).get('x-forwarded-for') || 'unknown'
    const userAgent = (await headersList).get('user-agent') || 'unknown'

    try {
        const [result] = await db.insert(auditLogs).values({
            ...data,
            ipAddress,
            userAgent,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }).returning()

        return result
    } catch (error) {
        console.error("Failed to log activity:", error)
        return null
    }
}

export async function getAuditLogs(params: {
    companyId: number,
    limit?: number,
    offset?: number,
    tableName?: string,
    userId?: number,
    startDate?: string,
    endDate?: string
}) {
    const { companyId, limit = 50, offset = 0, tableName, userId, startDate, endDate } = params

    const conditions = [eq(auditLogs.companyId, companyId)]

    if (tableName) conditions.push(eq(auditLogs.tableName, tableName))
    if (userId) conditions.push(eq(auditLogs.userId, userId))
    if (startDate) conditions.push(gte(auditLogs.createdAt, startDate))
    if (endDate) conditions.push(lte(auditLogs.createdAt, endDate))

    return await db.query.auditLogs.findMany({
        where: and(...conditions),
        orderBy: [desc(auditLogs.createdAt)],
        limit,
        offset,
        with: {
            user: true
        }
    })
}

export async function getAuditDetails(logId: number) {
    return await db.query.auditLogs.findFirst({
        where: eq(auditLogs.id, logId),
        with: {
            user: true
        }
    })
}
