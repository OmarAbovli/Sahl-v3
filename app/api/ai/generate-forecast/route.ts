import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/session"
import { sql } from "@/lib/database"
import { aiService } from "@/lib/ai-service"

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(["company_admin", "super_admin"])

    if (!user.company_id && user.role !== "super_admin") {
      return NextResponse.json({ error: "Company not found" }, { status: 400 })
    }

    const { reportType, forecastMonths = 3, dataSource } = await request.json()

    if (!reportType) {
      return NextResponse.json({ error: "Report type is required" }, { status: 400 })
    }

    let analysisResult
    let title = ""
    let description = ""

    const companyId = user.company_id || 1 // For super admin, use a default or handle differently

    switch (reportType) {
      case "sales_forecast":
        // Get sales data (invoices)
        const salesData = await sql`
          SELECT 
            DATE_TRUNC('month', issue_date) as month,
            SUM(amount) as total,
            COUNT(*) as count
          FROM invoices 
          WHERE company_id = ${companyId}
            AND issue_date >= NOW() - INTERVAL '12 months'
          GROUP BY DATE_TRUNC('month', issue_date)
          ORDER BY month
        `

        analysisResult = await aiService.generateSalesForecast(salesData, forecastMonths)
        title = `Sales Forecast - Next ${forecastMonths} Months`
        description = `AI-generated sales forecast based on historical data analysis`
        break

      case "inventory_analysis":
        // Get inventory data
        const inventoryData = await sql`
          SELECT * FROM inventory 
          WHERE company_id = ${companyId}
        `

        analysisResult = await aiService.analyzeInventory(inventoryData)
        title = "Inventory Analysis & Optimization"
        description = "AI analysis of current inventory levels and recommendations"
        break

      case "debt_analysis":
        // Get debt data
        const debtsData = await sql`
          SELECT * FROM debts 
          WHERE company_id = ${companyId}
        `

        analysisResult = await aiService.analyzeDebtCollection(debtsData)
        title = "Debt Collection Analysis"
        description = "AI analysis of debt collection patterns and predictions"
        break

      case "revenue_forecast":
        // Get revenue data from paid invoices
        const revenueData = await sql`
          SELECT 
            DATE_TRUNC('month', issue_date) as month,
            SUM(amount) as total
          FROM invoices 
          WHERE company_id = ${companyId}
            AND status = 'paid'
            AND issue_date >= NOW() - INTERVAL '12 months'
          GROUP BY DATE_TRUNC('month', issue_date)
          ORDER BY month
        `

        analysisResult = await aiService.generateSalesForecast(revenueData, forecastMonths)
        title = `Revenue Forecast - Next ${forecastMonths} Months`
        description = "AI-generated revenue forecast based on payment patterns"
        break

      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
    }

    // Save the AI report
    const report = await sql`
      INSERT INTO ai_reports (
        company_id, report_type, title, description, 
        data_period_start, data_period_end, forecast_period_months,
        analysis_data, results, insights, confidence_score, generated_by
      )
      VALUES (
        ${companyId}, ${reportType}, ${title}, ${description},
        ${new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]},
        ${new Date().toISOString().split("T")[0]}, ${forecastMonths},
        ${JSON.stringify({ dataSource, recordCount: analysisResult.forecasts.length })},
        ${JSON.stringify(analysisResult)},
        ${JSON.stringify(analysisResult.insights)},
        ${0.85}, ${user.id}
      )
      RETURNING *
    `

    // Save insights to ai_insights table
    for (const insight of analysisResult.insights) {
      await sql`
        INSERT INTO ai_insights (
          company_id, insight_type, category, title, description, 
          severity, data_source, metadata
        )
        VALUES (
          ${companyId}, ${insight.type}, ${insight.category}, ${insight.title}, 
          ${insight.description}, ${insight.severity}, ${reportType},
          ${JSON.stringify({ confidence: insight.confidence, recommendations: insight.recommendations })}
        )
      `
    }

    return NextResponse.json({
      success: true,
      report: report[0],
      analysis: analysisResult,
    })
  } catch (error) {
    console.error("Error generating AI forecast:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
