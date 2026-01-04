import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/session"
import { sql } from "@/lib/database"
import { checkPermission } from "@/lib/auth"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(["employee", "company_admin"])

    if (!checkPermission(user, "view_inventory")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const warehouseId = Number.parseInt(params.id)

    // Verify the warehouse belongs to the user's company
    const warehouseCheck = await sql`
      SELECT id FROM warehouses 
      WHERE id = ${warehouseId} AND company_id = ${user.company_id}
    `

    if (warehouseCheck.length === 0) {
      return NextResponse.json({ error: "Warehouse not found" }, { status: 404 })
    }

    const inventory = await sql`
      SELECT * FROM inventory 
      WHERE warehouse_id = ${warehouseId}
      ORDER BY item_name
    `

    return NextResponse.json({ inventory })
  } catch (error) {
    console.error("Error fetching warehouse inventory:", error)
    return NextResponse.json({ error: "Unauthorized or server error" }, { status: 401 })
  }
}
