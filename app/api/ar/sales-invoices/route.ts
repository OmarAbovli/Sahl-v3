import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { sql } from '@/lib/database';
import { checkPermission } from '@/lib/auth';

// GET: List sales invoices for the current company with pagination and filters
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!checkPermission(session, 'ar.view')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const companyId = session.company_id;
  const url = req.nextUrl || new URL(req.url);
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const offset = parseInt(url.searchParams.get('offset') || '0');
  const status = url.searchParams.get('status');
  const customer_id = url.searchParams.get('customer_id');
  const date_from = url.searchParams.get('date_from');
  const date_to = url.searchParams.get('date_to');
  let where = `WHERE company_id = ${companyId}`;
  if (status) where += ` AND status = '${status}'`;
  if (customer_id) where += ` AND customer_id = ${Number(customer_id)}`;
  if (date_from) where += ` AND issue_date >= '${date_from}'`;
  if (date_to) where += ` AND issue_date <= '${date_to}'`;
  const invoices = await sql.unsafe(`SELECT * FROM sales_invoices ${where} ORDER BY issue_date DESC LIMIT ${limit} OFFSET ${offset}`);
  const totalResult = await sql.unsafe(`SELECT COUNT(*) as total FROM sales_invoices ${where}`);
  const total = Number(totalResult[0]?.total || 0);
  return NextResponse.json({ invoices, total });
}

// POST: Create a new sales invoice
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!checkPermission(session, 'ar.manage')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const companyId = session.company_id;
  const data = await req.json();
  // TODO: Validate data
  const result = await sql`
    INSERT INTO sales_invoices (company_id, customer_id, status, issue_date, due_date, total, created_by)
    VALUES (
      ${companyId},
      ${data.customer_id || null},
      ${data.status || 'draft'},
      ${data.issue_date || new Date().toISOString().slice(0, 10)},
      ${data.due_date || null},
      ${data.total || 0},
      ${session.id}
    )
    RETURNING *
  `;
  return NextResponse.json(result[0]);
}
