import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/session"
import { sql } from "@/lib/database"
import { checkPermission } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(["employee", "company_admin"])

    if (!checkPermission(user, "view_invoices")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    if (!user.company_id) {
      return NextResponse.json({ error: "Company not found" }, { status: 400 })
    }

    const debtId = Number.parseInt(params.id)

    // Verify debt belongs to user's company
    const debtCheck = await sql`
      SELECT id FROM debts WHERE id = ${debtId} AND company_id = ${user.company_id}
    `

    if (debtCheck.length === 0) {
      return NextResponse.json({ error: "Debt not found" }, { status: 404 })
    }

    // Get payment history
    const payments = await sql`
      SELECT dp.*, u.email as recorded_by_email
      FROM debt_payments dp
      LEFT JOIN users u ON dp.recorded_by = u.id
      WHERE dp.debt_id = ${debtId} AND dp.company_id = ${user.company_id}
      ORDER BY dp.payment_date DESC, dp.created_at DESC
    `

    return NextResponse.json({ payments })
  } catch (error) {
    console.error("Error fetching debt payments:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(["employee", "company_admin"])

    if (!checkPermission(user, "manage_invoices")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    if (!user.company_id) {
      return NextResponse.json({ error: "Company not found" }, { status: 400 })
    }

    const debtId = Number.parseInt(params.id)
    const { payment_amount, payment_date, payment_method, reference_number, notes } = await request.json()

    if (!payment_amount || payment_amount <= 0) {
      return NextResponse.json({ error: "Valid payment amount is required" }, { status: 400 })
    }

    if (!payment_date) {
      return NextResponse.json({ error: "Payment date is required" }, { status: 400 })
    }

    // Start transaction
    await sql`BEGIN`

    try {
      // Get current debt information
      const debt = await sql`
        SELECT * FROM debts 
        WHERE id = ${debtId} AND company_id = ${user.company_id}
      `

      if (debt.length === 0) {
        throw new Error("Debt not found")
      }

      const currentDebt = debt[0]

      if (payment_amount > currentDebt.remaining_amount) {
        throw new Error(`Payment amount cannot exceed remaining debt of $${currentDebt.remaining_amount}`)
      }

      // Record the payment
      const payment = await sql`
        INSERT INTO debt_payments (
          company_id, debt_id, payment_amount, payment_date, 
          payment_method, reference_number, notes, recorded_by
        )
        VALUES (
          ${user.company_id}, ${debtId}, ${payment_amount}, ${payment_date},
          ${payment_method}, ${reference_number}, ${notes}, ${user.id}
        )
        RETURNING *
      `

      // Update debt record
      const newRemainingAmount = currentDebt.remaining_amount - payment_amount
      await sql`
        UPDATE debts 
        SET 
          remaining_amount = ${newRemainingAmount},
          last_payment_date = ${payment_date},
          last_payment_amount = ${payment_amount},
          updated_at = NOW()
        WHERE id = ${debtId}
      `

      // Update invoice status if debt is fully paid
      if (newRemainingAmount <= 0 && currentDebt.invoice_id) {
        await sql`
          UPDATE invoices 
          SET status = 'paid', updated_at = NOW()
          WHERE id = ${currentDebt.invoice_id}
        `
      }

      // Log the payment
      await sql`
        INSERT INTO activity_logs (
          company_id, user_id, action, entity_type, entity_id, details
        )
        VALUES (
          ${user.company_id}, ${user.id}, 'debt_payment', 'debt', ${debtId},
          ${JSON.stringify({
            payment_amount,
            payment_date,
            payment_method,
            reference_number,
            remaining_amount: newRemainingAmount,
          })}
        )
      `

      await sql`COMMIT`

      return NextResponse.json({
        success: true,
        payment: payment[0],
        remaining_amount: newRemainingAmount,
        message: newRemainingAmount <= 0 ? "Debt fully paid!" : "Payment recorded successfully",
      })
    } catch (error) {
      await sql`ROLLBACK`
      throw error
    }
  } catch (error) {
    console.error("Error recording debt payment:", error)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 })
  }
}
