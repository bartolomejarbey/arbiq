import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

function isAuthorized(request: Request): boolean {
  const url = new URL(request.url);
  const tokenFromQuery = url.searchParams.get('token');
  const tokenFromHeader = request.headers.get('x-cron-secret');
  const auth = request.headers.get('authorization');
  const tokenFromAuth = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  return tokenFromQuery === expected || tokenFromHeader === expected || tokenFromAuth === expected;
}

/**
 * For every active klient with no contact log in the last 7 days and no
 * existing follow-up task, create one for their assigned obchodnik (or admin).
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const admin = createAdminClient();
  const sevenAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

  type Client = { id: string; full_name: string; assigned_obchodnik: string | null };
  const { data: clients } = await admin
    .from('profiles')
    .select('id, full_name, assigned_obchodnik')
    .eq('role', 'klient')
    .eq('is_active', true);
  if (!clients) return NextResponse.json({ ok: true, created: 0 });

  // Find one fallback admin user
  const { data: adminProfile } = await admin
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();
  const fallbackAdmin = (adminProfile as { id?: string } | null)?.id ?? null;

  let created = 0;
  for (const c of (clients as unknown as Client[])) {
    const { count: recentContact } = await admin
      .from('crm_contacts')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', c.id)
      .gte('created_at', sevenAgo);
    if ((recentContact ?? 0) > 0) continue;

    const { count: openFollowup } = await admin
      .from('crm_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', c.id)
      .ilike('title', 'Follow-up%')
      .neq('status', 'done')
      .neq('status', 'cancelled');
    if ((openFollowup ?? 0) > 0) continue;

    const assignee = c.assigned_obchodnik ?? fallbackAdmin;
    if (!assignee) continue;

    await admin.from('crm_tasks').insert({
      assigned_to: assignee,
      client_id: c.id,
      title: `Follow-up ${c.full_name}`,
      description: `7+ dní bez kontaktu. Ozvěte se klientovi.`,
      priority: 'normal',
      status: 'todo',
      due_date: new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10),
    });
    created++;
  }

  return NextResponse.json({ ok: true, created, ran_at: new Date().toISOString() });
}
