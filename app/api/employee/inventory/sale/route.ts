import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/session"
import { sql } from "@/lib/database"
import { checkPermission } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(["employee", "company_admin"])

    if (!checkPermission(user, "manage_inventory") || !checkPermission(user, "manage_invoices")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    if (!user.company_id) {
      return NextResponse.json({ error: "Company not found" }, { status: 400 })
    }

    const { warehouse_id, client_name, items, notes } = await request.json()

    if (!warehouse_id || !client_name || !items || items.length === 0) {
      return NextResponse.json({ error: "Warehouse, client name, and items are required" }, { status: 400 })
    }

    // Start transaction
    await sql`BEGIN`

    try {
      // Verify warehouse belongs to the user's company
      const warehouseCheck = await sql`
        SELECT id FROM warehouses 
        WHERE id = ${warehouse_id} AND company_id = ${user.company_id}
      `

      if (warehouseCheck.length === 0) {
        throw new Error("Warehouse not found")
      }

      let totalAmount = 0
      const saleDetails = []

      // Process each item
      for (const saleItem of items) {
        const { item_id, quantity, unit_price } = saleItem

        // Get inventory item
        const inventoryItem = await sql`
          SELECT * FROM inventory 
          WHERE id = ${item_id} AND warehouse_id = ${warehouse_id} AND company_id = ${user.company_id}
        `

        if (inventoryItem.length === 0) {
          throw new Error(`Item with ID ${item_id} not found in warehouse`)
        }

        const item = inventoryItem[0]

        if (item.quantity < quantity) {
          throw new Error(
            `Insufficient quantity for ${item.item_name}. Available: ${item.quantity}, Requested: ${quantity}`,
          )
        }

        // Update inventory quantity
        await sql`
          UPDATE inventory 
          SET quantity = quantity - ${quantity}, updated_at = NOW()
          WHERE id = ${item_id}
        `

        // Calculate item total
        const itemTotal = quantity * unit_price
        totalAmount += itemTotal

        saleDetails.push({
          item_name: item.item_name,
          item_code: item.item_code,
          quantity,
          unit_price,
          total: itemTotal,
        })
      }

      // Generate invoice number
      const invoiceCount = await sql`
        SELECT COUNT(*) as count FROM invoices WHERE company_id = ${user.company_id}
      `
      const invoiceNumber = `INV-${String(Number.parseInt(invoiceCount[0].count) + 1).padStart(4, "0")}`

      // Create invoice
      const invoice = await sql`
        INSERT INTO invoices (
          company_id, invoice_number, client_name, amount, 
          status, issue_date, due_date, created_by
        )
        VALUES (
          ${user.company_id}, ${invoiceNumber}, ${client_name}, ${totalAmount},
          'paid', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', ${user.id}
        )
        RETURNING *
      `

      // Log the sale
      await sql`
        INSERT INTO activity_logs (
          company_id, user_id, action, entity_type, entity_id, details
        )
        VALUES (
          ${user.company_id}, ${user.id}, 'sale', 'invoice', ${invoice[0].id},
          ${JSON.stringify({
            warehouse_id,
            client_name,
            items: saleDetails,
            total_amount: totalAmount,
            notes,
          })}
        )
      `

      await sql`COMMIT`

      return NextResponse.json({
        success: true,
        invoice: invoice[0],
        sale_details: saleDetails,
        message: "Sale completed successfully",
      })
    } catch (error) {
      await sql`ROLLBACK`
      throw error
    }
  } catch (error) {
    console.error("Error processing sale:", error)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 })
  }
}
