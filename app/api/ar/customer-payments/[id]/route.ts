import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/session';
import { db } from '@/db';
import { customerPayments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { hasPermission } from '@/lib/auth';

// GET: Get a single customer payment by ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(session, 'ar.view')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const companyId = session.company_id;
  const [payment] = await db.select()
    .from(customerPayments)
    .where(and(
      eq(customerPayments.id, Number(params.id)),
      eq(customerPayments.companyId, companyId)
    ))
    .limit(1);

  if (!payment) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(payment);
}

// PUT: Update a customer payment
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(session, 'ar.manage')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const companyId = session.company_id;
  const data = await req.json();
  const [payment] = await db.update(customerPayments)
    .set(data)
    .where(and(
      eq(customerPayments.id, Number(params.id)),
      eq(customerPayments.companyId, companyId)
    ))
    .returning();

  return NextResponse.json(payment);
}

// DELETE: Delete a customer payment
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(session, 'ar.manage')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const companyId = session.company_id;
  await db.delete(customerPayments)
    .where(and(
      eq(customerPayments.id, Number(params.id)),
      eq(customerPayments.companyId, companyId)
    ));
  return NextResponse.json({ success: true });
}
