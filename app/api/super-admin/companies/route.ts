import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/session"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    await requireAuth(["super_admin"])

    const companies = await sql`
      SELECT * FROM companies 
      ORDER BY created_at DESC
    `

    return NextResponse.json({ companies })
  } catch (error) {
    console.error("Error fetching companies:", error)
    return NextResponse.json({ error: "Unauthorized or server error" }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(["super_admin"])

    const { name, displayName } = await request.json()

    if (!name || !displayName) {
      return NextResponse.json({ error: "Name and display name are required" }, { status: 400 })
    }

    // Check if company name already exists
    const existing = await sql`
      SELECT id FROM companies WHERE name = ${name}
    `

    if (existing.length > 0) {
      return NextResponse.json({ error: "Company name already exists" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO companies (name, display_name)
      VALUES (${name}, ${displayName})
      RETURNING *
    `

    return NextResponse.json({ company: result[0] })
  } catch (error) {
    console.error("Error creating company:", error)
    return NextResponse.json({ error: "Unauthorized or server error" }, { status: 401 })
  }
}
