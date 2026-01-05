import { type NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { requireAuth } from "@/lib/session"
import { db } from "@/db"
import { aiReports, aiInsights, invoices, inventory, debts } from "@/db/schema"
import { eq, and, gte, sql as drizzleSql } from "drizzle-orm"
import { aiService } from "@/lib/ai-service"

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(["company_admin", "super_admin"])
    const companyId = user.company_id || user.companyId

    if (!companyId && user.role !== "super_admin") {
      return NextResponse.json({ error: "Company not found" }, { status: 400 })
    }

    const { reportType, forecastMonths = 3, dataSource } = await request.json()

    if (!reportType) {
      return NextResponse.json({ error: "Report type is required" }, { status: 400 })
    }

    let analysisResult
    let title = ""
    let description = ""

    const targetCompanyId = companyId || 1 // For super admin

    switch (reportType) {
      case "sales_forecast":
        // Get sales data (invoices)
        const salesData = await db.select({
          month: drizzleSql`DATE_TRUNC('month', ${invoices.issueDate})`,
          total: drizzleSql`SUM(${invoices.amount})`,
          count: drizzleSql`COUNT(*)`
        })
          .from(invoices)
          .where(and(
            eq(invoices.companyId, targetCompanyId),
            gte(invoices.issueDate, drizzleSql`NOW() - INTERVAL '12 months'`)
          ))
          .groupBy(drizzleSql`DATE_TRUNC('month', ${invoices.issueDate})`)
          .orderBy(drizzleSql`month`)

        analysisResult = await aiService.generateSalesForecast(salesData, forecastMonths)
        title = `Sales Forecast - Next ${forecastMonths} Months`
        description = `AI-generated sales forecast based on historical data analysis`
        break

      case "inventory_analysis":
        const inventoryData = await db.select()
          .from(inventory)
          .where(eq(inventory.companyId, targetCompanyId))

        analysisResult = await aiService.analyzeInventory(inventoryData)
        title = "Inventory Analysis & Optimization"
        description = "AI analysis of current inventory levels and recommendations"
        break

      case "debt_analysis":
        const debtsData = await db.select()
          .from(debts)
          .where(eq(debts.companyId, targetCompanyId))

        analysisResult = await aiService.analyzeDebtCollection(debtsData)
        title = "Debt Collection Analysis"
        description = "AI analysis of debt collection patterns and predictions"
        break

      case "revenue_forecast":
        const revenueData = await db.select({
          month: drizzleSql`DATE_TRUNC('month', ${invoices.issueDate})`,
          total: drizzleSql`SUM(${invoices.amount})`
        })
          .from(invoices)
          .where(and(
            eq(invoices.companyId, targetCompanyId),
            eq(invoices.status, 'paid'),
            gte(invoices.issueDate, drizzleSql`NOW() - INTERVAL '12 months'`)
          ))
          .groupBy(drizzleSql`DATE_TRUNC('month', ${invoices.issueDate})`)
          .orderBy(drizzleSql`month`)

        analysisResult = await aiService.generateSalesForecast(revenueData, forecastMonths)
        title = `Revenue Forecast - Next ${forecastMonths} Months`
        description = "AI-generated revenue forecast based on payment patterns"
        break

      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
    }

    // Save the AI report
    const [report] = await db.insert(aiReports).values({
      companyId: targetCompanyId,
      reportType,
      title,
      description,
      dataPeriodStart: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      dataPeriodEnd: new Date().toISOString().split("T")[0],
      forecastPeriodMonths: forecastMonths,
      analysisData: { dataSource, recordCount: analysisResult.forecasts.length },
      results: analysisResult,
      insights: analysisResult.insights,
      confidenceScore: "0.85",
      generatedBy: user.id,
      createdAt: new Date().toISOString(),
    }).returning()

    // Save insights to ai_insights table
    if (analysisResult.insights && analysisResult.insights.length > 0) {
      await db.insert(aiInsights).values(analysisResult.insights.map((insight: any) => ({
        companyId: targetCompanyId,
        insightType: insight.type,
        category: insight.category,
        title: insight.title,
        description: insight.description,
        severity: insight.severity,
        dataSource: reportType,
        metadata: { confidence: insight.confidence, recommendations: insight.recommendations },
        createdAt: new Date().toISOString(),
      })))
    }

    return NextResponse.json({
      success: true,
      report,
      analysis: analysisResult,
    })
  } catch (error) {
    console.error("Error generating AI forecast:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
