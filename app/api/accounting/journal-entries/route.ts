import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { requireAuth } from "@/lib/session"
import { db } from "@/db"
import { journalEntries, journalLines } from "@/db/schema"
import { eq, and, desc } from "drizzle-orm"

// GET: List journal entries for the current company
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(["super_admin", "company_admin", "employee"])
    const companyId = user.company_id || user.companyId
    if (!companyId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const entries = await db.query.journalEntries.findMany({
      where: eq(journalEntries.companyId, companyId),
      with: {
        lines: true
      },
      orderBy: [desc(journalEntries.date), desc(journalEntries.id)]
    })

    return NextResponse.json(entries)
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

// POST: Create a new journal entry
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(["super_admin", "company_admin"])
    const companyId = user.company_id || user.companyId
    if (!companyId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const data = await req.json()
    if (!data.date || !Array.isArray(data.lines) || data.lines.length < 2) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    }

    // Insert entry
    const [entry] = await db.insert(journalEntries).values({
      companyId,
      date: data.date,
      description: data.description || "",
    }).returning()

    // Insert lines
    if (data.lines.length > 0) {
      await db.insert(journalLines).values(data.lines.map((line: any) => ({
        journalEntryId: entry.id,
        accountId: line.account_id,
        debit: line.debit.toString(),
        credit: line.credit.toString(),
        description: line.description || "",
      })))
    }

    // Fetch with lines
    const lines = await db.select().from(journalLines).where(eq(journalLines.journalEntryId, entry.id))
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
