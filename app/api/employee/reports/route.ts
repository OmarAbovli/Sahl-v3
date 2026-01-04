import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/session"
import { sql } from "@/lib/database"
import { checkPermission } from "@/lib/auth"

export async function GET() {
  try {
    const user = await requireAuth(["employee", "company_admin"])

    if (!checkPermission(user, "view_reports")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    if (!user.company_id) {
      return NextResponse.json({ error: "Company not found" }, { status: 400 })
    }

    const [
      employeesResult,
      invoicesResult,
      revenueResult,
      pendingInvoicesResult,
      inventoryResult,
      warehousesResult,
      lowStockResult,
      overdueInvoicesResult,
    ] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM employees WHERE company_id = ${user.company_id} AND is_active = true`,
      sql`SELECT COUNT(*) as count FROM invoices WHERE company_id = ${user.company_id}`,
      sql`SELECT COALESCE(SUM(amount), 0) as total FROM invoices WHERE company_id = ${user.company_id} AND status = 'paid'`,
      sql`SELECT COUNT(*) as count FROM invoices WHERE company_id = ${user.company_id} AND status = 'pending'`,
      sql`SELECT COUNT(*) as count FROM inventory WHERE company_id = ${user.company_id}`,
      sql`SELECT COUNT(*) as count FROM warehouses WHERE company_id = ${user.company_id} AND is_active = true`,
      sql`SELECT COUNT(*) as count FROM inventory WHERE company_id = ${user.company_id} AND quantity < 10`,
      sql`SELECT COUNT(*) as count FROM invoices WHERE company_id = ${user.company_id} AND status != 'paid' AND due_date < NOW()`,
    ])

    const stats = {
      totalEmployees: Number.parseInt(employeesResult[0].count),
      totalInvoices: Number.parseInt(invoicesResult[0].count),
      totalRevenue: Number.parseFloat(revenueResult[0].total),
      pendingInvoices: Number.parseInt(pendingInvoicesResult[0].count),
      totalInventoryItems: Number.parseInt(inventoryResult[0].count),
      totalWarehouses: Number.parseInt(warehousesResult[0].count),
      lowStockItems: Number.parseInt(lowStockResult[0].count),
      overdueInvoices: Number.parseInt(overdueInvoicesResult[0].count),
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error("Error fetching reports:", error)
    return NextResponse.json({ error: "Unauthorized or server error" }, { status: 401 })
  }
}
