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

    const { warehouse_id, debtor_name, debtor_type, debtor_contact, items, due_date, notes } = await request.json()

    if (!warehouse_id || !debtor_name || !items || items.length === 0) {
      return NextResponse.json({ error: "Warehouse, debtor name, and items are required" }, { status: 400 })
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

      // Create invoice (marked as pending since it's a debt sale)
      const invoice = await sql`
        INSERT INTO invoices (
          company_id, invoice_number, client_name, amount, 
          status, issue_date, due_date, created_by
        )
        VALUES (
          ${user.company_id}, ${invoiceNumber}, ${debtor_name}, ${totalAmount},
          'pending', CURRENT_DATE, ${due_date || "CURRENT_DATE + INTERVAL '30 days'"}, ${user.id}
        )
        RETURNING *
      `

      // Create debt record
      const debt = await sql`
        INSERT INTO debts (
          company_id, debtor_name, debtor_type, debtor_contact, invoice_id,
          original_amount, remaining_amount, sale_date, due_date, notes, created_by
        )
        VALUES (
          ${user.company_id}, ${debtor_name}, ${debtor_type || "individual"}, ${debtor_contact},
          ${invoice[0].id}, ${totalAmount}, ${totalAmount}, CURRENT_DATE, 
          ${due_date || "CURRENT_DATE + INTERVAL '30 days'"}, ${notes}, ${user.id}
        )
        RETURNING *
      `

      // Log the debt sale
      await sql`
        INSERT INTO activity_logs (
          company_id, user_id, action, entity_type, entity_id, details
        )
        VALUES (
          ${user.company_id}, ${user.id}, 'debt_sale', 'debt', ${debt[0].id},
          ${JSON.stringify({
            warehouse_id,
            debtor_name,
            debtor_type,
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
        debt: debt[0],
        sale_details: saleDetails,
        message: "Debt sale completed successfully",
      })
    } catch (error) {
      await sql`ROLLBACK`
      throw error
    }
  } catch (error) {
    console.error("Error processing debt sale:", error)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 })
  }
}
