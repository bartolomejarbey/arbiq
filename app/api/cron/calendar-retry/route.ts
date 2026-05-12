import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  pushEventInsert,
  pushEventUpdate,
  pushEventDelete,
} from '@/lib/services/calendar-sync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_RETRY_AGE_HOURS = 24;

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (token !== process.env.CRON_SECRET) {
    return new NextResponse('forbidden', { status: 403 });
  }

  const admin = createAdminClient();
  const cutoff = new Date(
    Date.now() - MAX_RETRY_AGE_HOURS * 3600 * 1000,
  ).toISOString();
  const { data: failing } = await admin
    .from('events')
    .select()
    .eq('sync_status', 'error')
    .gte('updated_at', cutoff)
    .limit(50);

  let retried = 0;
  for (const ev of failing ?? []) {
    if (ev.deleted_at) {
      await pushEventDelete(ev);
    } else if (ev.google_event_id) {
      await pushEventUpdate(ev);
    } else {
      await pushEventInsert(ev, { withMeet: !!ev.meet_link });
    }
    retried++;
  }

  return NextResponse.json({ ok: true, retried });
}
