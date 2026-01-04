import { NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { requireAuth } from "@/lib/session"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    const user = await requireAuth(["company_admin"])

    if (!user.companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 400 })
    }

    const [employeesResult, invoicesResult, inventoryResult, warehousesResult, pendingInvoicesResult, revenueResult] =
      await Promise.all([
        sql`SELECT COUNT(*) as count FROM employees WHERE company_id = ${user.companyId} AND is_active = true`,
        sql`SELECT COUNT(*) as count FROM invoices WHERE company_id = ${user.companyId}`,
        sql`SELECT COUNT(*) as count FROM inventory WHERE company_id = ${user.companyId}`,
        sql`SELECT COUNT(*) as count FROM warehouses WHERE company_id = ${user.companyId} AND is_active = true`,
        sql`SELECT COUNT(*) as count FROM invoices WHERE company_id = ${user.companyId} AND status = 'pending'`,
        sql`SELECT COALESCE(SUM(amount), 0) as total FROM invoices WHERE company_id = ${user.companyId} AND status = 'paid'`,
      ])

    const stats = {
      totalEmployees: Number.parseInt(employeesResult[0].count),
      totalInvoices: Number.parseInt(invoicesResult[0].count),
      totalInventoryItems: Number.parseInt(inventoryResult[0].count),
      totalWarehouses: Number.parseInt(warehousesResult[0].count),
      pendingInvoices: Number.parseInt(pendingInvoicesResult[0].count),
      totalRevenue: Number.parseFloat(revenueResult[0].total),
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error("Error fetching company stats:", error)
    return NextResponse.json({ error: "Unauthorized or server error" }, { status: 401 })
  }
}
