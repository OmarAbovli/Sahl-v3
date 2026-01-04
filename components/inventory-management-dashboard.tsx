"use client";

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, Package, AlertTriangle, Warehouse, BarChart2, Loader2 } from "lucide-react"

interface User {
  id: number
  email: string
  companyId: number
  role: string
}

interface InventoryManagementDashboardProps {
  user: User
}

export function InventoryManagementDashboard({ user }: InventoryManagementDashboardProps) {
  const [summary, setSummary] = useState([
    { label: "Total Products", value: 0, icon: Package },
    { label: "Total Stock", value: 0, icon: Warehouse },
    { label: "Low Stock Alerts", value: 0, icon: AlertTriangle },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // New: Analytics state
  const [analytics, setAnalytics] = useState<any>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)

  // New: Recent activity state
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [activityLoading, setActivityLoading] = useState(false)
  const [activityError, setActivityError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/employee/reports")
        if (!res.ok) throw new Error("Failed to fetch inventory stats")
        const data = await res.json()
        const stats = data.stats || {}
        setSummary([
          { label: "Total Products", value: stats.totalInventoryItems ?? 0, icon: Package },
          { label: "Total Stock", value: stats.totalWarehouses ?? 0, icon: Warehouse },
          { label: "Low Stock Alerts", value: stats.lowStockItems ?? 0, icon: AlertTriangle },
        ])
      } catch (err: any) {
        setError(err.message || "Unknown error")
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [user.companyId])

  // Fetch analytics from AI endpoint
  useEffect(() => {
    if (!user.companyId) return
    setAnalyticsLoading(true)
    setAnalyticsError(null)
    fetch("/api/ai/generate-forecast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportType: "inventory_analysis", companyId: user.companyId }),
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch analytics")
        return res.json()
      })
      .then(setAnalytics)
      .catch(err => setAnalyticsError(err.message || "Unknown error"))
      .finally(() => setAnalyticsLoading(false))
  }, [user.companyId])

  // Fetch recent inventory activity (placeholder: recent inventory additions)
  useEffect(() => {
    if (!user.companyId) return
    setActivityLoading(true)
    setActivityError(null)
    fetch(`/api/employee/inventory?companyId=${user.companyId}&limit=5`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch recent activity")
        return res.json()
      })
      .then(data => setRecentActivity(data.items || []))
      .catch(err => setActivityError(err.message || "Unknown error"))
      .finally(() => setActivityLoading(false))
  }, [user.companyId])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Inventory Management</h2>
        <p className="text-muted-foreground">Complete control and analytics for all warehouses and products</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading ? (
          <Card><CardContent><div className="py-8 text-center"><Loader2 className="animate-spin inline-block mr-2" />Loading...</div></CardContent></Card>
        ) : error ? (
          <Card><CardContent><div className="py-8 text-center text-red-600">{error}</div></CardContent></Card>
        ) : (
          summary.map((item) => (
            <Card key={item.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">{item.label}</CardTitle>
                <item.icon className="h-6 w-6 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{item.value}</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Analytics Card */}
        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>Stock trends, movement, and valuation</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="h-40 flex items-center justify-center text-muted-foreground"><Loader2 className="animate-spin mr-2" />Loading analytics...</div>
            ) : analyticsError ? (
              <div className="h-40 flex items-center justify-center text-red-600">{analyticsError}</div>
            ) : analytics ? (
              <div className="space-y-2">
                {analytics.summary && (
                  <div className="text-sm text-muted-foreground">{analytics.summary}</div>
                )}
                {analytics.topProducts && analytics.topProducts.length > 0 && (
                  <div>
                    <div className="font-medium mb-1">Top Products:</div>
                    <ul className="list-disc pl-5">
                      {analytics.topProducts.map((p: any, idx: number) => (
                        <li key={idx}>{p.name} ({p.total} units)</li>
                      ))}
                    </ul>
                  </div>
                )}
                {analytics.trends && (
                  <div className="mt-2">
                    <div className="font-medium mb-1">Trends:</div>
                    <div className="text-xs text-muted-foreground">{analytics.trends}</div>
                  </div>
                )}
                {/* Add more analytics as available */}
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-muted-foreground">No analytics available</div>
            )}
          </CardContent>
        </Card>
        {/* Recent Activity Card */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest inventory movements and actions</CardDescription>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="h-40 flex items-center justify-center text-muted-foreground"><Loader2 className="animate-spin mr-2" />Loading activity...</div>
            ) : activityError ? (
              <div className="h-40 flex items-center justify-center text-red-600">{activityError}</div>
            ) : recentActivity && recentActivity.length > 0 ? (
              <ul className="space-y-2">
                {recentActivity.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <BarChart2 className="h-4 w-4 text-blue-500" />
                    <span>{item.product_name || item.name}:</span>
                    <span className="font-medium">{item.quantity} units</span>
                    <span className="text-xs text-muted-foreground">({item.type || item.movement_type})</span>
                    <span className="text-xs text-muted-foreground">{item.created_at ? new Date(item.created_at).toLocaleString() : ""}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="h-40 flex items-center justify-center text-muted-foreground">No recent activity</div>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="flex justify-end pt-4">
        <Button variant="outline">Go to Inventory Table</Button>
      </div>
    </div>
  )
} 