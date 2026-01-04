import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/database";
import { requireAuth } from "@/lib/session";
import { checkPermission } from "@/lib/auth";

// GET: List tax rules
export async function GET(req: NextRequest) {
  const user = await requireAuth(["company_admin"]);
  if (!checkPermission(user, "manage_tax")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const rules = await sql`SELECT * FROM tax_rules WHERE company_id = ${user.company_id} ORDER BY created_at DESC`;
  return NextResponse.json({ rules });
}

// POST: Create tax rule
export async function POST(req: NextRequest) {
  const user = await requireAuth(["company_admin"]);
  if (!checkPermission(user, "manage_tax")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { name, rate, type, is_active } = await req.json();
  const result = await sql`
    INSERT INTO tax_rules (company_id, name, rate, type, is_active)
    VALUES (${user.company_id}, ${name}, ${rate}, ${type}, ${is_active ?? true})
    RETURNING *
  `;
  return NextResponse.json({ rule: result[0] });
} 