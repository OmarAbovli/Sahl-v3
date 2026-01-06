import { redirect } from "next/navigation"
export const dynamic = 'force-dynamic'
import { requireAuth } from "@/lib/session"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { CompanySettings } from "@/components/company-settings"
import { getAdminNavItems } from "@/lib/navigation"

export default async function SettingsPage() {
    try {
        const user = await requireAuth(["company_admin"])
        const navItems = getAdminNavItems()

        return (
            <DashboardShell userRole={user.role} userName={user.email} companyId={user.companyId || undefined} navItems={navItems}>
                <CompanySettings user={user} />
            </DashboardShell>
        )
    } catch (error) {
        redirect("/login")
    }
}
