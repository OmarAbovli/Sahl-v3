import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { db } from "@/lib/database"

// GET: List all cash/bank accounts for the user's company
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user || !user.company_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const accounts = await db.cash_bank_accounts.findMany({
      where: { company_id: user.company_id },
      orderBy: { id: "asc" },
    })
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
    const account = await db.cash_bank_accounts.create({
      data: {
        company_id: user.company_id,
        name,
        account_number,
        bank_name,
        type,
        is_active: true,
      },
    })
    return NextResponse.json({ account })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 })
  }
} 