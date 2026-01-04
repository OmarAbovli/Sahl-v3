import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/session"
import { sql } from "@/lib/database"
import { checkPermission } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(["employee", "company_admin"])

    if (!checkPermission(user, "manage_warehouses")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const warehouseId = Number.parseInt(params.id)
    const { name, location } = await request.json()

    // Verify the warehouse belongs to the user's company
    const warehouseCheck = await sql`
      SELECT id FROM warehouses 
      WHERE id = ${warehouseId} AND company_id = ${user.company_id}
    `

    if (warehouseCheck.length === 0) {
      return NextResponse.json({ error: "Warehouse not found" }, { status: 404 })
    }

    const result = await sql`
      UPDATE warehouses 
      SET 
        name = ${name},
        location = ${location || null},
        updated_at = NOW()
      WHERE id = ${warehouseId}
      RETURNING *
    `

    return NextResponse.json({ warehouse: result[0] })
  } catch (error) {
    console.error("Error updating warehouse:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
