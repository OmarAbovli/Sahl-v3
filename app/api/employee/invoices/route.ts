import { type NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { requireAuth } from "@/lib/session"
import { sql } from "@/lib/database"
import { checkPermission } from "@/lib/auth"

export async function GET() {
  try {
    const user = await requireAuth(["employee", "company_admin"])

    if (!checkPermission(user, "view_invoices")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    if (!user.company_id) {
      return NextResponse.json({ error: "Company not found" }, { status: 400 })
    }

    const invoices = await sql`
      SELECT * FROM invoices 
      WHERE company_id = ${user.company_id}
      ORDER BY created_at DESC
    `

    return NextResponse.json({ invoices })
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return NextResponse.json({ error: "Unauthorized or server error" }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(["employee", "company_admin"])

    if (!checkPermission(user, "manage_invoices")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    if (!user.company_id) {
      return NextResponse.json({ error: "Company not found" }, { status: 400 })
    }

    const { invoice_number, client_name, amount, status, issue_date, due_date } = await request.json()

    if (!invoice_number || !amount || !issue_date || !due_date) {
      return NextResponse.json(
        { error: "Invoice number, amount, issue date, and due date are required" },
        { status: 400 },
      )
    }

    const result = await sql`
      INSERT INTO invoices (
        company_id, invoice_number, client_name, amount, 
        status, issue_date, due_date, created_by
      )
      VALUES (
        ${user.company_id}, ${invoice_number}, ${client_name || null}, ${amount},
        ${status || "pending"}, ${issue_date}, ${due_date}, ${user.id}
      )
      RETURNING *
    `

    return NextResponse.json({ invoice: result[0] })
  } catch (error) {
    console.error("Error creating invoice:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
