import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/db";
import { purchaseInvoices } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const companyId = user.companyId;
  if (!companyId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const invoiceId = Number(params.id);
  const { new_status } = await req.json();

  try {
    const invoice = await db.query.purchaseInvoices.findFirst({
      where: and(eq(purchaseInvoices.id, invoiceId), eq(purchaseInvoices.companyId, companyId))
    });

    if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await db.update(purchaseInvoices)
      .set({ status: new_status, updatedAt: new Date().toISOString() })
      .where(and(eq(purchaseInvoices.id, invoiceId), eq(purchaseInvoices.companyId, companyId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Purchase invoice status update error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}