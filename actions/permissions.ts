"use server"

import { db } from "@/db"
import { roles, permissions, rolePermissions, userRoles } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/session"

export async function getRoles(companyId: number) {
    try {
        const data = await db.query.roles.findMany({
            where: eq(roles.companyId, companyId),
            with: {
                rolePermissions: {
                    with: {
                        permission: true
                    }
                }
            }
        })
        return { success: true, data }
    } catch (error) {
        console.error("fetch roles error:", error)
        return { success: false, error: "Failed to fetch roles" }
    }
}

export async function getAllPermissions() {
    try {
        const data = await db.query.permissions.findMany()
        return { success: true, data }
    } catch (error) {
        return { success: false, error: "Failed to fetch permissions" }
    }
}

export async function createRole(companyId: number, name: string, description: string) {
    try {
        const [newRole] = await db.insert(roles).values({
            companyId,
            name,
            description,
            isActive: true
        }).returning()

        revalidatePath("/company-admin/settings")
        return { success: true, data: newRole }
    } catch (error) {
        return { success: false, error: "Failed to create role" }
    }
}

export async function updateRolePermissions(roleId: number, permissionIds: number[]) {
    try {
        // Simple strategy: delete all then insert new
        await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId))

        if (permissionIds.length > 0) {
            await db.insert(rolePermissions).values(
                permissionIds.map(pId => ({
                    roleId,
                    permissionId: pId
                }))
            )
        }

        revalidatePath("/company-admin/settings")
        return { success: true }
    } catch (error) {
        console.error("update role permissions error:", error)
        return { success: false, error: "Failed to update permissions" }
    }
}

export async function deleteRole(roleId: number) {
    try {
        await db.delete(roles).where(eq(roles.id, roleId))
        revalidatePath("/company-admin/settings")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to delete role" }
    }
}

// System Seeding function for permissions
export async function seedBasePermissions() {
    const basePermissions = [
        { name: "view_sales", description: "View Sales Module" },
        { name: "manage_sales", description: "Create/Edit Sales and Invoices" },
        { name: "view_purchasing", description: "View Purchasing Module" },
        { name: "manage_purchasing", description: "Create/Edit Purchases" },
        { name: "view_inventory", description: "View Inventory Module" },
        { name: "manage_inventory", description: "Manage Stock and Products" },
        { name: "view_general_ledger", description: "View General Ledger" },
        { name: "manage_general_ledger", description: "Post Journal Entries" },
        { name: "view_reports", description: "View Financial Reports" },
        { name: "manage_settings", description: "Access Company Settings" },
        { name: "manage_users", description: "Manage Users and Roles" },
        { name: "view_crm", description: "View CRM (Leads & Deals)" },
        { name: "manage_leads", description: "Create/Edit Leads" },
        { name: "manage_crm", description: "Manage Pipeline & Deals" },
        // New HR & Operational Permissions
        { name: "view_hr", description: "Access HR Dashboard & Personnel" },
        { name: "manage_payroll", description: "Process Payroll & Salaries" },
        { name: "manage_attendance", description: "Manage Attendance & Biometrics" },
        { name: "manage_leave_requests", description: "Approve/Reject Leave Requests" },
        { name: "view_assets", description: "View Fixed Assets Ledger" },
        { name: "manage_assets", description: "Register & Depreciate Assets" },
        { name: "manage_company_profile", description: "Update Company Legal/Visual Identity" },
        { name: "view_admin_panel", description: "Access Admin Oversight Tools" }
    ]

    try {
        for (const p of basePermissions) {
            const existing = await db.query.permissions.findFirst({
                where: eq(permissions.name, p.name)
            })
            if (!existing) {
                await db.insert(permissions).values(p)
            }
        }
        return { success: true }
    } catch (error) {
        return { success: false, error: "Seeding failed" }
    }
}

export async function hasPermission(module: string) {
    const user = await getSession()
    if (!user) return { canView: false, canCreate: false, canEdit: false, canDelete: false }

    // Admins have all permissions
    if (user.role === 'company_admin' || user.role === 'super_admin') {
        return {
            canView: true,
            canCreate: true,
            canEdit: true,
            canDelete: true
        }
    }

    // For employees, check specific keys
    const permissions = user.permissions as Record<string, boolean> || {}
    const canView = permissions[`view_${module}`] || permissions[`manage_${module}`] || false
    const canManage = permissions[`manage_${module}`] || false

    return {
        canView,
        canCreate: canManage,
        canEdit: canManage,
        canDelete: canManage
    }
}
