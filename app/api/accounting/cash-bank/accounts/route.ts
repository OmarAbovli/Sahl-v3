import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/session"
import { db } from "@/db"
import { cashBankAccounts } from "@/db/schema"
import { eq, asc } from "drizzle-orm"

// GET: List all cash/bank accounts for the user's company
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user || !user.company_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const accounts = await db.select()
      .from(cashBankAccounts)
      .where(eq(cashBankAccounts.companyId, user.companyId))
      .orderBy(asc(cashBankAccounts.id))

    return NextResponse.json({ accounts })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 })
  }
}

// POST: Create a new cash/bank account
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user || !user.company_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const data = await req.json()
    const { name, account_number, bank_name, type } = data
    if (!name || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    const [account] = await db.insert(cashBankAccounts).values({
      companyId: user.companyId,
      name,
      accountNumber: account_number,
      bankName: bank_name,
      type,
      isActive: true,
    }).returning()

    return NextResponse.json({ account })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 })
  }
} 