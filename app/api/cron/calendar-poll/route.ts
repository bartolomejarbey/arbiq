import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAuthorizedCron } from '@/lib/cron-auth';
import { pullChanges, initialSync } from '@/lib/services/calendar-sync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: connections } = await admin
    .from('google_oauth_connections')
    .select('user_id')
    .eq('status', 'connected');

  let succeeded = 0;
  let failed = 0;
  for (const c of connections ?? []) {
    try {
      const result = await pullChanges(c.user_id);
      if (result.resetSyncToken) await initialSync(c.user_id);
      succeeded++;
    } catch (e) {
      console.error(`Poll failed for ${c.user_id}:`, e);
      failed++;
    }
  }

  return NextResponse.json({
    ok: true,
    succeeded,
    failed,
    total: (connections ?? []).length,
  });
}
