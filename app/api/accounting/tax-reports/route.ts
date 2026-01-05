import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic'
import { db } from "@/db";
import { taxReports } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/session";
import { hasPermission } from "@/lib/auth";

// GET: List tax reports with filters
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(["company_admin"]);
    if (!hasPermission(user, "manage_tax")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const companyId = user.companyId || user.company_id;
    if (!companyId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const url = req.nextUrl || new URL(req.url);
    const period = url.searchParams.get("period");
    const type = url.searchParams.get("type");
    const filed = url.searchParams.get("filed");

    let query = db.select().from(taxReports).where(eq(taxReports.companyId, companyId));

    // Simple filter logic for demonstration, Drizzle allows chainable where clauses
    // but here we might need to combine them.
    const conditions = [eq(taxReports.companyId, companyId)];
    if (period) conditions.push(eq(taxReports.period, period));
    if (type) conditions.push(eq(taxReports.type, type));
    if (filed) conditions.push(eq(taxReports.filed, filed === "true"));

    const reports = await db.select()
      .from(taxReports)
      .where(and(...conditions))
      .orderBy(desc(taxReports.period));

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Tax reports error:", error)
    return NextResponse.json({ error: "Failed to fetch tax reports" }, { status: 500 });
  }
}

// GET /export: Export tax reports as CSV (mock)
// Note: In Next.js App Router, you'd usually use a separate file or handle by search params
// Original code had GET_export which is not a standard export name for App Router
export async function POST_export(req: NextRequest) {
  return NextResponse.json({ url: "/mock-export/tax-reports.csv" });
}