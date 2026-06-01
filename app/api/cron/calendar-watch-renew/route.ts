import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAuthorizedCron } from '@/lib/cron-auth';
import { renewWatch } from '@/lib/services/calendar-sync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const cutoff = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
  const { data: connections } = await admin
    .from('google_oauth_connections')
    .select('user_id')
    .eq('status', 'connected')
    .lt('watch_expires_at', cutoff);

  let renewed = 0;
  for (const c of connections ?? []) {
    try {
      await renewWatch(c.user_id);
      renewed++;
    } catch (e) {
      console.error(`Watch renew failed for ${c.user_id}:`, e);
    }
  }

  return NextResponse.json({ ok: true, renewed });
}
