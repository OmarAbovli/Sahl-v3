import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/db";
import { salesInvoices, salesInvoiceStatusHistory } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Basic role check for admin/employee
  if (user.role === 'employee' && !user.permissions?.manage_sales) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const companyId = user.companyId;
  if (!companyId) return NextResponse.json({ error: 'Company ID missing' }, { status: 403 });

  const invoiceId = Number(params.id);
  const { new_status } = await req.json();

  try {
    const invoice = await db.query.salesInvoices.findFirst({
      where: and(eq(salesInvoices.id, invoiceId), eq(salesInvoices.companyId, companyId))
    });

    if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await db.transaction(async (tx) => {
      // 1. Update Invoice Status
      await tx.update(salesInvoices)
        .set({ status: new_status })
        .where(and(eq(salesInvoices.id, invoiceId), eq(salesInvoices.companyId, companyId)));

      // 2. Log History
      await tx.insert(salesInvoiceStatusHistory).values({
        invoiceId: invoiceId,
        oldStatus: invoice.status || 'draft',
        newStatus: new_status,
        changedBy: user.id,
        notes: `Status updated via API by ${user.email}`
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sales invoice status update error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}