"use server"

import { db } from "@/db"
import { attendanceRecords, employees } from "@/db/schema"
import { eq, and, desc, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function checkIn(employeeId: number, companyId: number) {
    try {
        const today = new Date().toISOString().split('T')[0]

        // Check if already checked in
        const existing = await db.query.attendanceRecords.findFirst({
            where: and(
                eq(attendanceRecords.employeeId, employeeId),
                eq(attendanceRecords.date, today)
            )
        })

        if (existing) {
            return { success: false, message: "Already checked in for today" }
        }

        // Determine status based on time (Simplified logic: Late if after 9:30 AM)
        const now = new Date()
        const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 30)

        await db.insert(attendanceRecords).values({
            companyId,
            employeeId,
            date: today,
            checkIn: now.toISOString(),
            status: isLate ? 'late' : 'present'
        })

        revalidatePath("/company-admin/hr")
        return { success: true, message: "Checked in successfully" }
    } catch (error) {
        console.error("Check-in error:", error)
        return { success: false, message: "Failed to check in" }
    }
}

export async function checkOut(employeeId: number) {
    try {
        const today = new Date().toISOString().split('T')[0]

        const record = await db.query.attendanceRecords.findFirst({
            where: and(
                eq(attendanceRecords.employeeId, employeeId),
                eq(attendanceRecords.date, today)
            )
        })

        if (!record) {
            return { success: false, message: "No check-in record found for today" }
        }

        await db.update(attendanceRecords)
            .set({ checkOut: new Date().toISOString() })
            .where(eq(attendanceRecords.id, record.id))

        revalidatePath("/company-admin/hr")
        return { success: true, message: "Checked out successfully" }
    } catch (error) {
        console.error("Check-out error:", error)
        return { success: false, message: "Failed to check out" }
    }
}

export async function getAttendanceStats(companyId: number) {
    const today = new Date().toISOString().split('T')[0]

    // Get total active employees
    const totalEmployees = await db.query.employees.findMany({
        where: and(eq(employees.companyId, companyId), eq(employees.isActive, true))
    })

    // Get today's records
    const todayRecords = await db.query.attendanceRecords.findMany({
        where: and(eq(attendanceRecords.companyId, companyId), eq(attendanceRecords.date, today))
    })

    const present = todayRecords.length
    const late = todayRecords.filter(r => r.status === 'late').length
    const absent = totalEmployees.length - present

    return {
        total: totalEmployees.length,
        present,
        late,
        absent,
        records: todayRecords
    }
}
