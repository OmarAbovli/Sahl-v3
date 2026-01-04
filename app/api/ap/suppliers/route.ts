import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/database";
import { hasPermission } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(session, 'ap.view')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const companyId = session.company_id;
  const suppliers = await db.suppliers.findMany({ where: { company_id: companyId } });
  return NextResponse.json(suppliers);
} 