import { NextResponse } from "next/server"
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
      SELECT 
        w.*,
        COUNT(i.id) as inventory_count,
        COALESCE(SUM(i.quantity * COALESCE(i.unit_price, 0)), 0) as total_value
      FROM warehouses w
      LEFT JOIN inventory i ON w.id = i.warehouse_id
      WHERE w.company_id = ${user.company_id}
      GROUP BY w.id
      ORDER BY w.created_at DESC
    `

    return NextResponse.json({ warehouses })
  } catch (error) {
    console.error("Error fetching enhanced warehouses:", error)
    return NextResponse.json({ error: "Unauthorized or server error" }, { status: 401 })
  }
}
