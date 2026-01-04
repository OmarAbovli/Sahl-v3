import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/session"
import { sql } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(["company_admin"])

    if (!user.company_id) {
      return NextResponse.json({ error: "Company not found" }, { status: 400 })
    }

    const { subject, message, priority } = await request.json()

    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message are required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO support_tickets (company_id, created_by, subject, message, priority)
      VALUES (${user.company_id}, ${user.id}, ${subject}, ${message}, ${priority || "medium"})
      RETURNING *
    `

    return NextResponse.json({ ticket: result[0] })
  } catch (error) {
    console.error("Error creating support ticket:", error)
    return NextResponse.json({ error: "Unauthorized or server error" }, { status: 401 })
  }
}
