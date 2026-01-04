"use server"

import { db } from "@/db"
import { payrollRuns, payrollRunDetails, employees, attendanceRecords } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function generatePayroll(companyId: number, month: number, year: number, userId: number) {
    try {
        // 1. Check if run exists
        const existingRun = await db.query.payrollRuns.findFirst({
            where: and(
                eq(payrollRuns.companyId, companyId),
                eq(payrollRuns.month, month),
                eq(payrollRuns.year, year)
            )
        })

        if (existingRun) {
            return { success: false, message: "Payroll already generated for this period" }
        }

        // 2. Create Payroll Run Draft
        const [run] = await db.insert(payrollRuns).values({
            companyId,
            month,
            year,
            status: 'draft',
            processedBy: userId
        }).returning()

        // 3. Get all active employees
        const activeEmployees = await db.query.employees.findMany({
            where: and(eq(employees.companyId, companyId), eq(employees.isActive, true))
        })

        let totalAmount = 0

        // 4. Calculate for each employee
        for (const emp of activeEmployees) {
            const basic = Number(emp.salary) || 0
            // Simplified calculation: 
            // In a real app, we would query attendanceRecords for the month to calculate deductions
            // For now, assume 0 deductions/allowances unless configured
            const allowances = 0
            const deductions = 0
            const net = basic + allowances - deductions

            await db.insert(payrollRunDetails).values({
                payrollRunId: run.id,
                employeeId: emp.id,
                basicSalary: basic.toString(),
                allowances: allowances.toString(),
                deductions: deductions.toString(),
                netSalary: net.toString(),
                breakdown: { note: "Auto-generated" }
            })

            totalAmount += net
        }

        // 5. Update Total
        await db.update(payrollRuns)
            .set({ totalAmount: totalAmount.toString() })
            .where(eq(payrollRuns.id, run.id))

        revalidatePath("/company-admin/hr")
        return { success: true, message: "Payroll generated successfully" }
    } catch (error) {
        console.error("Payroll generation error:", error)
        return { success: false, message: "Failed to generate payroll" }
    }
}
