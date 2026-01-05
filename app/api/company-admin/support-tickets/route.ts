import { type NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { requireAuth } from "@/lib/session"
import { db } from "@/db"
import { supportTickets } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(["company_admin"])
    const companyId = user.company_id || user.companyId

    if (!companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 400 })
    }

    const { subject, message, priority } = await request.json()

    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message are required" }, { status: 400 })
    }

    const [ticket] = await db.insert(supportTickets).values({
      companyId: Number(companyId),
      createdBy: user.id,
      subject,
      message,
      priority: priority || "medium",
      status: "open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).returning()

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error("Error creating support ticket:", error)
    return NextResponse.json({ error: "Unauthorized or server error" }, { status: 401 })
  }
}
