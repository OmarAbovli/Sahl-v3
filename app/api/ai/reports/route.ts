import { type NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { requireAuth } from "@/lib/session"
import { db } from "@/db"
import { aiReports, users } from "@/db/schema"
import { eq, and, desc, count, sql as drizzleSql } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(["company_admin", "super_admin"])
    const companyId = user.company_id || user.companyId

    if (!companyId && user.role !== "super_admin") {
      return NextResponse.json({ error: "Company not found" }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get("type")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const targetCompanyId = companyId || 1

    const conditions = [eq(aiReports.companyId, targetCompanyId)]
    if (reportType) {
      conditions.push(eq(aiReports.reportType, reportType))
    }

    const reports = await db.select({
      id: aiReports.id,
      title: aiReports.title,
      description: aiReports.description,
      reportType: aiReports.reportType,
      createdAt: aiReports.createdAt,
      generatedByEmail: users.email
    })
      .from(aiReports)
      .leftJoin(users, eq(aiReports.generatedBy, users.id))
      .where(and(...conditions))
      .orderBy(desc(aiReports.createdAt))
      .limit(limit)
      .offset(offset)

    const [totalResult] = await db.select({ total: count() })
      .from(aiReports)
      .where(and(...conditions))

    return NextResponse.json({
      reports,
      total: totalResult.total,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Error fetching AI reports:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
