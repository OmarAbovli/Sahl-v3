import { NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { requireAuth } from "@/lib/session"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    await requireAuth(["super_admin"])

    const tickets = await sql`
      SELECT 
        st.*,
        u.email as creator_email,
        c.display_name as company_name
      FROM support_tickets st
      LEFT JOIN users u ON st.created_by = u.id
      LEFT JOIN companies c ON st.company_id = c.id
      ORDER BY st.created_at DESC
    `

    return NextResponse.json({ tickets })
  } catch (error) {
    console.error("Error fetching support tickets:", error)
    return NextResponse.json({ error: "Unauthorized or server error" }, { status: 401 })
  }
}
