import { getSession } from "@/lib/session"
import { LoginForm } from "@/components/login-form"
import { redirect } from "next/navigation"
import { LanguageSwitcher } from "@/components/language-switcher"

export default async function LoginPage() {
  const user = await getSession()

  if (user) {
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
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

      {/* Ambient Light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Language Switcher Positioned Top Right/Left */}
      <div className="absolute top-8 px-10 w-full flex justify-end z-20">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md p-4 relative z-10 mt-10">
        <LoginForm />

        <div className="mt-12 text-center">
          <p className="text-slate-600 text-[10px] uppercase tracking-widest font-medium">
            Sahl ERP System &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}
