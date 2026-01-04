import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    const users = await sql`
      SELECT 
        id,
        unique_key,
        email,
        role,
        company_id,
        is_active,
        expires_at,
        created_at
      FROM users 
      ORDER BY created_at DESC
    `

    const companies = await sql`
      SELECT id, name, display_name FROM companies
    `

    return NextResponse.json({
      users,
      companies,
      total_users: users.length,
    })
  } catch (error) {
    console.error("Error fetching debug info:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
