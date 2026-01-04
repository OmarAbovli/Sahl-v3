import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/session"
import { EmployeeDashboard } from "@/components/employee-dashboard"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { getEmployeeNavItems } from "@/lib/navigation"

export default async function EmployeePage() {
  try {
    const user = await requireAuth(["employee"])
    const navItems = getEmployeeNavItems(user)

    return (
      <DashboardShell userRole={user.role} userName={user.email} navItems={navItems}>
        <EmployeeDashboard user={user} />
      </DashboardShell>
    )
  } catch (error) {
    redirect("/login")
  }
}
