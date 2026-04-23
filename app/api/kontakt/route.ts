import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/send';
import { KontaktInternalEmail } from '@/lib/email/templates/kontakt-internal';

const KontaktSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  phone: z.string().max(40).optional().default(''),
  type: z.enum(['general', 'project', 'consultation', 'product']).default('general'),
  message: z.string().min(5).max(4000),
});

export async function POST(request: Request) {
  let parsed: z.infer<typeof KontaktSchema>;
  try {
    parsed = KontaktSchema.parse(await request.json());
  } catch (err) {
    const issues = err instanceof z.ZodError ? err.issues.map((i) => i.message).join(', ') : 'invalid body';
    return NextResponse.json({ error: `Vyplňte povinná pole. (${issues})` }, { status: 400 });
  }

  const supabase = await createClient();

  const { error } = await supabase.from('contact_messages').insert({
    name: parsed.name,
    email: parsed.email,
    phone: parsed.phone || null,
    type: parsed.type,
    message: parsed.message,
  });

  if (error) {
    console.error('contact_messages insert failed', error);
    return NextResponse.json({ error: 'Něco se pokazilo.' }, { status: 500 });
  }

  if (process.env.RESEND_BCC_ADMIN) {
    await sendEmail({
      to: process.env.RESEND_BCC_ADMIN,
      subject: `[ARBIQ] Nová zpráva: ${parsed.name}`,
      replyTo: parsed.email,
      body: KontaktInternalEmail({
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone,
        type: parsed.type,
        message: parsed.message,
      }),
    }).catch((e) => console.error('kontakt-internal email failed', e));
  }

  return NextResponse.json({ success: true });
}
