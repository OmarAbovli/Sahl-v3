import { type NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { requireAuth } from "@/lib/session"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(["company_admin", "super_admin"])

    if (!user.companyId && user.role !== "super_admin") {
      return NextResponse.json({ error: "Company not found" }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const severity = searchParams.get("severity")
    const unreadOnly = searchParams.get("unread") === "true"
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    const companyId = user.companyId || 1

    let whereClause = `WHERE company_id = ${companyId} AND is_archived = false`

    if (category) {
      whereClause += ` AND category = '${category}'`
    }

    if (severity) {
      whereClause += ` AND severity = '${severity}'`
    }

    if (unreadOnly) {
      whereClause += ` AND is_read = false`
    }

    const insights = await sql`
      SELECT * FROM ai_insights
      ${sql.unsafe(whereClause)}
      ORDER BY 
        CASE severity 
          WHEN 'critical' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          WHEN 'low' THEN 4 
        END,
        created_at DESC
      LIMIT ${limit}
    `

    // Get summary counts
    const summary = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_read = false THEN 1 END) as unread,
        COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical,
        COUNT(CASE WHEN severity = 'high' THEN 1 END) as high
      FROM ai_insights
      WHERE company_id = ${companyId} AND is_archived = false
    `

    return NextResponse.json({
      insights,
      summary: summary[0],
    })
  } catch (error) {
    console.error("Error fetching AI insights:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth(["company_admin", "super_admin"])

    const { insightIds, action } = await request.json()

    if (!insightIds || !Array.isArray(insightIds) || !action) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    const companyId = user.companyId || 1

    let updateQuery = ""
    switch (action) {
      case "mark_read":
        updateQuery = "SET is_read = true"
        break
      case "mark_unread":
        updateQuery = "SET is_read = false"
        break
      case "archive":
        updateQuery = "SET is_archived = true"
        break
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    await sql`
      UPDATE ai_insights 
      ${sql.unsafe(updateQuery)}
      WHERE id = ANY(${insightIds}) AND company_id = ${companyId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating AI insights:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
