import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/database";
import { requireAuth } from "@/lib/session";
import { checkPermission } from "@/lib/auth";

// GET: List tax filings
export async function GET(req: NextRequest) {
  const user = await requireAuth(["company_admin"]);
  if (!checkPermission(user, "manage_tax")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const filings = await sql`SELECT * FROM tax_filings WHERE company_id = ${user.company_id} ORDER BY period DESC`;
  return NextResponse.json({ filings });
}

// POST: Create a tax filing
export async function POST(req: NextRequest) {
  const user = await requireAuth(["company_admin"]);
  if (!checkPermission(user, "manage_tax")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { period, type, doc_url } = await req.json();
  const result = await sql`
    INSERT INTO tax_filings (company_id, period, type, filed, doc_url, filed_at)
    VALUES (${user.company_id}, ${period}, ${type}, true, ${doc_url}, NOW())
    RETURNING *
  `;
  return NextResponse.json({ filing: result[0] });
} 