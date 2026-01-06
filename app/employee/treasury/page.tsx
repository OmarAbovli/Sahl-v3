import { redirect } from "next/navigation"
export const dynamic = 'force-dynamic'
import { requireAuth } from "@/lib/session"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { getEmployeeNavItems } from "@/lib/navigation"
import { TreasuryManagement } from "@/components/treasury-management"
import { hasPermission } from "@/lib/auth"

export default async function EmployeeTreasuryPage() {
    try {
        const user = await requireAuth(["employee"])

        // Check if employee has permission to view treasury
        if (!hasPermission(user as any, "view_treasury") && !hasPermission(user as any, "manage_treasury")) {
            redirect("/employee")
        }

        const navItems = getEmployeeNavItems(user as any)
        const canManage = hasPermission(user as any, "manage_treasury")

        return (
            <DashboardShell userRole={user.role} userName={user.email} companyId={user.companyId || undefined} navItems={navItems}>
                <div className="bg-slate-900/50 backdrop-blur-3xl border border-slate-800 p-8 min-h-[calc(100vh-12rem)] shadow-2xl">
                    <TreasuryManagement user={user as any} canManage={canManage} canView={true} />
                </div>
            </DashboardShell>
        )
    } catch (error) {
        redirect("/login")
    }
}
