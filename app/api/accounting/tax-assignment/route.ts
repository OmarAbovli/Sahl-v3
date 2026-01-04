import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/database";
import { requireAuth } from "@/lib/session";
import { checkPermission } from "@/lib/auth";

// POST: Assign tax rule to product/service
export async function POST(req: NextRequest) {
  const user = await requireAuth(["company_admin"]);
  if (!checkPermission(user, "manage_tax")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { product_id, tax_rule_id } = await req.json();
  await sql`UPDATE inventory SET tax_rule_id = ${tax_rule_id} WHERE id = ${product_id} AND company_id = ${user.company_id}`;
  return NextResponse.json({ success: true });
} 