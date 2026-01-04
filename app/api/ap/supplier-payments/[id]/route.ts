import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/database';
import { hasPermission } from '@/lib/auth';

// GET: Get a single supplier payment by ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(session, 'ap.view')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const companyId = session.company_id;
  const payment = await db.supplier_payments.findFirst({ where: { id: Number(params.id), company_id: companyId } });
  if (!payment) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(payment);
}

// PUT: Update a supplier payment
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(session, 'ap.manage')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const companyId = session.company_id;
  const data = await req.json();
  const payment = await db.supplier_payments.update({
    where: { id: Number(params.id), company_id: companyId },
    data,
  });
  return NextResponse.json(payment);
}

// DELETE: Delete a supplier payment
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(session, 'ap.manage')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const companyId = session.company_id;
  await db.supplier_payments.delete({ where: { id: Number(params.id), company_id: companyId } });
  return NextResponse.json({ success: true });
}
