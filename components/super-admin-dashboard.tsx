"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { LogOut, Building2, Users, Plus, Settings } from "lucide-react"
import { CreateCompanyDialog } from "@/components/create-company-dialog"
import { CreateUserDialog } from "@/components/create-user-dialog"
import { CompaniesTable } from "@/components/companies-table"
import { UsersTable } from "@/components/users-table"
import { SupportTicketsTable } from "@/components/support-tickets-table"
import type { User, Company } from "@/lib/database"
import { LanguageSwitcher } from "@/components/language-switcher"
import { AIForecastingDashboard } from "@/components/ai-forecasting-dashboard"
import { useTranslation } from "@/hooks/use-translation"

interface SuperAdminDashboardProps {
  user: User
}

export function SuperAdminDashboard({ user }: SuperAdminDashboardProps) {
  const { t, isRTL } = useTranslation()
  const [companies, setCompanies] = useState<Company[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalUsers: 0,
    activeUsers: 0,
    expiringSoon: 0,
  })
  const [isCreateCompanyOpen, setIsCreateCompanyOpen] = useState(false)
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [companiesRes, usersRes, statsRes] = await Promise.all([
        fetch("/api/super-admin/companies"),
        fetch("/api/super-admin/users"),
        fetch("/api/super-admin/stats"),
      ])

      if (companiesRes.ok) {
        const companiesData = await companiesRes.json()
        setCompanies(companiesData.companies)
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.users)
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.stats)
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? "rtl" : ""}`}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Settings className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t("dashboard")}</h1>
                <p className="text-sm text-gray-500">
                  {t("welcome")}, {user.email}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">Super Admin</Badge>
              <LanguageSwitcher />
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                {t("logout")}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("total")} {t("companies")}
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCompanies}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("total")} {t("users")}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("active")} {t("users")}
              </CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <Users className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.expiringSoon}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="companies" className="space-y-6">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="companies">{t("companies")}</TabsTrigger>
              <TabsTrigger value="users">{t("users")}</TabsTrigger>
              <TabsTrigger value="support">Support Tickets</TabsTrigger>
              <TabsTrigger value="ai-forecasting">{t("ai_forecasting")}</TabsTrigger>
            </TabsList>

            <div className="flex space-x-2">
              <Button onClick={() => setIsCreateCompanyOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t("create")} {t("companies")}
              </Button>
              <Button onClick={() => setIsCreateUserOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t("create")} {t("users")}
              </Button>
            </div>
          </div>

          <TabsContent value="companies">
            <Card>
              <CardHeader>
                <CardTitle>{t("companies")}</CardTitle>
                <CardDescription>Manage all companies in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <CompaniesTable companies={companies} onRefresh={fetchDashboardData} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>{t("users")}</CardTitle>
                <CardDescription>Manage all user accounts across companies</CardDescription>
              </CardHeader>
              <CardContent>
                <UsersTable users={users} companies={companies} onRefresh={fetchDashboardData} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support">
            <Card>
              <CardHeader>
                <CardTitle>Support Tickets</CardTitle>
                <CardDescription>Review and respond to support requests from company admins</CardDescription>
              </CardHeader>
              <CardContent>
                <SupportTicketsTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-forecasting">
            <Card>
              <CardHeader>
                <CardTitle>{t("ai_forecasting")}</CardTitle>
                <CardDescription>Advanced analytics and business intelligence</CardDescription>
              </CardHeader>
              <CardContent>
                <AIForecastingDashboard user={user} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialogs */}
      <CreateCompanyDialog
        open={isCreateCompanyOpen}
        onOpenChange={setIsCreateCompanyOpen}
        onSuccess={fetchDashboardData}
      />

      <CreateUserDialog
        open={isCreateUserOpen}
        onOpenChange={setIsCreateUserOpen}
        companies={companies}
        onSuccess={fetchDashboardData}
      />
    </div>
  )
}
