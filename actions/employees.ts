"use server"

import { db } from "@/db"
import { users, employees, biometricAttendance, userRoles, type User } from "@/db/schema"
import { eq, sql, desc } from "drizzle-orm"
import { hash } from "bcryptjs"
import { generateUniqueKey } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function createEmployee(data: {
    firstName: string
    lastName: string
    email: string
    position: string
    department: string
    companyId: number
    roleId?: number
}) {
    try {
        // 1. Generate Auth Credentials
        const passwordHash = await hash("123456", 10) // Default password
        const uniqueKey = await generateUniqueKey("sahl", "employee") // You might want to make company name dynamic

        // 2. Create User Record (Transactional would be better, but doing sequential for now)
        const [newUser] = await db.insert(users).values({
            uniqueKey,
            email: data.email,
            passwordHash,
            role: "employee",
            companyId: data.companyId,
            isActive: true,
            permissions: { view_dashboard: true }, // Default permissions
        }).returning()

        if (!newUser) throw new Error("Failed to create user account")

        // 3. Create Employee HR Record
        await db.insert(employees).values({
            userId: newUser.id,
            companyId: data.companyId,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email, // Storing here too for HR easy access
            position: data.position,
            department: data.department,
            isActive: true,
            joinedAt: new Date().toISOString(),
        })

        // 4. Assign Role if provided
        if (data.roleId) {
            await db.insert(userRoles).values({
                userId: newUser.id,
                roleId: data.roleId
            })
        }

        revalidatePath("/company-admin/employees")
        return { success: true, uniqueKey }
    } catch (error) {
        console.error("Create employee error:", error)
        return { success: false, error: "Failed to create employee. Email might be duplicate." }
    }
}

export async function toggleUserStatus(userId: number, currentStatus: boolean) {
    try {
        await db.update(users)
            .set({ isActive: !currentStatus })
            .where(eq(users.id, userId))

        revalidatePath("/company-admin/employees")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to update status" }
    }
}

export async function getEmployees(companyId: number) {
    try {
        const data = await db.query.employees.findMany({
            where: eq(employees.companyId, companyId),
            orderBy: [sql`${employees.firstName} ASC`],
            with: {
                user: {
                    with: {
                        userRoles: {
                            with: {
                                role: true
                            }
                        }
                    }
                }
            }
        })
        return { success: true, data }
    } catch (error) {
        return { success: false, error: "Failed to fetch employees" }
    }
}

export async function updateEmployee(id: number, data: any) {
    try {
        // 1. Update HR Record
        await db.update(employees)
            .set({
                firstName: data.firstName,
                lastName: data.lastName,
                position: data.position,
                department: data.department,
                salary: data.salary?.toString(),
                employeeNumber: data.employeeNumber
            })
            .where(eq(employees.id, id))

        const employee = await db.query.employees.findFirst({
            where: eq(employees.id, id)
        })

        if (employee?.userId) {
            // 2. Update User Auth Identity (Email)
            await db.update(users)
                .set({
                    email: data.email,
                    // Note: We don't update uniqueKey, but we could if needed.
                })
                .where(eq(users.id, employee.userId))

            // 3. Update Role if provided
            if (data.roleId) {
                await db.delete(userRoles).where(eq(userRoles.userId, employee.userId))
                await db.insert(userRoles).values({
                    userId: employee.userId,
                    roleId: parseInt(data.roleId)
                })
            }
        }

        revalidatePath("/company-admin/employees")
        revalidatePath("/employee")
        return { success: true }
    } catch (error) {
        console.error("Update employee error:", error)
        return { success: false, error: "Failed to update employee" }
    }
}

export async function adminResetPassword(userId: number, newPassword: string) {
    try {
        const passwordHash = await hash(newPassword, 10)
        await db.update(users)
            .set({ passwordHash })
            .where(eq(users.id, userId))

        return { success: true }
    } catch (error) {
        console.error("Admin reset password error:", error)
        return { success: false, error: "Failed to reset password" }
    }
}

export async function deleteEmployee(id: number) {
    try {
        await db.delete(employees).where(eq(employees.id, id))
        revalidatePath("/employee")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to delete employee" }
    }
}

export async function getAttendanceLogs(companyId: number, limit: number = 100) {
    try {
        const data = await db.query.biometricAttendance.findMany({
            where: eq(biometricAttendance.companyId, companyId),
            with: {
                employee: true
            },
            orderBy: [desc(biometricAttendance.timestamp)],
            limit: limit
        })
        return { success: true, data }
    } catch (error) {
        console.error("Fetch attendance logs error:", error)
        return { success: false, error: "Failed to fetch logs" }
    }
}
