import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/database";
import { requireAuth } from "@/lib/session";
import { checkPermission } from "@/lib/auth";

// POST: Calculate tax for a transaction
export async function POST(req: NextRequest) {
  const user = await requireAuth(["company_admin"]);
  if (!checkPermission(user, "manage_tax")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { amount, product_id } = await req.json();
  const product = await sql`SELECT tax_rule_id FROM inventory WHERE id = ${product_id} AND company_id = ${user.company_id}`;
  if (!product[0] || !product[0].tax_rule_id) return NextResponse.json({ tax: 0, total: amount });
  const rule = await sql`SELECT rate FROM tax_rules WHERE id = ${product[0].tax_rule_id}`;
  if (!rule[0]) return NextResponse.json({ tax: 0, total: amount });
  const tax = (amount * Number(rule[0].rate)) / 100;
  return NextResponse.json({ tax, total: amount + tax });
} 