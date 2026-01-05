import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic'
import { db } from "@/db";
import { taxRules } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/session";
import { hasPermission } from "@/lib/auth";

// GET: Get a single tax rule
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(["company_admin"]);
    if (!hasPermission(user, "manage_tax")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const companyId = user.companyId || user.company_id;
    if (!companyId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const [rule] = await db.select()
      .from(taxRules)
      .where(and(
        eq(taxRules.id, Number(params.id)),
        eq(taxRules.companyId, companyId)
      ))
      .limit(1);

    if (!rule) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ rule });
  } catch (error) {
    console.error("Fetch individual tax rule error:", error)
    return NextResponse.json({ error: "Failed to fetch tax rule" }, { status: 500 });
  }
}

// PUT: Update a tax rule
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(["company_admin"]);
    if (!hasPermission(user, "manage_tax")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const companyId = user.companyId || user.company_id;
    if (!companyId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { name, rate, type, is_active } = await req.json();

    const [rule] = await db.update(taxRules)
      .set({
        name,
        rate: rate.toString(),
        type,
        isActive: is_active,
        updatedAt: new Date().toISOString(),
      })
      .where(and(
        eq(taxRules.id, Number(params.id)),
        eq(taxRules.companyId, companyId)
      ))
      .returning();

    if (!rule) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ rule });
  } catch (error) {
    console.error("Update tax rule error:", error)
    return NextResponse.json({ error: "Failed to update tax rule" }, { status: 500 });
  }
}

// DELETE: Delete a tax rule
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(["company_admin"]);
    if (!hasPermission(user, "manage_tax")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const companyId = user.companyId || user.company_id;
    if (!companyId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await db.delete(taxRules)
      .where(and(
        eq(taxRules.id, Number(params.id)),
        eq(taxRules.companyId, companyId)
      ));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete tax rule error:", error)
    return NextResponse.json({ error: "Failed to delete tax rule" }, { status: 500 });
  }
}