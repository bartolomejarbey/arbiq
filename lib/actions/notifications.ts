'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { untyped } from '@/lib/supabase/untyped';
import { checkRealViewer } from '@/lib/supabase/viewer';

/** Označí notifikaci přihlášeného uživatele jako přečtenou. */
export async function markNotificationRead(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const check = await checkRealViewer();
  if (!check.ok) return { ok: false, error: check.error };
  const admin = createAdminClient();
  await untyped(admin)
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', check.viewer.id);
  revalidatePath('/portal/notifikace');
  return { ok: true };
}

/** Označí všechny notifikace přihlášeného uživatele jako přečtené. */
export async function markAllNotificationsRead(): Promise<{ ok: true } | { ok: false; error: string }> {
  const check = await checkRealViewer();
  if (!check.ok) return { ok: false, error: check.error };
  const admin = createAdminClient();
  await untyped(admin)
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', check.viewer.id)
    .is('read_at', null);
  revalidatePath('/portal/notifikace');
  return { ok: true };
}
