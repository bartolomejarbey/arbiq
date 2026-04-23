import { NextResponse } from 'next/server';
import { markOverdueInvoices } from '@/lib/actions/invoices';

export const dynamic = 'force-dynamic';

function isAuthorized(request: Request): boolean {
  const url = new URL(request.url);
  const tokenFromQuery = url.searchParams.get('token');
  const tokenFromHeader = request.headers.get('x-cron-secret');
  // Vercel Cron sends an Authorization: Bearer <CRON_SECRET> header
  const auth = request.headers.get('authorization');
  const tokenFromAuth = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  return tokenFromQuery === expected || tokenFromHeader === expected || tokenFromAuth === expected;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await markOverdueInvoices();
    return NextResponse.json({ ok: true, ran_at: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'failed' }, { status: 500 });
  }
}
