import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/session"
import { sql } from "@/lib/database"
import { checkPermission } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(["employee", "company_admin"])

    if (!checkPermission(user, "manage_invoices")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const invoiceId = Number.parseInt(params.id)
    const { invoice_number, client_name, amount, status, issue_date, due_date } = await request.json()

    // Verify the invoice belongs to the user's company
    const invoiceCheck = await sql`
      SELECT id FROM invoices 
      WHERE id = ${invoiceId} AND company_id = ${user.company_id}
    `

    if (invoiceCheck.length === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    const result = await sql`
      UPDATE invoices 
      SET 
        invoice_number = ${invoice_number},
        client_name = ${client_name || null},
        amount = ${amount},
        status = ${status},
        issue_date = ${issue_date},
        due_date = ${due_date},
        updated_at = NOW()
      WHERE id = ${invoiceId}
      RETURNING *
    `

    return NextResponse.json({ invoice: result[0] })
  } catch (error) {
    console.error("Error updating invoice:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
