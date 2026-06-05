'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { untyped } from '@/lib/supabase/untyped';
import { checkRealViewer, getViewerRole } from '@/lib/supabase/viewer';
import { sendSms, isSmsConfigured } from '@/lib/sms';
import { notify } from '@/lib/notifications/dispatch';

/**
 * Uloží master přepínače notifikací přihlášeného uživatele (e-mail / SMS)
 * a volitelně telefon (kvůli SMS).
 */
export async function saveNotificationMaster(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const check = await checkRealViewer();
  if (!check.ok) return { ok: false, error: check.error };

  const emailEnabled = formData.get('email_enabled') === 'on' || formData.get('email_enabled') === 'true';
  const smsEnabled = formData.get('sms_enabled') === 'on' || formData.get('sms_enabled') === 'true';
  const phoneRaw = String(formData.get('phone') ?? '').trim();
  const phone = phoneRaw === '' ? undefined : phoneRaw.slice(0, 40);

  const update: Record<string, unknown> = {
    email_notifications_enabled: emailEnabled,
    sms_notifications_enabled: smsEnabled,
  };
  if (phone !== undefined) update.phone = phone || null;

  const admin = createAdminClient();
  const { error } = await untyped(admin).from('profiles').update(update).eq('id', check.viewer.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/portal/nastaveni/notifikace');
  return { ok: true };
}

const PrefSchema = z.object({
  type: z.string().min(1).max(60),
  email: z.boolean(),
  sms: z.boolean(),
  inapp: z.boolean(),
});

/** Uloží per-typ preferenci kanálů přihlášeného uživatele (upsert). */
export async function saveNotificationPref(
  raw: { type: string; email: boolean; sms: boolean; inapp: boolean },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const check = await checkRealViewer();
  if (!check.ok) return { ok: false, error: check.error };

  let parsed: z.infer<typeof PrefSchema>;
  try {
    parsed = PrefSchema.parse(raw);
  } catch {
    return { ok: false, error: 'Neplatná data preference.' };
  }

  const admin = createAdminClient();
  const { error } = await untyped(admin)
    .from('notification_prefs')
    .upsert(
      {
        user_id: check.viewer.id,
        type: parsed.type,
        email: parsed.email,
        sms: parsed.sms,
        inapp: parsed.inapp,
      },
      { onConflict: 'user_id,type' },
    );
  if (error) return { ok: false, error: error.message };
  revalidatePath('/portal/nastaveni/notifikace');
  return { ok: true };
}

/**
 * Odešle testovací SMS na zadané číslo — pro ověření, že SMS Brána funguje.
 * Jen admin (odeslání stojí kredit).
 */
export async function sendTestSms(
  toNumber: string,
): Promise<{ ok: true; info: string } | { ok: false; error: string }> {
  const check = await checkRealViewer();
  if (!check.ok) return { ok: false, error: check.error };
  const role = await getViewerRole();
  if (role !== 'admin') return { ok: false, error: 'Testovací SMS smí poslat jen administrátor.' };
  if (!isSmsConfigured()) {
    return { ok: false, error: 'SMS provider není nakonfigurovaný (SMSBRANA_LOGIN/PASSWORD v .env).' };
  }
  const res = await sendSms(toNumber, 'ARBIQ: testovaci SMS. Pokud ji vidis, SMS Brana funguje.');
  if (!res.ok) return { ok: false, error: `Odeslání selhalo: ${res.error}` };
  const credit = res.credit != null ? ` Zbývající kredit: ${res.credit}.` : '';
  return { ok: true, info: `Odesláno přes ${res.provider}.${credit}` };
}

/**
 * Pošle přihlášenému uživateli testovací notifikaci do všech jeho aktivních
 * kanálů (in-app + e-mail + případně SMS) — ověří celý dispatch řetězec.
 */
export async function sendTestNotification(): Promise<{ ok: true; info: string } | { ok: false; error: string }> {
  const check = await checkRealViewer();
  if (!check.ok) return { ok: false, error: check.error };
  const res = await notify({
    userId: check.viewer.id,
    type: 'system',
    title: 'Testovací notifikace ARBIQ',
    body: 'Toto je test notifikační vrstvy (in-app, e-mail, SMS).',
    link: '/portal/notifikace',
  });
  const active = [res.inapp && 'in-app', res.email && 'e-mail', res.sms && 'SMS'].filter(Boolean).join(', ') || 'žádný';
  const errs = res.errors.length ? ` Chyby: ${res.errors.join('; ')}` : '';
  revalidatePath('/portal/notifikace');
  return { ok: true, info: `Kanály: ${active}.${errs}` };
}
