import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/session"
import { sql } from "@/lib/database"
import { checkPermission } from "@/lib/auth"

export async function GET() {
  try {
    const user = await requireAuth(["employee", "company_admin"])

    if (!checkPermission(user, "view_inventory")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    if (!user.company_id) {
      return NextResponse.json({ error: "Company not found" }, { status: 400 })
    }

    const inventory = await sql`
      SELECT i.*, w.name as warehouse_name
      FROM inventory i
      LEFT JOIN warehouses w ON i.warehouse_id = w.id
      WHERE i.company_id = ${user.company_id}
      ORDER BY i.created_at DESC
    `

    return NextResponse.json({ inventory })
  } catch (error) {
    console.error("Error fetching inventory:", error)
    return NextResponse.json({ error: "Unauthorized or server error" }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(["employee", "company_admin"])

    if (!checkPermission(user, "manage_inventory")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    if (!user.company_id) {
      return NextResponse.json({ error: "Company not found" }, { status: 400 })
    }

    const { item_name, item_code, quantity, unit_price, category, warehouse_id } = await request.json()

    if (!item_name || quantity === undefined || !warehouse_id) {
      return NextResponse.json({ error: "Item name, quantity, and warehouse are required" }, { status: 400 })
    }

    // Verify the warehouse belongs to the user's company
    const warehouseCheck = await sql`
      SELECT id FROM warehouses 
      WHERE id = ${warehouse_id} AND company_id = ${user.company_id}
    `

    if (warehouseCheck.length === 0) {
      return NextResponse.json({ error: "Warehouse not found" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO inventory (
        company_id, warehouse_id, item_name, item_code, 
        quantity, unit_price, category
      )
      VALUES (
        ${user.company_id}, ${warehouse_id}, ${item_name}, ${item_code || null},
        ${quantity}, ${unit_price || null}, ${category || null}
      )
      RETURNING *
    `

    return NextResponse.json({ item: result[0] })
  } catch (error) {
    console.error("Error creating inventory item:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
