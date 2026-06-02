import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import { untyped } from '@/lib/supabase/untyped';

type NotifyInput = { userId: string; type: string; title: string; body?: string | null; link?: string | null };

/** Notifikuj všechny aktivní adminy (např. nový lead). */
export async function notifyAdmins(opts: Omit<NotifyInput, 'userId'>): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: admins } = await untyped(admin)
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .eq('is_active', true);
    for (const a of (admins ?? []) as Array<{ id: string }>) {
      await notify({ userId: a.id, ...opts });
    }
  } catch (err) {
    console.error('[NOTIFY] notifyAdmins failed', err);
  }
}

/** Vytvoří in-app notifikaci. Best-effort — nikdy nehází. */
export async function notify(opts: NotifyInput): Promise<void> {
  try {
    const admin = createAdminClient();
    await untyped(admin).from('notifications').insert({
      user_id: opts.userId,
      type: opts.type,
      title: opts.title,
      body: opts.body ?? null,
      link: opts.link ?? null,
    });
  } catch (err) {
    console.error('[NOTIFY] insert failed', err);
  }
}

/**
 * Notifikuj tým odpovědný za klienta: přiřazeného obchodníka + všechny aktivní
 * adminy. Použij pro události typu "klient něco udělal".
 */
export async function notifyClientStaff(
  clientId: string,
  opts: Omit<NotifyInput, 'userId'>,
): Promise<void> {
  try {
    const admin = createAdminClient();
    const recipients = new Set<string>();
    const { data: c } = await untyped(admin)
      .from('profiles')
      .select('assigned_obchodnik')
      .eq('id', clientId)
      .single();
    const obch = (c as { assigned_obchodnik?: string | null } | null)?.assigned_obchodnik;
    if (obch) {
      const { data: o } = await untyped(admin).from('profiles').select('is_active').eq('id', obch).single();
      if ((o as { is_active?: boolean } | null)?.is_active) recipients.add(obch);
    }
    const { data: admins } = await untyped(admin)
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .eq('is_active', true);
    for (const a of (admins ?? []) as Array<{ id: string }>) recipients.add(a.id);
    for (const uid of recipients) await notify({ userId: uid, ...opts });
  } catch (err) {
    console.error('[NOTIFY] notifyClientStaff failed', err);
  }
}
