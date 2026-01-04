import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { db } from "@/lib/database"

// GET: List all cash/bank transactions for the user's company
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user || !user.company_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const transactions = await db.cash_bank_transactions.findMany({
      where: { company_id: user.company_id },
      orderBy: { transaction_date: "desc" },
    })
    return NextResponse.json({ transactions })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
  }
}

// POST: Create a new cash/bank transaction
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user || !user.company_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const data = await req.json()
    const { account_id, transaction_type, amount, transaction_date, reference } = data
    if (!account_id || !transaction_type || !amount || !transaction_date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    const transaction = await db.cash_bank_transactions.create({
      data: {
        company_id: user.company_id,
        account_id,
        transaction_type,
        amount,
        transaction_date,
        reference,
        created_by: user.id,
      },
    })
    return NextResponse.json({ transaction })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 })
  }
} 