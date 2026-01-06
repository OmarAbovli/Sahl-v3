import { redirect } from "next/navigation"
export const dynamic = 'force-dynamic'
import { requireAuth } from "@/lib/session"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { getAdminNavItems } from "@/lib/navigation"
import { ManufacturingManagement } from "@/components/manufacturing-management"

export default async function AdminManufacturingPage() {
    try {
        const user = await requireAuth(["company_admin", "admin"])
        const navItems = getAdminNavItems()

        return (
            <DashboardShell userRole={user.role} userName={user.email} companyId={user.companyId || undefined} navItems={navItems}>
                <div className="bg-slate-900/50 backdrop-blur-3xl border border-slate-800 p-8 min-h-[calc(100vh-12rem)] shadow-2xl">
                    <ManufacturingManagement user={user as any} canManage={true} />
                </div>
            </DashboardShell>
        )
    } catch (error) {
        redirect("/login")
    }
}
