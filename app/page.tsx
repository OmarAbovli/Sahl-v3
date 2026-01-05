import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const user = await getSession()

  if (user) {
    // Redirect based on role
    switch (user.role) {
      case "super_admin":
        redirect("/super-admin")
      case "company_admin":
        redirect("/company-admin")
      case "employee":
        redirect("/employee")
      default:
        redirect("/login")
    }
  } else {
    redirect("/login")
  }
}
