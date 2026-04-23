import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from './send';
import { PortalNotificationEmail } from './templates/portal-notification';

type NotifyOptions = {
  recipientId: string;
  subject: string;
  heading: string;
  intro: string;
  ctaLabel: string;
  ctaPath: string;
};

/**
 * Send a portal notification email IF the recipient has them enabled.
 * Best-effort — never throws.
 */
export async function notifyPortalUser(opts: NotifyOptions): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('profiles')
      .select('email, full_name, email_notifications_enabled')
      .eq('id', opts.recipientId)
      .single();
    const profile = data as { email?: string; email_notifications_enabled?: boolean } | null;
    if (!profile?.email || profile.email_notifications_enabled === false) return;

    const baseUrl = process.env.APP_URL ?? 'http://localhost:3000';
    const ctaUrl = `${baseUrl}${opts.ctaPath}`;

    await sendEmail({
      to: profile.email,
      subject: opts.subject,
      replyTo: process.env.RESEND_BCC_ADMIN,
      body: PortalNotificationEmail({
        heading: opts.heading,
        intro: opts.intro,
        ctaLabel: opts.ctaLabel,
        ctaUrl,
      }),
    });
  } catch (err) {
    console.error('notifyPortalUser failed', err);
  }
}
