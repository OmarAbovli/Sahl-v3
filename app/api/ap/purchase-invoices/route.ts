import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/session"
import { db } from "@/db"
import { purchaseInvoices } from "@/db/schema"
import { eq, and, desc, sql as drizzleSql, count } from "drizzle-orm"
import { hasPermission } from "@/lib/auth"

// GET: List purchase invoices for the current company with pagination and filters
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!hasPermission(session, "ap.view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const companyId = session.companyId || session.company_id
    if (!companyId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const url = req.nextUrl || new URL(req.url)
    const limit = parseInt(url.searchParams.get("limit") || "10")
    const offset = parseInt(url.searchParams.get("offset") || "0")
    const status = url.searchParams.get("status")
    const supplier_id = url.searchParams.get("supplier_id")
    const date_from = url.searchParams.get("date_from")
    const date_to = url.searchParams.get("date_to")

    const conditions = [eq(purchaseInvoices.companyId, companyId)]
    if (status) conditions.push(eq(purchaseInvoices.status, status))
    if (supplier_id) conditions.push(eq(purchaseInvoices.supplierId, Number(supplier_id)))
    if (date_from) conditions.push(drizzleSql`${purchaseInvoices.issueDate} >= ${date_from}`)
    if (date_to) conditions.push(drizzleSql`${purchaseInvoices.issueDate} <= ${date_to}`)

    const invoicesData = await db.select()
      .from(purchaseInvoices)
      .where(and(...conditions))
      .orderBy(desc(purchaseInvoices.issueDate))
      .limit(limit)
      .offset(offset)

    const [totalResult] = await db.select({ total: count() })
      .from(purchaseInvoices)
      .where(and(...conditions))

    return NextResponse.json({ invoices: invoicesData, total: totalResult.total })
  } catch (error) {
    console.error("Fetch purchase invoices error:", error)
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 })
  }
}

// POST: Create a new purchase invoice
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!hasPermission(session, "ap.manage")) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const companyId = session.companyId || session.company_id
    if (!companyId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const data = await req.json()

    const [result] = await db.insert(purchaseInvoices).values({
      companyId,
      supplierId: data.supplier_id || null,
      status: data.status || "draft",
      issueDate: data.issue_date || new Date().toISOString().slice(0, 10),
      dueDate: data.due_date || null,
      total: data.total ? data.total.toString() : "0",
      createdBy: session.id,
    }).returning()

    return NextResponse.json(result)
  } catch (error) {
    console.error("Create purchase invoice error:", error)
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 })
  }
}
