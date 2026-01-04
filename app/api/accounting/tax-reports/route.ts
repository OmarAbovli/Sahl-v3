import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/database";
import { requireAuth } from "@/lib/session";
import { checkPermission } from "@/lib/auth";

// GET: List tax reports with filters
export async function GET(req: NextRequest) {
  const user = await requireAuth(["company_admin"]);
  if (!checkPermission(user, "manage_tax")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = req.nextUrl || new URL(req.url);
  const period = url.searchParams.get("period");
  const type = url.searchParams.get("type");
  const filed = url.searchParams.get("filed");
  let where = `WHERE company_id = ${user.company_id}`;
  if (period) where += ` AND period = '${period}'`;
  if (type) where += ` AND type = '${type}'`;
  if (filed) where += ` AND filed = ${filed === "true" ? "TRUE" : "FALSE"}`;
  const reports = await sql.unsafe(`SELECT * FROM tax_reports ${where} ORDER BY period DESC`);
  return NextResponse.json({ reports });
}

// GET /export: Export tax reports as CSV (mock)
export async function GET_export(req: NextRequest) {
  // This is a mock implementation. Real CSV export would stream a file.
  return NextResponse.json({ url: "/mock-export/tax-reports.csv" });
} 