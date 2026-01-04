import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { sql } from '@/lib/database';
import { checkPermission } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!checkPermission(session, 'ap.view')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const companyId = session.company_id;
  const rows = await sql.unsafe(`SELECT product_id, SUM(quantity * price) as total FROM purchase_invoice_items WHERE company_id = ${companyId} GROUP BY product_id ORDER BY total DESC LIMIT 5`);
  return NextResponse.json({ top_products: rows });
} 