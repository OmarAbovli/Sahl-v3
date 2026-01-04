import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/session"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(["company_admin", "super_admin"])

    if (!user.company_id && user.role !== "super_admin") {
      return NextResponse.json({ error: "Company not found" }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get("type")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const companyId = user.company_id || 1

    let whereClause = `WHERE company_id = ${companyId}`
    if (reportType) {
      whereClause += ` AND report_type = '${reportType}'`
    }

    const reports = await sql`
      SELECT 
        r.*,
        u.email as generated_by_email
      FROM ai_reports r
      LEFT JOIN users u ON r.generated_by = u.id
      ${sql.unsafe(whereClause)}
      ORDER BY r.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const totalResult = await sql`
      SELECT COUNT(*) as total FROM ai_reports ${sql.unsafe(whereClause)}
    `

    return NextResponse.json({
      reports,
      total: Number.parseInt(totalResult[0].total),
      limit,
      offset,
    })
  } catch (error) {
    console.error("Error fetching AI reports:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
