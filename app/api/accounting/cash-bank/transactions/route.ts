import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/session"
import { db } from "@/db"
import { cashBankTransactions } from "@/db/schema"
import { eq, desc } from "drizzle-orm"

// GET: List all cash/bank transactions for the user's company
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user || !user.company_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const transactions = await db.select()
      .from(cashBankTransactions)
      .where(eq(cashBankTransactions.companyId, user.companyId))
      .orderBy(desc(cashBankTransactions.transactionDate))

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
    const [transaction] = await db.insert(cashBankTransactions).values({
      companyId: user.companyId,
      accountId: account_id,
      transactionType: transaction_type,
      amount: amount.toString(),
      transactionDate: transaction_date,
      reference,
      createdBy: user.id,
    }).returning()

    return NextResponse.json({ transaction })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 })
  }
} 