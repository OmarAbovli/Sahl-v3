import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/session"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { InventoryManagement } from "@/components/inventory-management"
import { getAdminNavItems } from "@/lib/navigation"

export default async function AdminInventoryPage() {
    try {
        const user = await requireAuth(["company_admin"])
        const navItems = getAdminNavItems()

        return (
            <DashboardShell userRole={user.role} userName={user.email} navItems={navItems}>
                <InventoryManagement user={user as any} canManage={true} canView={true} />
            </DashboardShell>
        )
    } catch (error) {
        redirect("/login")
    }
}
