import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic'
import { db } from "@/db";
import { inventory } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/session";
import { hasPermission } from "@/lib/auth";

// POST: Assign tax rule to product/service
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(["company_admin"]);
    if (!hasPermission(user, "manage_tax")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const companyId = user.companyId || user.company_id;
    if (!companyId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { product_id, tax_rule_id } = await req.json();

    await db.update(inventory)
      .set({ taxRuleId: tax_rule_id })
      .where(and(
        eq(inventory.id, product_id),
        eq(inventory.companyId, companyId)
      ));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Tax assignment error:", error)
    return NextResponse.json({ error: "Failed to assign tax rule" }, { status: 500 });
  }
}