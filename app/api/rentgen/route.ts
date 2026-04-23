import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/send';
import { RentgenConfirmEmail } from '@/lib/email/templates/rentgen-confirm';
import { RentgenInternalEmail } from '@/lib/email/templates/rentgen-internal';
import { isLikelySpam, isEmailRateLimited } from '@/lib/spam-protection';

const RentgenSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  phone: z.string().max(40).optional().default(''),
  company: z.string().max(160).optional().default(''),
  url: z.string().min(1).max(500),
  description: z.string().max(4000).optional().default(''),
  utm_source: z.string().max(120).optional().default(''),
  utm_medium: z.string().max(120).optional().default(''),
  utm_campaign: z.string().max(120).optional().default(''),
});

export async function POST(request: Request) {
  const raw = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  if (isLikelySpam(raw)) {
    return NextResponse.json({ success: true, orderId: 'RTG-DROPPED' });
  }

  let parsed: z.infer<typeof RentgenSchema>;
  try {
    parsed = RentgenSchema.parse(raw);
  } catch (err) {
    const issues = err instanceof z.ZodError ? err.issues.map((i) => i.message).join(', ') : 'invalid body';
    return NextResponse.json({ error: `Vyplňte povinná pole. (${issues})` }, { status: 400 });
  }

  const supabase = await createClient();

  if (await isEmailRateLimited({ supabase, table: 'rentgen_orders', email: parsed.email, maxAttempts: 3 })) {
    return NextResponse.json(
      { error: 'Příliš mnoho objednávek z tohoto e-mailu. Zkuste to prosím za hodinu.' },
      { status: 429 },
    );
  }

  const { data: row, error } = await supabase
    .from('rentgen_orders')
    .insert({
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone || null,
      company: parsed.company || null,
      website_url: parsed.url,
      problem_description: parsed.description || null,
      utm_source: parsed.utm_source || null,
      utm_medium: parsed.utm_medium || null,
      utm_campaign: parsed.utm_campaign || null,
    })
    .select('id, created_at')
    .single();

  if (error || !row) {
    console.error('rentgen_orders insert failed', error);
    return NextResponse.json({ error: 'Něco se pokazilo. Zkuste znovu nebo napište na info@arbey.cz' }, { status: 500 });
  }

  // Friendly displayable order id: RTG-YYYYMMDD-<first 6 of uuid>
  const id = (row as { id: string; created_at: string }).id;
  const day = new Date((row as { id: string; created_at: string }).created_at)
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '');
  const orderId = `RTG-${day}-${id.slice(0, 6).toUpperCase()}`;

  await Promise.allSettled([
    sendEmail({
      to: parsed.email,
      subject: `Rentgen objednán — ${orderId}`,
      replyTo: process.env.RESEND_BCC_ADMIN,
      body: RentgenConfirmEmail({
        name: parsed.name,
        orderId,
        websiteUrl: parsed.url,
      }),
    }).catch((e) => console.error('rentgen-confirm email failed', e)),

    process.env.RESEND_BCC_ADMIN
      ? sendEmail({
          to: process.env.RESEND_BCC_ADMIN,
          subject: `[ARBIQ] Nová Rentgen objednávka — ${orderId}`,
          replyTo: parsed.email,
          body: RentgenInternalEmail({
            orderId,
            name: parsed.name,
            email: parsed.email,
            phone: parsed.phone,
            company: parsed.company,
            websiteUrl: parsed.url,
            problemDescription: parsed.description,
            utmSource: parsed.utm_source,
            utmMedium: parsed.utm_medium,
            utmCampaign: parsed.utm_campaign,
          }),
        }).catch((e) => console.error('rentgen-internal email failed', e))
      : Promise.resolve(),
  ]);

  return NextResponse.json({ success: true, orderId });
}
