import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic'
import { db } from "@/db";
import { inventory, taxRules } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/session";
import { hasPermission } from "@/lib/auth";

// POST: Calculate tax for a transaction
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(["company_admin", "employee"]);
    if (!hasPermission(user, "manage_tax")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const companyId = user.companyId || user.company_id;
    if (!companyId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { amount, product_id } = await req.json();

    const [product] = await db.select()
      .from(inventory)
      .where(and(
        eq(inventory.id, product_id),
        eq(inventory.companyId, companyId)
      ))
      .limit(1);

    if (!product || !product.taxRuleId) return NextResponse.json({ tax: 0, total: amount });

    const [rule] = await db.select()
      .from(taxRules)
      .where(eq(taxRules.id, product.taxRuleId))
      .limit(1);

    if (!rule) return NextResponse.json({ tax: 0, total: amount });

    const tax = (amount * Number(rule.rate)) / 100;
    return NextResponse.json({ tax, total: amount + tax });
  } catch (error) {
    console.error("Tax calculation error:", error)
    return NextResponse.json({ error: "Failed to calculate tax" }, { status: 500 });
  }
}