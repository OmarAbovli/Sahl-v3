import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/session"
import { sql } from "@/lib/database"
import { checkPermission } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(["employee", "company_admin"])

    if (!checkPermission(user, "manage_inventory")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    if (!user.company_id) {
      return NextResponse.json({ error: "Company not found" }, { status: 400 })
    }

    const { item_id, from_warehouse_id, to_warehouse_id, quantity, notes } = await request.json()

    if (!item_id || !from_warehouse_id || !to_warehouse_id || !quantity) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    if (from_warehouse_id === to_warehouse_id) {
      return NextResponse.json({ error: "Source and destination warehouses must be different" }, { status: 400 })
    }

    // Start transaction
    await sql`BEGIN`

    try {
      // Verify both warehouses belong to the user's company
      const warehousesCheck = await sql`
        SELECT id FROM warehouses 
        WHERE id IN (${from_warehouse_id}, ${to_warehouse_id}) 
        AND company_id = ${user.company_id}
      `

      if (warehousesCheck.length !== 2) {
        throw new Error("One or both warehouses not found")
      }

      // Get the source item
      const sourceItem = await sql`
        SELECT * FROM inventory 
        WHERE id = ${item_id} AND warehouse_id = ${from_warehouse_id} AND company_id = ${user.company_id}
      `

      if (sourceItem.length === 0) {
        throw new Error("Item not found in source warehouse")
      }

      const item = sourceItem[0]

      if (item.quantity < quantity) {
        throw new Error("Insufficient quantity in source warehouse")
      }

      // Check if item already exists in destination warehouse
      const destinationItem = await sql`
        SELECT * FROM inventory 
        WHERE item_name = ${item.item_name} 
        AND item_code = ${item.item_code || null}
        AND warehouse_id = ${to_warehouse_id} 
        AND company_id = ${user.company_id}
      `

      if (destinationItem.length > 0) {
        // Update existing item in destination
        await sql`
          UPDATE inventory 
          SET quantity = quantity + ${quantity}, updated_at = NOW()
          WHERE id = ${destinationItem[0].id}
        `
      } else {
        // Create new item in destination
        await sql`
          INSERT INTO inventory (
            company_id, warehouse_id, item_name, item_code, 
            quantity, unit_price, category
          )
          VALUES (
            ${user.company_id}, ${to_warehouse_id}, ${item.item_name}, ${item.item_code},
            ${quantity}, ${item.unit_price}, ${item.category}
          )
        `
      }

      // Update source item quantity
      if (item.quantity === quantity) {
        // Remove item if transferring all quantity
        await sql`
          DELETE FROM inventory WHERE id = ${item_id}
        `
      } else {
        // Reduce quantity
        await sql`
          UPDATE inventory 
          SET quantity = quantity - ${quantity}, updated_at = NOW()
          WHERE id = ${item_id}
        `
      }

      // Log the transfer
      await sql`
        INSERT INTO activity_logs (
          company_id, user_id, action, entity_type, entity_id, details
        )
        VALUES (
          ${user.company_id}, ${user.id}, 'transfer', 'inventory', ${item_id},
          ${JSON.stringify({
            from_warehouse_id,
            to_warehouse_id,
            quantity,
            notes,
            item_name: item.item_name,
          })}
        )
      `

      await sql`COMMIT`

      return NextResponse.json({
        success: true,
        message: "Transfer completed successfully",
      })
    } catch (error) {
      await sql`ROLLBACK`
      throw error
    }
  } catch (error) {
    console.error("Error transferring inventory:", error)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 })
  }
}
