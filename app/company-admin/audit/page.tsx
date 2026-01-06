import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { AuditTrailViewer } from "@/components/audit-trail-viewer"
import { getAdminNavItems } from "@/lib/navigation"

export default async function AuditTrailPage() {
    const session = await getSession()

    if (!session || session.role !== 'company_admin' || !session.companyId) {
        redirect("/login")
    }

    const navItems = getAdminNavItems()

    return (
        <DashboardShell userRole={session.role} userName={session.email} navItems={navItems}>
            <div className="container mx-auto py-6">
                <AuditTrailViewer companyId={session.companyId} />
            </div>
        </DashboardShell>
    )
}
