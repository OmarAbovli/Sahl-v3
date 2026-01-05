import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic'
import { db } from "@/db";
import { taxRules } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/session";
import { hasPermission } from "@/lib/auth";

// GET: List tax rules
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(["company_admin"]);
    if (!hasPermission(user, "manage_tax")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const companyId = user.companyId || user.company_id;
    if (!companyId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const rules = await db.select()
      .from(taxRules)
      .where(eq(taxRules.companyId, companyId))
      .orderBy(desc(taxRules.createdAt));

    return NextResponse.json({ rules });
  } catch (error) {
    console.error("Fetch tax rules error:", error)
    return NextResponse.json({ error: "Failed to fetch tax rules" }, { status: 500 });
  }
}

// POST: Create tax rule
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(["company_admin"]);
    if (!hasPermission(user, "manage_tax")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const companyId = user.companyId || user.company_id;
    if (!companyId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { name, rate, type, is_active } = await req.json();

    const [rule] = await db.insert(taxRules).values({
      companyId,
      name,
      rate: rate.toString(),
      type,
      isActive: is_active ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).returning();

    return NextResponse.json({ rule });
  } catch (error) {
    console.error("Create tax rule error:", error)
    return NextResponse.json({ error: "Failed to create tax rule" }, { status: 500 });
  }
}