import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/session"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { EmployeesManagement } from "@/components/employees-management"
import { getAdminNavItems } from "@/lib/navigation"

export default async function EmployeesPage() {
    try {
        const user = await requireAuth(["company_admin"])
        const navItems = getAdminNavItems()

        return (
            <DashboardShell userRole={user.role} userName={user.email} navItems={navItems}>
                <EmployeesManagement user={user as any} canManage={true} />
            </DashboardShell>
        )
    } catch (error) {
        redirect("/login")
    }
}
