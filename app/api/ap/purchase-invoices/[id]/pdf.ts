import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { checkPermission } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!checkPermission(session, 'ap.view')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  // For now, return a placeholder PDF URL
  return NextResponse.json({ url: `/mock-export/purchase-invoice-${params.id}.pdf` });
} 