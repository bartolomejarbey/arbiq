import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import { untyped } from '@/lib/supabase/untyped';
import { sendEmail } from '@/lib/email/send';
import { PortalNotificationEmail } from '@/lib/email/templates/portal-notification';
import { sendSms, asciiFoldCs } from '@/lib/sms';
import {
  resolveChannels,
  type ResolvedChannels,
  type ProfileFlags,
  type PrefRow,
} from './channels';

export { NOTIFICATION_TYPES, resolveChannels } from './channels';
export type { ResolvedChannels } from './channels';

/**
 * Jednotná notifikační vrstva. `notify()` rozešle jednu událost do tří kanálů
 * (in-app, e-mail, SMS) podle preferencí uživatele. Best-effort: nikdy
 * nevyhazuje, výsledek za kanál vrací v NotifyResult.
 */
export type NotifyInput = {
  userId: string;
  type: string;
  title: string;
  body?: string;
  /** Relativní cesta v portálu (např. "/portal/faktury"). */
  link?: string;
  /** Vlastní krátký text pro SMS. Default = title (+ body), ASCII, max 459 zn. */
  smsText?: string;
  /** Tvrdé vynucení kanálů (přebije preference). */
  channels?: { inapp?: boolean; email?: boolean; sms?: boolean };
};

export type NotifyResult = ResolvedChannels & {
  errors: string[];
  smsProvider?: string;
};

function absoluteUrl(link?: string): string {
  const base = (process.env.APP_URL || 'https://arbiq.cz').replace(/\/$/, '');
  if (!link) return `${base}/portal`;
  if (/^https?:\/\//.test(link)) return link;
  return `${base}${link.startsWith('/') ? '' : '/'}${link}`;
}

export async function notify(input: NotifyInput): Promise<NotifyResult> {
  const errors: string[] = [];
  const admin = createAdminClient();

  // 1) Profil + preference
  const { data: profileRaw } = await untyped(admin)
    .from('profiles')
    .select('email, phone, email_notifications_enabled, sms_notifications_enabled')
    .eq('id', input.userId)
    .maybeSingle();
  const profile = profileRaw as {
    email?: string | null;
    phone?: string | null;
    email_notifications_enabled?: boolean | null;
    sms_notifications_enabled?: boolean | null;
  } | null;

  if (!profile) {
    return { inapp: false, email: false, sms: false, errors: ['Uživatel nenalezen.'] };
  }

  const { data: prefRaw } = await untyped(admin)
    .from('notification_prefs')
    .select('email, sms, inapp')
    .eq('user_id', input.userId)
    .eq('type', input.type)
    .maybeSingle();
  const pref = (prefRaw as PrefRow) ?? null;

  const flags: ProfileFlags = {
    hasEmail: Boolean(profile.email),
    hasPhone: Boolean(profile.phone),
    emailEnabled: profile.email_notifications_enabled ?? true,
    smsEnabled: profile.sms_notifications_enabled ?? false,
  };
  const channels = resolveChannels(flags, pref, input.channels);

  // 2) In-app
  if (channels.inapp) {
    const { error } = await untyped(admin).from('notifications').insert({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      link: input.link ?? null,
    });
    if (error) errors.push(`in-app: ${error.message}`);
  }

  // 3) E-mail (best-effort)
  if (channels.email && profile.email) {
    try {
      if (process.env.RESEND_API_KEY) {
        await sendEmail({
          to: profile.email,
          subject: input.title,
          body: PortalNotificationEmail({
            heading: input.title,
            intro: input.body ?? input.title,
            ctaLabel: 'Otevřít v portálu',
            ctaUrl: absoluteUrl(input.link),
          }),
        });
      } else {
        errors.push('e-mail: RESEND_API_KEY není nastaven.');
      }
    } catch (err) {
      errors.push(`e-mail: ${err instanceof Error ? err.message : 'odeslání selhalo'}`);
    }
  }

  // 4) SMS (best-effort)
  let smsProvider: string | undefined;
  if (channels.sms && profile.phone) {
    const raw = input.smsText ?? `${input.title}${input.body ? `: ${input.body}` : ''}`;
    const text = asciiFoldCs(raw).slice(0, 459);
    const res = await sendSms(profile.phone, text);
    smsProvider = res.provider;
    if (!res.ok) errors.push(`sms: ${res.error}`);
  }

  return { ...channels, errors, smsProvider };
}
