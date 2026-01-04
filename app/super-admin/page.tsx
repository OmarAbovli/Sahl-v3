import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/session"
import { SuperAdminDashboard } from "@/components/super-admin-dashboard"

export default async function SuperAdminPage() {
  try {
    const user = await requireAuth(["super_admin"])
    return <SuperAdminDashboard user={user} />
  } catch (error) {
    redirect("/login")
  }
}
