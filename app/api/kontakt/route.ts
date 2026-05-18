import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/send';
import { KontaktInternalEmail } from '@/lib/email/templates/kontakt-internal';
import { isLikelySpam, isEmailRateLimited } from '@/lib/spam-protection';

/** Form posílá české slugs (obecna/projekt/konzultace/produkt) — zde je mapujeme na EN klíče. */
const CZ_TO_EN_TYPE: Record<string, 'general' | 'project' | 'consultation' | 'product'> = {
  obecna: 'general',
  obecný: 'general',
  general: 'general',
  projekt: 'project',
  project: 'project',
  konzultace: 'consultation',
  consultation: 'consultation',
  produkt: 'product',
  product: 'product',
};

const KontaktSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  phone: z.string().max(40).optional().default(''),
  type: z.preprocess(
    (v) => (typeof v === 'string' && CZ_TO_EN_TYPE[v.toLowerCase()]) || v || 'general',
    z.enum(['general', 'project', 'consultation', 'product']).default('general'),
  ),
  message: z.string().min(5).max(4000),
});

export async function POST(request: Request) {
  const raw = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  if (isLikelySpam(raw)) {
    return NextResponse.json({ success: true });
  }

  let parsed: z.infer<typeof KontaktSchema>;
  try {
    parsed = KontaktSchema.parse(raw);
  } catch (err) {
    const issues = err instanceof z.ZodError ? err.issues.map((i) => i.message).join(', ') : 'invalid body';
    return NextResponse.json({ error: `Vyplňte povinná pole. (${issues})` }, { status: 400 });
  }

  const supabase = await createClient();

  if (await isEmailRateLimited({ supabase, table: 'contact_messages', email: parsed.email, maxAttempts: 5 })) {
    return NextResponse.json(
      { error: 'Příliš mnoho zpráv z tohoto e-mailu. Zkuste to prosím za hodinu.' },
      { status: 429 },
    );
  }

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

  // Notifikace pro admina (BCC) — sendEmail si bere RESEND_BCC_ADMIN sám,
  // s fallbackem na bartolomej@arbiq.cz,info@arbiq.cz.
  const adminTo = process.env.RESEND_BCC_ADMIN || 'bartolomej@arbiq.cz,info@arbiq.cz';
  await sendEmail({
    to: adminTo,
    subject: `[ARBIQ] Nová zpráva: ${parsed.name}`,
    replyTo: parsed.email,
    body: KontaktInternalEmail({
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone,
      type: parsed.type,
      message: parsed.message,
    }),
  }).catch((e) => console.error('[KONTAKT] internal email failed:', e));

  return NextResponse.json({ success: true });
}
