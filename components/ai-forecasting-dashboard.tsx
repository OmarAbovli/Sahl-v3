"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Brain,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  Lightbulb,
  Calendar,
  Target,
  Zap,
  RefreshCw,
  Download,
  Eye,
  Archive,
} from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import type { User } from "@/lib/database"

interface AIForecastingDashboardProps {
  user: User
}

interface AIReport {
  id: number
  report_type: string
  title: string
  description: string
  results: any
  confidence_score: number
  created_at: string
  generated_by_email: string
}

interface AIInsight {
  id: number
  insight_type: string
  category: string
  title: string
  description: string
  severity: string
  is_read: boolean
  created_at: string
  metadata: any
}

export function AIForecastingDashboard({ user }: AIForecastingDashboardProps) {
  const { t, language, isRTL } = useTranslation()
  const [reports, setReports] = useState<AIReport[]>([])
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [insightsSummary, setInsightsSummary] = useState({
    total: 0,
    unread: 0,
    critical: 0,
    high: 0,
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedReportType, setSelectedReportType] = useState("sales_forecast")
  const [forecastMonths, setForecastMonths] = useState(3)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    fetchReports()
    fetchInsights()
  }, [])

  const fetchReports = async () => {
    try {
      const response = await fetch("/api/ai/reports?limit=10")
      if (response.ok) {
        const data = await response.json()
        setReports(data.reports || [])
      }
    } catch (error) {
      console.error("Error fetching AI reports:", error)
    }
  }

  const fetchInsights = async () => {
    try {
      const response = await fetch("/api/ai/insights?limit=20")
      if (response.ok) {
        const data = await response.json()
        setInsights(data.insights || [])
        setInsightsSummary(data.summary || {})
      }
    } catch (error) {
      console.error("Error fetching AI insights:", error)
    }
  }

  const generateForecast = async () => {
    setIsGenerating(true)
    setError("")

    try {
      const response = await fetch("/api/ai/generate-forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType: selectedReportType,
          forecastMonths: forecastMonths,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        await fetchReports()
        await fetchInsights()
        setActiveTab("reports")
      } else {
        setError(data.error || "Failed to generate forecast")
      }
    } catch (error) {
      setError("An error occurred while generating the forecast")
    } finally {
      setIsGenerating(false)
    }
  }

  const markInsightAsRead = async (insightId: number) => {
    try {
      await fetch("/api/ai/insights", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          insightIds: [insightId],
          action: "mark_read",
        }),
      })
      await fetchInsights()
    } catch (error) {
      console.error("Error marking insight as read:", error)
    }
  }

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case "sales_forecast":
        return t("sales_forecast")
      case "inventory_analysis":
        return t("inventory_analysis")
      case "debt_analysis":
        return t("debt_analysis")
      case "revenue_forecast":
        return t("revenue_forecast")
      default:
        return type
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive"
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "trend":
        return TrendingUp
      case "alert":
        return AlertTriangle
      case "recommendation":
        return Lightbulb
      case "anomaly":
        return Zap
      default:
        return Brain
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US")
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("total")} {t("reports")}
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("ai_insights")}</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insightsSummary.total}</div>
            <p className="text-xs text-muted-foreground">
              {insightsSummary.unread} {t("unread")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("critical")} {t("alerts")}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{insightsSummary.critical}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("high")} Priority</CardTitle>
            <Target className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{insightsSummary.high}</div>
          </CardContent>
        </Card>
      </div>

      {/* Generate New Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            {t("generate_report")}
          </CardTitle>
          <CardDescription>
            {t("ai_analysis")} and {t("forecasting")} for your business data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t("analysis")} {t("type")}
              </label>
              <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales_forecast">{t("sales_forecast")}</SelectItem>
                  <SelectItem value="inventory_analysis">{t("inventory_analysis")}</SelectItem>
                  <SelectItem value="debt_analysis">{t("debt_analysis")}</SelectItem>
                  <SelectItem value="revenue_forecast">{t("revenue_forecast")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                {t("forecast")} {t("period")}
              </label>
              <Select
                value={forecastMonths.toString()}
                onValueChange={(value) => setForecastMonths(Number.parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 {t("month")}</SelectItem>
                  <SelectItem value="3">3 {t("months")}</SelectItem>
                  <SelectItem value="6">6 {t("months")}</SelectItem>
                  <SelectItem value="12">12 {t("months")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={generateForecast} disabled={isGenerating} className="w-full">
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    {t("generating")}...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    {t("generate")}
                  </>
                )}
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Recent Insights */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t("recent")} {t("ai_insights")}
          </CardTitle>
          <CardDescription>{t("latest")} AI-generated insights and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          {insights.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("no_data")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {insights.slice(0, 5).map((insight) => {
                const Icon = getInsightIcon(insight.insight_type)
                return (
                  <div
                    key={insight.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      !insight.is_read ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
                    }`}
                    onClick={() => markInsightAsRead(insight.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="h-5 w-5 mt-0.5 text-blue-600" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{insight.title}</h4>
                          <Badge variant={getSeverityColor(insight.severity) as any}>{insight.severity}</Badge>
                          {!insight.is_read && (
                            <Badge variant="outline" className="text-xs">
                              {t("new")}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{insight.category}</span>
                          <span>{formatDate(insight.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const renderReports = () => (
    <div className="space-y-6">
      {reports.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">{t("no_data")}</h3>
            <p className="text-muted-foreground mb-4">{t("generate")} your first AI report to get started</p>
            <Button onClick={() => setActiveTab("overview")}>
              <Brain className="h-4 w-4 mr-2" />
              {t("generate_report")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      {report.title}
                    </CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{getReportTypeLabel(report.report_type)}</Badge>
                    <Badge variant="secondary">
                      {Math.round(report.confidence_score * 100)}% {t("confidence")}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Summary */}
                  <div>
                    <h4 className="font-medium mb-2">{t("summary")}</h4>
                    <p className="text-sm text-muted-foreground">{report.results.summary}</p>
                  </div>

                  {/* Key Trends */}
                  {report.results.trends && report.results.trends.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">{t("trends")}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {report.results.trends.map((trend: any, index: number) => (
                          <div key={index} className="p-3 bg-muted rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{trend.metric}</span>
                              <div className="flex items-center gap-1">
                                {trend.direction === "up" && <TrendingUp className="h-4 w-4 text-green-600" />}
                                {trend.direction === "down" && (
                                  <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
                                )}
                                {trend.direction === "stable" && <span className="text-gray-500">→</span>}
                                <span
                                  className={`text-sm font-medium ${
                                    trend.direction === "up"
                                      ? "text-green-600"
                                      : trend.direction === "down"
                                        ? "text-red-600"
                                        : "text-gray-600"
                                  }`}
                                >
                                  {trend.change_percentage > 0 ? "+" : ""}
                                  {trend.change_percentage.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Forecasts */}
                  {report.results.forecasts && report.results.forecasts.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">{t("predictions")}</h4>
                      <div className="space-y-2">
                        {report.results.forecasts.slice(0, 3).map((forecast: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                            <span className="text-sm font-medium">{forecast.period}</span>
                            <div className="text-right">
                              <div className="text-sm font-medium">${forecast.predicted_value.toLocaleString()}</div>
                              <div className="text-xs text-muted-foreground">
                                ${forecast.confidence_interval.lower.toLocaleString()} - $
                                {forecast.confidence_interval.upper.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {report.results.recommendations && report.results.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">{t("recommendations")}</h4>
                      <ul className="space-y-1">
                        {report.results.recommendations.slice(0, 3).map((rec: string, index: number) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <Lightbulb className="h-3 w-3 mt-1 text-yellow-500 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-xs text-muted-foreground">
                      {t("generated")} {formatDate(report.created_at)} by {report.generated_by_email}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3 mr-1" />
                        {t("view")} {t("details")}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-3 w-3 mr-1" />
                        {t("download")}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )

  const renderInsights = () => (
    <div className="space-y-6">
      {/* Insights Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{insightsSummary.total}</div>
                <div className="text-xs text-muted-foreground">
                  {t("total")} {t("insights")}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">{insightsSummary.critical}</div>
                <div className="text-xs text-muted-foreground">{t("critical")}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-600">{insightsSummary.high}</div>
                <div className="text-xs text-muted-foreground">{t("high")} Priority</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{insightsSummary.unread}</div>
                <div className="text-xs text-muted-foreground">{t("unread")}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{t("ai_insights")}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchInsights}>
                <RefreshCw className="h-3 w-3 mr-1" />
                {t("refresh")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {insights.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("no_data")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {insights.map((insight) => {
                const Icon = getInsightIcon(insight.insight_type)
                return (
                  <div
                    key={insight.id}
                    className={`p-4 border rounded-lg transition-colors ${
                      !insight.is_read ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="h-5 w-5 mt-0.5 text-blue-600" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{insight.title}</h4>
                          <Badge variant={getSeverityColor(insight.severity) as any}>{insight.severity}</Badge>
                          <Badge variant="outline" className="text-xs">
                            {insight.category}
                          </Badge>
                          {!insight.is_read && (
                            <Badge variant="default" className="text-xs">
                              {t("new")}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>

                        {/* Recommendations */}
                        {insight.metadata?.recommendations && (
                          <div className="mb-3">
                            <h5 className="text-xs font-medium mb-1">{t("recommendations")}:</h5>
                            <ul className="space-y-1">
                              {insight.metadata.recommendations.slice(0, 2).map((rec: string, index: number) => (
                                <li key={index} className="text-xs text-muted-foreground flex items-start gap-1">
                                  <Lightbulb className="h-3 w-3 mt-0.5 text-yellow-500 flex-shrink-0" />
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <div className="text-xs text-muted-foreground">
                            {formatDate(insight.created_at)}
                            {insight.metadata?.confidence && (
                              <span className="ml-2">
                                {Math.round(insight.metadata.confidence * 100)}% {t("confidence")}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {!insight.is_read && (
                              <Button variant="outline" size="sm" onClick={() => markInsightAsRead(insight.id)}>
                                {t("mark")} {t("read")}
                              </Button>
                            )}
                            <Button variant="ghost" size="sm">
                              <Archive className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className={`space-y-6 ${isRTL ? "rtl" : "ltr"}`}>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t("ai_forecasting")}</h1>
          <p className="text-muted-foreground">
            {t("ai_analysis")} and {t("predictive_analytics")} for your business
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">{t("overview")}</TabsTrigger>
          <TabsTrigger value="reports">{t("reports")}</TabsTrigger>
          <TabsTrigger value="insights">
            {t("insights")}
            {insightsSummary.unread > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {insightsSummary.unread}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">{renderOverview()}</TabsContent>

        <TabsContent value="reports">{renderReports()}</TabsContent>

        <TabsContent value="insights">{renderInsights()}</TabsContent>
      </Tabs>
    </div>
  )
}
