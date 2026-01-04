import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/session"
import { sql } from "@/lib/database"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth(["super_admin"])

    const { status } = await request.json()
    const ticketId = Number.parseInt(params.id)

    if (!status || !["open", "in_progress", "closed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const result = await sql`
      UPDATE support_tickets 
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${ticketId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    return NextResponse.json({ ticket: result[0] })
  } catch (error) {
    console.error("Error updating support ticket:", error)
    return NextResponse.json({ error: "Unauthorized or server error" }, { status: 401 })
  }
}
