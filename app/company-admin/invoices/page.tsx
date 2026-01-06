import { redirect } from "next/navigation"
export const dynamic = 'force-dynamic'
import { requireAuth } from "@/lib/session"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { InvoicesManagement } from "@/components/invoices-management"
import { getAdminNavItems } from "@/lib/navigation"

export default async function AdminInvoicesPage() {
    try {
        const user = await requireAuth(["company_admin"])
        const navItems = getAdminNavItems()

        return (
            <DashboardShell userRole={user.role} userName={user.email} companyId={user.companyId || undefined} navItems={navItems}>
                <InvoicesManagement user={user as any} canManage={true} />
            </DashboardShell>
        )
    } catch (error) {
        redirect("/login")
    }
}
