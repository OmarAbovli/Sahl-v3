"use client"
import { useTranslation } from "@/hooks/use-translation"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Users, Package, Warehouse } from "lucide-react"
import type { User } from "@/lib/database"

interface ReportsViewProps {
  user: User
}

interface ReportStats {
  totalEmployees: number
  totalInvoices: number
  totalRevenue: number
  pendingInvoices: number
  totalInventoryItems: number
  totalWarehouses: number
  lowStockItems: number
  overdueInvoices: number
}

export function ReportsView({ user }: ReportsViewProps) {
  const { t, isRTL } = useTranslation()
  const [stats, setStats] = useState<ReportStats>({
    totalEmployees: 0,
    totalInvoices: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
    totalInventoryItems: 0,
    totalWarehouses: 0,
    lowStockItems: 0,
    overdueInvoices: 0,
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/employee/reports")
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats || {})
      }
    } catch (error) {
      console.error("Error fetching reports:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const reportCards = [
    {
      title: "Total Employees",
      value: stats.totalEmployees,
      icon: Users,
      description: "Active employees in the company",
      color: "text-blue-600",
    },
    {
      title: "Total Revenue",
      value: `${t('currency_symbol')} ${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      description: "Total revenue from paid invoices",
      color: "text-green-600",
    },
    {
      title: "Total Invoices",
      value: stats.totalInvoices,
      icon: BarChart3,
      description: `${stats.pendingInvoices} pending, ${stats.overdueInvoices} overdue`,
      color: "text-purple-600",
    },
    {
      title: "Inventory Items",
      value: stats.totalInventoryItems,
      icon: Package,
      description: `${stats.lowStockItems} items with low stock`,
      color: "text-orange-600",
    },
    {
      title: "Warehouses",
      value: stats.totalWarehouses,
      icon: Warehouse,
      description: "Active warehouse locations",
      color: "text-indigo-600",
    },
  ]

  const alerts = [
    ...(stats.overdueInvoices > 0
      ? [
        {
          type: "warning" as const,
          title: "Overdue Invoices",
          message: `${stats.overdueInvoices} invoices are overdue and need attention`,
          icon: TrendingDown,
        },
      ]
      : []),
    ...(stats.lowStockItems > 0
      ? [
        {
          type: "warning" as const,
          title: "Low Stock Alert",
          message: `${stats.lowStockItems} items are running low on stock`,
          icon: Package,
        },
      ]
      : []),
    ...(stats.pendingInvoices > 0
      ? [
        {
          type: "info" as const,
          title: "Pending Invoices",
          message: `${stats.pendingInvoices} invoices are pending payment`,
          icon: TrendingUp,
        },
      ]
      : []),
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Business Reports & Analytics
          </CardTitle>
          <CardDescription>Overview of key business metrics and performance indicators</CardDescription>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {reportCards.map((card, index) => {
          const Icon = card.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Alerts & Notifications</CardTitle>
            <CardDescription>Important items that require attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert, index) => {
                const Icon = alert.icon
                return (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    <Icon
                      className={`h-5 w-5 mt-0.5 ${alert.type === "warning" ? "text-orange-500" : "text-blue-500"}`}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{alert.title}</div>
                      <div className="text-sm text-muted-foreground">{alert.message}</div>
                    </div>
                    <Badge variant={alert.type === "warning" ? "destructive" : "secondary"}>
                      {alert.type === "warning" ? "Action Required" : "Info"}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>Quick overview of current business status</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading reports...</div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Financial Health</h4>
                  <p className="text-sm text-muted-foreground">
                    Total revenue of {t('currency_symbol')}{stats.totalRevenue.toLocaleString()} with {stats.pendingInvoices} pending
                    invoices.
                    {stats.overdueInvoices > 0 && ` ${stats.overdueInvoices} invoices are overdue.`}
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Operations</h4>
                  <p className="text-sm text-muted-foreground">
                    {stats.totalEmployees} active employees across {stats.totalWarehouses} warehouses managing{" "}
                    {stats.totalInventoryItems} inventory items.
                    {stats.lowStockItems > 0 && ` ${stats.lowStockItems} items need restocking.`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
