import { redirect } from "next/navigation"
export const dynamic = 'force-dynamic'
import { requireAuth } from "@/lib/session"
import { CompanyAdminDashboard } from "@/components/company-admin-dashboard"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { db } from "@/db"
import { users, invoices, inventory } from "@/db/schema"
import { eq, and, sql } from "drizzle-orm"
import { getAdminNavItems } from "@/lib/navigation"

async function getStats(companyId: number) {
  const employeesCount = await db.select({ count: sql<number>`count(*)` })
    .from(users)
    .where(and(eq(users.companyId, companyId), eq(users.role, 'employee')))

  const invoicesCount = await db.select({ count: sql<number>`count(*)` })
    .from(invoices)
    .where(eq(invoices.companyId, companyId))

  const inventoryCount = await db.select({ count: sql<number>`count(*)` })
    .from(inventory)
    .where(eq(inventory.companyId, companyId))

  return {
    employees: Number(employeesCount[0]?.count || 0),
    invoices: Number(invoicesCount[0]?.count || 0),
    inventory: Number(inventoryCount[0]?.count || 0),
  }
}

export default async function CompanyAdminPage() {
  try {
    const user = await requireAuth(["company_admin"])
    const stats = await getStats(user.companyId || 0)
    const navItems = getAdminNavItems()

    return (
      <DashboardShell userRole={user.role} userName={user.email} navItems={navItems}>
        <CompanyAdminDashboard user={user} stats={stats} />
      </DashboardShell>
    )
  } catch (error) {
    redirect("/login")
  }
}
