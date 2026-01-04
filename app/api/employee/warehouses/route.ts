import { type NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { requireAuth } from "@/lib/session"
import { sql } from "@/lib/database"
import { checkPermission } from "@/lib/auth"

export async function GET() {
  try {
    const user = await requireAuth(["employee", "company_admin"])

    if (!checkPermission(user, "view_warehouses")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    if (!user.company_id) {
      return NextResponse.json({ error: "Company not found" }, { status: 400 })
    }

    const warehouses = await sql`
      SELECT * FROM warehouses 
      WHERE company_id = ${user.company_id}
      ORDER BY created_at DESC
    `

    return NextResponse.json({ warehouses })
  } catch (error) {
    console.error("Error fetching warehouses:", error)
    return NextResponse.json({ error: "Unauthorized or server error" }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(["employee", "company_admin"])

    if (!checkPermission(user, "manage_warehouses")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    if (!user.company_id) {
      return NextResponse.json({ error: "Company not found" }, { status: 400 })
    }

    const { name, location } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Warehouse name is required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO warehouses (company_id, name, location)
      VALUES (${user.company_id}, ${name}, ${location || null})
      RETURNING *
    `

    return NextResponse.json({ warehouse: result[0] })
  } catch (error) {
    console.error("Error creating warehouse:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
