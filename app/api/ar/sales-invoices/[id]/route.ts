import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/session';
import { db } from '@/db';
import { salesInvoices } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { hasPermission } from '@/lib/auth';

// GET: Get a single sales invoice by ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(session, 'ar.view')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const companyId = session.company_id;
  const [invoice] = await db.select()
    .from(salesInvoices)
    .where(and(
      eq(salesInvoices.id, Number(params.id)),
      eq(salesInvoices.companyId, companyId)
    ))
    .limit(1);

  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(invoice);
}

// PUT: Update a sales invoice
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(session, 'ar.manage')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const companyId = session.company_id;
  const data = await req.json();
  const [invoice] = await db.update(salesInvoices)
    .set(data)
    .where(and(
      eq(salesInvoices.id, Number(params.id)),
      eq(salesInvoices.companyId, companyId)
    ))
    .returning();

  return NextResponse.json(invoice);
}

// DELETE: Delete a sales invoice
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(session, 'ar.manage')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const companyId = session.company_id;
  await db.delete(salesInvoices)
    .where(and(
      eq(salesInvoices.id, Number(params.id)),
      eq(salesInvoices.companyId, companyId)
    ));
  return NextResponse.json({ success: true });
}
