import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/session"
import { sql } from "@/lib/database"
import { checkPermission } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(["employee", "company_admin"])

    if (!checkPermission(user, "view_invoices")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    if (!user.company_id) {
      return NextResponse.json({ error: "Company not found" }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = (page - 1) * limit

    let whereClause = `WHERE d.company_id = ${user.company_id}`
    if (status && status !== "all") {
      whereClause += ` AND d.status = '${status}'`
    }

    // Get debts with invoice information
    const debts = await sql`
      SELECT 
        d.*,
        i.invoice_number,
        COALESCE(SUM(dp.payment_amount), 0) as total_paid
      FROM debts d
      LEFT JOIN invoices i ON d.invoice_id = i.id
      LEFT JOIN debt_payments dp ON d.id = dp.debt_id
      ${sql.unsafe(whereClause)}
      GROUP BY d.id, i.invoice_number
      ORDER BY d.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    // Get total count for pagination
    const totalResult = await sql`
      SELECT COUNT(*) as total FROM debts d ${sql.unsafe(whereClause)}
    `
    const total = Number.parseInt(totalResult[0].total)

    // Get summary statistics
    const stats = await sql`
      SELECT 
        COUNT(*) as total_debts,
        SUM(CASE WHEN status = 'active' THEN remaining_amount ELSE 0 END) as active_debt,
        SUM(CASE WHEN status = 'overdue' THEN remaining_amount ELSE 0 END) as overdue_debt,
        SUM(CASE WHEN status = 'paid' THEN original_amount ELSE 0 END) as paid_debt
      FROM debts 
      WHERE company_id = ${user.company_id}
    `

    return NextResponse.json({
      debts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: stats[0],
    })
  } catch (error) {
    console.error("Error fetching debts:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
