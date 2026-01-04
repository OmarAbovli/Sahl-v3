import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/session"
import { sql } from "@/lib/database"

// GET: List journal entries for the current company
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(["super_admin", "company_admin", "employee"])
    const companyId = user.company_id
    const entries = await sql`
      SELECT je.*, (
        SELECT json_agg(jl) FROM journal_lines jl WHERE jl.journal_entry_id = je.id
      ) AS lines
      FROM journal_entries je
      WHERE je.company_id = ${companyId}
      ORDER BY je.date DESC, je.id DESC
    `
    // Parse lines JSON
    const result = entries.map((e: any) => ({ ...e, lines: e.lines || [] }))
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

// POST: Create a new journal entry
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(["super_admin", "company_admin"])
    const companyId = user.company_id
    const data = await req.json()
    if (!data.date || !Array.isArray(data.lines) || data.lines.length < 2) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    }
    // Insert entry
    const inserted = await sql`
      INSERT INTO journal_entries (company_id, date, description)
      VALUES (${companyId}, ${data.date}, ${data.description || ""})
      RETURNING *
    `
    const entry = inserted[0]
    // Insert lines
    for (const line of data.lines) {
      await sql`
        INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit, description)
        VALUES (${entry.id}, ${line.account_id}, ${line.debit}, ${line.credit}, ${line.description || ""})
      `
    }
    // Fetch with lines
    const lines = await sql`SELECT * FROM journal_lines WHERE journal_entry_id = ${entry.id}`
    return NextResponse.json({ ...entry, lines })
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized or failed" }, { status: 401 })
  }
}

// PUT: Update a journal entry
export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(["super_admin", "company_admin"])
    const companyId = user.company_id
    const data = await req.json()
    if (!data.id || !data.date || !Array.isArray(data.lines) || data.lines.length < 2) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    }
    // Update entry
    await sql`
      UPDATE journal_entries SET date = ${data.date}, description = ${data.description || ""}
      WHERE id = ${data.id} AND company_id = ${companyId}
    `
    // Delete old lines
    await sql`DELETE FROM journal_lines WHERE journal_entry_id = ${data.id}`
    // Insert new lines
    for (const line of data.lines) {
      await sql`
        INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit, description)
        VALUES (${data.id}, ${line.account_id}, ${line.debit}, ${line.credit}, ${line.description || ""})
      `
    }
    // Fetch with lines
    const lines = await sql`SELECT * FROM journal_lines WHERE journal_entry_id = ${data.id}`
    const entry = (await sql`SELECT * FROM journal_entries WHERE id = ${data.id}`)[0]
    return NextResponse.json({ ...entry, lines })
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized or failed" }, { status: 401 })
  }
}

// DELETE: Delete a journal entry
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(["super_admin", "company_admin"])
    const companyId = user.company_id
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
    await sql`DELETE FROM journal_lines WHERE journal_entry_id = ${id}`
    await sql`DELETE FROM journal_entries WHERE id = ${id} AND company_id = ${companyId}`
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized or failed" }, { status: 401 })
  }
}
