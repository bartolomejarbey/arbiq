import { NextResponse } from 'next/server';
import { isAuthorizedCron } from '@/lib/cron-auth';
import { runRecurringInvoices } from '@/lib/jobs/recurring-invoices';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const result = await runRecurringInvoices();
    return NextResponse.json({ ok: true, ...result, ran_at: new Date().toISOString() });
  } catch (err) {
    console.error('[CRON recurring-invoices]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
