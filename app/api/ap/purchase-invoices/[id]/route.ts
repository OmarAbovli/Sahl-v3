import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/session';
import { db } from '@/db';
import { purchaseInvoices } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { hasPermission } from '@/lib/auth';

// GET: Get a single purchase invoice by ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(session, 'ap.view')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const companyId = session.company_id;
  const [invoice] = await db.select()
    .from(purchaseInvoices)
    .where(and(
      eq(purchaseInvoices.id, Number(params.id)),
      eq(purchaseInvoices.companyId, companyId)
    ))
    .limit(1);

  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(invoice);
}

// PUT: Update a purchase invoice
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(session, 'ap.manage')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const companyId = session.company_id;
  const data = await req.json();
  const [invoice] = await db.update(purchaseInvoices)
    .set(data)
    .where(and(
      eq(purchaseInvoices.id, Number(params.id)),
      eq(purchaseInvoices.companyId, companyId)
    ))
    .returning();

  return NextResponse.json(invoice);
}

// DELETE: Delete a purchase invoice
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(session, 'ap.manage')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const companyId = session.company_id;
  await db.delete(purchaseInvoices)
    .where(and(
      eq(purchaseInvoices.id, Number(params.id)),
      eq(purchaseInvoices.companyId, companyId)
    ));
  return NextResponse.json({ success: true });
}
