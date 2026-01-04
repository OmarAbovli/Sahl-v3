import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { db } from "@/lib/database"

// PUT: Update a cash/bank account
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user || !user.company_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const id = Number(params.id)
    const data = await req.json()
    const account = await db.cash_bank_accounts.update({
      where: { id, company_id: user.company_id },
      data,
    })
    return NextResponse.json({ account })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 })
  }
}

// DELETE: Delete a cash/bank account
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user || !user.company_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const id = Number(params.id)
    await db.cash_bank_accounts.delete({
      where: { id, company_id: user.company_id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
  }
} 