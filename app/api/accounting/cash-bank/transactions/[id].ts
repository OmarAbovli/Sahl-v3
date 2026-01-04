import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { sql } from "@/lib/database"

// PUT: Update a cash/bank transaction
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user || !user.company_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const id = Number(params.id)
    const data = await req.json()
    const transaction = await sql`
      UPDATE cash_bank_transactions
      SET ${sql(data)}
      WHERE id = ${id} AND company_id = ${user.company_id}
      RETURNING *
    `
    if (transaction.length === 0) {
      return NextResponse.json({ error: "Transaction not found or not authorized" }, { status: 404 })
    }
    return NextResponse.json({ transaction: transaction[0] })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 })
  }
}

// DELETE: Delete a cash/bank transaction
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user || !user.company_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const id = Number(params.id)
    await sql`
      DELETE FROM cash_bank_transactions
      WHERE id = ${id} AND company_id = ${user.company_id}
    `
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 })
  }
}

// PATCH: Update reconciliation status
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user || !user.company_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const id = Number(params.id)
    const data = await req.json()
    const is_reconciled = !!data.is_reconciled
    const reconciled_at = is_reconciled ? new Date().toISOString() : null
    const reconciliation_reference = data.reconciliation_reference || null
    const result = await sql`
      UPDATE cash_bank_transactions
      SET is_reconciled = ${is_reconciled},
          reconciled_at = ${reconciled_at},
          reconciliation_reference = ${reconciliation_reference}
      WHERE id = ${id} AND company_id = ${user.company_id}
      RETURNING *
    `
    if (result.length === 0) {
      return NextResponse.json({ error: "Transaction not found or not authorized" }, { status: 404 })
    }
    return NextResponse.json({ transaction: result[0] })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update reconciliation status" }, { status: 500 })
  }
} 