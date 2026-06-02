'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { untyped } from '@/lib/supabase/untyped';
import { checkRealViewer, getViewerRole } from '@/lib/supabase/viewer';
import { sendEmail } from '@/lib/email/send';
import { MessageEmail } from '@/lib/email/templates/message';
import { logClientEmail } from '@/lib/email/correspondence';
import { notifyClientStaff } from '@/lib/notifications';

const ReplySchema = z.object({
  subject: z.string().trim().max(200).optional().default(''),
  body: z.string().trim().min(1, 'Napiš text zprávy.').max(8000),
});

export type ReplyResult = { ok: true } | { ok: false; error: string };

/**
 * Admin/obchodník odpoví klientovi e-mailem PŘES aplikaci → odešle se i zaloguje
 * do korespondence (na rozdíl od odpovědi z osobní schránky, která se nezachytí).
 */
export async function sendClientReply(clientId: string, formData: FormData): Promise<ReplyResult> {
  const check = await checkRealViewer();
  if (!check.ok) return { ok: false, error: check.error };
  const role = await getViewerRole();
  if (role !== 'admin' && role !== 'obchodnik') return { ok: false, error: 'Nemáte oprávnění.' };
  if (!process.env.RESEND_API_KEY) return { ok: false, error: 'E-mailová služba není nakonfigurovaná.' };

  let parsed: { subject: string; body: string };
  try {
    parsed = ReplySchema.parse({
      subject: String(formData.get('subject') ?? ''),
      body: String(formData.get('body') ?? ''),
    });
  } catch (err) {
    return { ok: false, error: err instanceof z.ZodError ? err.issues.map((i) => i.message).join(', ') : 'Neplatná data.' };
  }

  const admin = createAdminClient();
  const { data: prof } = await untyped(admin)
    .from('profiles')
    .select('email, full_name, assigned_obchodnik')
    .eq('id', clientId)
    .single();
  const p = prof as { email?: string | null; full_name?: string | null; assigned_obchodnik?: string | null } | null;
  if (!p?.email) return { ok: false, error: 'Klient nemá vyplněný e-mail.' };
  // Ownership: obchodník smí odpovědět jen svému přiřazenému klientovi.
  if (role !== 'admin' && p.assigned_obchodnik !== check.viewer.id) {
    return { ok: false, error: 'Tento klient vám není přiřazen.' };
  }

  const subject = parsed.subject || 'Zpráva od ARBIQ';
  const firstName = p.full_name?.split(' ')[0] ?? null;

  try {
    await sendEmail({
      to: p.email,
      subject,
      replyTo: process.env.RESEND_REPLY_TO,
      body: MessageEmail({
        heading: subject,
        name: firstName,
        body: parsed.body,
        replyHint: 'Odpovědět můžete přímo na tento e-mail.',
      }),
    });
  } catch (err) {
    console.error('[REPLY] send failed', err);
    return { ok: false, error: 'E-mail se nepodařilo odeslat.' };
  }

  await logClientEmail({
    clientId,
    direction: 'outbound',
    fromEmail: process.env.RESEND_FROM ?? 'noreply@arbiq.cz',
    toEmail: p.email,
    subject,
    body: parsed.body,
  });

  revalidatePath(`/portal/crm/klient/${clientId}`);
  revalidatePath('/portal/dashboard');
  return { ok: true };
}

/**
 * Klient napíše zprávu ze své zóny → odejde týmu ARBIQ e-mailem (s reply-to na
 * klienta) a zaloguje se jako příchozí korespondence.
 */
export async function sendZoneMessage(formData: FormData): Promise<ReplyResult> {
  const check = await checkRealViewer();
  if (!check.ok) return { ok: false, error: check.error };
  const role = await getViewerRole();
  if (role !== 'klient') return { ok: false, error: 'Tato akce je jen pro klienty.' };
  if (!process.env.RESEND_API_KEY) return { ok: false, error: 'E-mailová služba není nakonfigurovaná.' };

  const destination = process.env.RESEND_REPLY_TO || process.env.RESEND_FORWARD_DESTINATION;
  if (!destination) return { ok: false, error: 'Cílová schránka není nakonfigurovaná.' };

  let parsed: { subject: string; body: string };
  try {
    parsed = ReplySchema.parse({
      subject: String(formData.get('subject') ?? ''),
      body: String(formData.get('body') ?? ''),
    });
  } catch (err) {
    return { ok: false, error: err instanceof z.ZodError ? err.issues.map((i) => i.message).join(', ') : 'Neplatná data.' };
  }

  const admin = createAdminClient();
  const { data: prof } = await untyped(admin)
    .from('profiles')
    .select('email, full_name')
    .eq('id', check.viewer.id)
    .single();
  const p = prof as { email?: string | null; full_name?: string | null } | null;
  const clientEmail = p?.email ?? check.viewer.email;
  const name = p?.full_name ?? clientEmail;
  const subject = parsed.subject || 'Zpráva z klientské zóny';

  try {
    await sendEmail({
      to: destination,
      subject: `[Zóna] ${subject}`,
      replyTo: clientEmail || undefined,
      bccAdmin: true,
      body: MessageEmail({
        heading: `Zpráva od klienta: ${name}`,
        body: parsed.body,
        replyHint: `Od: ${name}${clientEmail ? ` <${clientEmail}>` : ''}. Odpovědět můžete přes „Odpovědět" v detailu klienta nebo na tento e-mail.`,
      }),
    });
  } catch (err) {
    console.error('[ZONE MSG] send failed', err);
    return { ok: false, error: 'Zprávu se nepodařilo odeslat.' };
  }

  await logClientEmail({
    clientId: check.viewer.id,
    direction: 'inbound',
    fromEmail: clientEmail,
    toEmail: destination,
    subject,
    body: parsed.body,
  });

  // In-app notifikace týmu (přiřazený obchodník + admini).
  await notifyClientStaff(check.viewer.id, {
    type: 'zone_message',
    title: `Nová zpráva od klienta: ${name}`,
    body: subject,
    link: `/portal/crm/klient/${check.viewer.id}`,
  });

  revalidatePath('/portal/dashboard');
  return { ok: true };
}
