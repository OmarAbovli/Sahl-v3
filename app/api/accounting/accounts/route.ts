import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

// GET /api/accounting/accounts?company_id=1
export async function GET(req: NextRequest) {
  const url = req.nextUrl || new URL(req.url)
  const companyId = Number(url.searchParams.get("company_id"))
  if (!companyId) {
    return NextResponse.json({ error: "Missing or invalid company_id" }, { status: 400 })
  }
  try {
    const accounts = await sql`
      SELECT * FROM accounts WHERE company_id = ${companyId} ORDER BY code, name`
    return NextResponse.json(accounts)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/accounting/accounts
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { company_id, name, code, type, parent_id } = body
  if (!company_id || !name || !type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }
  try {
    const result = await sql`
      INSERT INTO accounts (company_id, name, code, type, parent_id)
      VALUES (${company_id}, ${name}, ${code}, ${type}, ${parent_id ?? null})
      RETURNING *`
    return NextResponse.json(result[0], { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
