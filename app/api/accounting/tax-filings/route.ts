import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic'
import { db } from "@/db";
import { taxFilings } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/session";
import { hasPermission } from "@/lib/auth";

// GET: List tax filings
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(["company_admin"]);
    if (!hasPermission(user, "manage_tax")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const companyId = user.companyId || user.company_id;
    if (!companyId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const filings = await db.select()
      .from(taxFilings)
      .where(eq(taxFilings.companyId, companyId))
      .orderBy(desc(taxFilings.period));

    return NextResponse.json({ filings });
  } catch (error) {
    console.error("Fetch tax filings error:", error)
    return NextResponse.json({ error: "Failed to fetch tax filings" }, { status: 500 });
  }
}

// POST: Create a tax filing
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(["company_admin"]);
    if (!hasPermission(user, "manage_tax")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const companyId = user.companyId || user.company_id;
    if (!companyId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { period, type, doc_url } = await req.json();

    const [filing] = await db.insert(taxFilings).values({
      companyId,
      period,
      type,
      filed: true,
      docUrl: doc_url,
      filedAt: new Date().toISOString(),
    }).returning();

    return NextResponse.json({ filing });
  } catch (error) {
    console.error("Create tax filing error:", error)
    return NextResponse.json({ error: "Failed to create tax filing" }, { status: 500 });
  }
}