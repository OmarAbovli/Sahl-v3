import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/database";
import { requireAuth } from "@/lib/session";
import { checkPermission } from "@/lib/auth";

// GET: Get a single tax rule
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth(["company_admin"]);
  if (!checkPermission(user, "manage_tax")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const rule = await sql`SELECT * FROM tax_rules WHERE id = ${params.id} AND company_id = ${user.company_id}`;
  if (!rule[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ rule: rule[0] });
}

// PUT: Update a tax rule
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth(["company_admin"]);
  if (!checkPermission(user, "manage_tax")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { name, rate, type, is_active } = await req.json();
  const result = await sql`
    UPDATE tax_rules SET name = ${name}, rate = ${rate}, type = ${type}, is_active = ${is_active}
    WHERE id = ${params.id} AND company_id = ${user.company_id}
    RETURNING *
  `;
  if (!result[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ rule: result[0] });
}

// DELETE: Delete a tax rule
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth(["company_admin"]);
  if (!checkPermission(user, "manage_tax")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await sql`DELETE FROM tax_rules WHERE id = ${params.id} AND company_id = ${user.company_id}`;
  return NextResponse.json({ success: true });
} 