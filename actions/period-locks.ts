"use server"

import { db } from "@/db"
import { periodLocks } from "@/db/schema"
import { eq, and, or, lte, gte, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { logAudit } from "@/lib/audit-logger"

/**
 * Create a period lock
 */
export async function lockPeriod(data: {
    companyId: number
    periodStart: string
    periodEnd: string
    lockedBy: number
}) {
    try {
        const [lock] = await db.insert(periodLocks).values({
            companyId: data.companyId,
            periodStart: data.periodStart,
            periodEnd: data.periodEnd,
            isLocked: true,
            lockedBy: data.lockedBy
        }).returning()

        await logAudit({
            companyId: data.companyId,
            userId: data.lockedBy,
            action: "LOCK_PERIOD",
            tableName: "period_locks",
            recordId: lock.id,
            details: {
                periodStart: data.periodStart,
                periodEnd: data.periodEnd
            }
        })

        revalidatePath("/company-admin/period-locks")
        return { success: true, data: lock }
    } catch (error) {
        console.error("Lock period error:", error)
        return { success: false, error: "Failed to lock period" }
    }
}

/**
 * Unlock a period (admin override)
 */
export async function unlockPeriod(lockId: number, userId: number, companyId: number) {
    try {
        const lock = await db.query.periodLocks.findFirst({
            where: eq(periodLocks.id, lockId)
        })

        if (!lock) {
            return { success: false, error: "Period lock not found" }
        }

        const [updated] = await db.update(periodLocks)
            .set({
                isLocked: false,
                updatedAt: sql`CURRENT_TIMESTAMP`
            })
            .where(eq(periodLocks.id, lockId))
            .returning()

        await logAudit({
            companyId,
            userId,
            action: "UNLOCK_PERIOD",
            tableName: "period_locks",
            recordId: lockId,
            details: {
                periodStart: lock.periodStart,
                periodEnd: lock.periodEnd,
                warning: "ADMIN_OVERRIDE"
            }
        })

        revalidatePath("/company-admin/period-locks")
        return { success: true, data: updated }
    } catch (error) {
        console.error("Unlock period error:", error)
        return { success: false, error: "Failed to unlock period" }
    }
}

/**
 * Get all period locks for a company
 */
export async function getPeriodLocks(companyId: number) {
    try {
        const data = await db.query.periodLocks.findMany({
            where: eq(periodLocks.companyId, companyId),
            orderBy: [sql`${periodLocks.periodStart} DESC`]
        })

        return { success: true, data }
    } catch (error) {
        console.error("Get period locks error:", error)
        return { success: false, error: "Failed to fetch period locks" }
    }
}

/**
 * Check if a specific date falls within a locked period
 * This is the GUARD function used across all transaction mutations
 */
export async function checkPeriodLocked(
    companyId: number,
    transactionDate: string
): Promise<boolean> {
    try {
        const lock = await db.query.periodLocks.findFirst({
            where: and(
                eq(periodLocks.companyId, companyId),
                eq(periodLocks.isLocked, true),
                lte(periodLocks.periodStart, transactionDate),
                gte(periodLocks.periodEnd, transactionDate)
            )
        })

        return !!lock
    } catch (error) {
        console.error("Check period locked error:", error)
        // On error, be conservative and assume locked
        return true
    }
}

/**
 * Get current unlocked period
 */
export async function getCurrentUnlockedPeriod(companyId: number) {
    try {
        const today = new Date().toISOString().split('T')[0]

        const locked = await checkPeriodLocked(companyId, today)

        if (locked) {
            // Find the earliest unlocked date after locked periods
            const locks = await db.query.periodLocks.findMany({
                where: and(
                    eq(periodLocks.companyId, companyId),
                    eq(periodLocks.isLocked, true)
                ),
                orderBy: [sql`${periodLocks.periodEnd} DESC`]
            })

            const latestLock = locks[0]
            const earliestUnlocked = latestLock
                ? new Date(new Date(latestLock.periodEnd).getTime() + 86400000).toISOString().split('T')[0]
                : today

            return {
                success: true,
                data: {
                    isLocked: true,
                    earliestUnlockedDate: earliestUnlocked
                }
            }
        }

        return {
            success: true,
            data: {
                isLocked: false,
                earliestUnlockedDate: today
            }
        }
    } catch (error) {
        console.error("Get current unlocked period error:", error)
        return { success: false, error: "Failed to determine unlocked period" }
    }
}

/**
 * Suggest next period to lock (e.g., previous month)
 */
export async function suggestNextLockPeriod(companyId: number) {
    try {
        // Get the latest locked period
        const latestLock = await db.query.periodLocks.findFirst({
            where: and(
                eq(periodLocks.companyId, companyId),
                eq(periodLocks.isLocked, true)
            ),
            orderBy: [sql`${periodLocks.periodEnd} DESC`]
        })

        let suggestedStart: string
        let suggestedEnd: string

        if (latestLock) {
            // Suggest the next period after the latest lock
            const nextDay = new Date(latestLock.periodEnd)
            nextDay.setDate(nextDay.getDate() + 1)
            suggestedStart = nextDay.toISOString().split('T')[0]

            // End of that month
            const endOfMonth = new Date(nextDay.getFullYear(), nextDay.getMonth() + 1, 0)
            suggestedEnd = endOfMonth.toISOString().split('T')[0]
        } else {
            // No locks yet, suggest previous month
            const now = new Date()
            const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0)

            suggestedStart = previousMonth.toISOString().split('T')[0]
            suggestedEnd = endOfPreviousMonth.toISOString().split('T')[0]
        }

        return {
            success: true,
            data: {
                periodStart: suggestedStart,
                periodEnd: suggestedEnd
            }
        }
    } catch (error) {
        console.error("Suggest next lock period error:", error)
        return { success: false, error: "Failed to suggest period" }
    }
}
