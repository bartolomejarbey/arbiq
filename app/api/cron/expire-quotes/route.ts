import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { untyped } from '@/lib/supabase/untyped';
import { isAuthorizedCron } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';

/**
 * Nabídky po platnosti (valid_until < dnes), které jsou koncept/poslané, označí
 * jako 'expirovano'. Spouští Vercel cron (denně).
 */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await untyped(admin)
    .from('quotes')
    .update({ status: 'expirovano' })
    .lt('valid_until', today)
    .in('status', ['koncept', 'poslano'])
    .select('id');

  if (error) {
    console.error('[CRON expire-quotes]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, expired: (data ?? []).length, ran_at: new Date().toISOString() });
}
