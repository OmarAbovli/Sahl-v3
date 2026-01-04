import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/session"
import { sql } from "@/lib/database"
import { checkPermission } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(["employee", "company_admin"])

    if (!checkPermission(user, "manage_inventory")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const itemId = Number.parseInt(params.id)
    const { item_name, item_code, quantity, unit_price, category, warehouse_id } = await request.json()

    // Verify the item belongs to the user's company
    const itemCheck = await sql`
      SELECT id FROM inventory 
      WHERE id = ${itemId} AND company_id = ${user.company_id}
    `

    if (itemCheck.length === 0) {
      return NextResponse.json({ error: "Inventory item not found" }, { status: 404 })
    }

    const result = await sql`
      UPDATE inventory 
      SET 
        item_name = ${item_name},
        item_code = ${item_code || null},
        quantity = ${quantity},
        unit_price = ${unit_price || null},
        category = ${category || null},
        warehouse_id = ${warehouse_id},
        updated_at = NOW()
      WHERE id = ${itemId}
      RETURNING *
    `

    return NextResponse.json({ item: result[0] })
  } catch (error) {
    console.error("Error updating inventory item:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
