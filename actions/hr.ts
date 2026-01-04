"use server"

import { db } from "@/db"
import { employees } from "@/db/schema"
import { eq, desc, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function getEmployees(companyId: number) {
    try {
        const data = await db.query.employees.findMany({
            where: eq(employees.companyId, companyId),
            orderBy: [desc(employees.createdAt)]
        })
        return { success: true, employees: data }
    } catch (error) {
        return { success: false, error: "Failed to fetch employees" }
    }
}

export async function createEmployee(data: any) {
    try {
        const [newEmp] = await db.insert(employees).values({
            companyId: data.companyId,
            employeeNumber: data.employee_number,
            firstName: data.first_name,
            lastName: data.last_name,
            position: data.position,
            department: data.department,
            salary: data.salary ? data.salary.toString() : '0',
            hireDate: data.hire_date,
            status: 'active'
        }).returning()

        revalidatePath('/employee')
        return { success: true, employee: newEmp }
    } catch (error: any) {
        console.error("Create Employee Error", error)
        return { success: false, error: error.message || "Failed to create employee" }
    }
}

export async function updateEmployee(id: number, data: any) {
    try {
        // We need to map snake_case from form to camelCase schema if needed, 
        // OR the form sends snake_case but schema is camelCase. 
        // Based on schema view previously: columns are snake_case in DB, but Drizzle uses camelCase keys by default unless defined as such.
        // Let's check schema definition logic in my head: 
        // `firstName: varchar("first_name")` -> property is `firstName`.
        // The component uses `first_name`. I need to map it.

        const [updated] = await db.update(employees).set({
            employeeNumber: data.employee_number,
            firstName: data.first_name,
            lastName: data.last_name,
            position: data.position,
            department: data.department,
            salary: data.salary ? data.salary.toString() : '0',
            hireDate: data.hire_date,
        }).where(eq(employees.id, id)).returning()

        revalidatePath('/employee')
        return { success: true, employee: updated }
    } catch (error) {
        return { success: false, error: "Failed to update employee" }
    }
}

export async function deleteEmployee(id: number) {
    try {
        await db.delete(employees).where(eq(employees.id, id))
        revalidatePath('/employee')
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to delete employee" }
    }
}
