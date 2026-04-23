import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/send';
import { KontaktInternalEmail } from '@/lib/email/templates/kontakt-internal';

const InviteSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  company: z.string().max(160).optional().default(''),
  reason: z.string().max(2000).optional().default(''),
});

export async function POST(request: Request) {
  let parsed: z.infer<typeof InviteSchema>;
  try {
    parsed = InviteSchema.parse(await request.json());
  } catch (err) {
    const issues =
      err instanceof z.ZodError ? err.issues.map((i) => i.message).join(', ') : 'invalid body';
    return NextResponse.json(
      { error: `Vyplňte povinná pole. (${issues})` },
      { status: 400 },
    );
  }

  const fullMessage = [
    '[ŽÁDOST O INVITE DO KLIENTSKÉ ZÓNY]',
    parsed.company ? `Firma: ${parsed.company}` : null,
    '',
    parsed.reason || '(bez další zprávy)',
  ]
    .filter((line) => line !== null)
    .join('\n');

  const supabase = await createClient();
  const { error } = await supabase.from('contact_messages').insert({
    name: parsed.name,
    email: parsed.email,
    type: 'general',
    message: fullMessage,
  });

  if (error) {
    console.error('invite-request insert failed', error);
    return NextResponse.json(
      { error: 'Nepodařilo se odeslat. Zkuste to prosím za chvíli, nebo nám napište na info@arbiq.cz.' },
      { status: 500 },
    );
  }

  if (process.env.RESEND_BCC_ADMIN) {
    await sendEmail({
      to: process.env.RESEND_BCC_ADMIN,
      subject: `[ARBIQ] Žádost o invite do portálu — ${parsed.name}`,
      replyTo: parsed.email,
      body: KontaktInternalEmail({
        name: parsed.name,
        email: parsed.email,
        phone: null,
        type: 'general',
        message: fullMessage,
      }),
    }).catch((e) => console.error('invite-request email failed', e));
  }

  return NextResponse.json({ success: true });
}
