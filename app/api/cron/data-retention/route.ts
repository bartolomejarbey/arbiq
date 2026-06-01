import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { untyped } from '@/lib/supabase/untyped';
import { isAuthorizedCron } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const MONTH = 30 * 24 * 3600 * 1000;
const DAY = 24 * 3600 * 1000;

function cutoff(ms: number): string {
  return new Date(Date.now() - ms).toISOString();
}

/**
 * GDPR data retention (storage limitation, čl. 5(1)(e)). Mazání starých
 * provozních/analytických dat. admin_audit_log a finanční doklady se NEMAŽOU.
 * Spouští Vercel cron (denně).
 */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const admin = createAdminClient();
  const deleted: Record<string, number | string> = {};

  const jobs: Array<{ table: string; col: string; olderThanMs: number }> = [
    { table: 'analytics_events', col: 'created_at', olderThanMs: 14 * MONTH },
    { table: 'chat_messages', col: 'created_at', olderThanMs: 12 * MONTH },
    { table: 'chat_sessions', col: 'started_at', olderThanMs: 12 * MONTH },
    { table: 'cookie_consent_log', col: 'created_at', olderThanMs: 36 * MONTH },
    { table: 'event_sync_log', col: 'occurred_at', olderThanMs: 3 * MONTH },
    { table: 'rate_limits', col: 'window_start', olderThanMs: 1 * DAY },
  ];

  for (const j of jobs) {
    try {
      const { count, error } = await untyped(admin)
        .from(j.table)
        .delete({ count: 'exact' })
        .lt(j.col, cutoff(j.olderThanMs));
      deleted[j.table] = error ? `error: ${error.message}` : (count ?? 0);
    } catch (err) {
      deleted[j.table] = `error: ${err instanceof Error ? err.message : 'unknown'}`;
    }
  }

  return NextResponse.json({ ok: true, deleted, ran_at: new Date().toISOString() });
}
