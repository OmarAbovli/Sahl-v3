import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/db';
import { supplierPayments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// GET: List supplier payments for the current company
export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const companyId = user.companyId;
  if (!companyId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const payments = await db.query.supplierPayments.findMany({
      where: eq(supplierPayments.companyId, companyId)
    });
    return NextResponse.json(payments);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

// POST: Create a new supplier payment
export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const companyId = user.companyId;
  if (!companyId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const data = await req.json();
    const [payment] = await db.insert(supplierPayments).values({
      ...data,
      companyId: companyId,
      createdBy: user.id
    }).returning();

    return NextResponse.json(payment);
  } catch (error) {
    console.error("Create supplier payment error:", error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}
