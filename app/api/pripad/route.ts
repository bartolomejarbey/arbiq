import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/send';
import { LeadConfirmEmail } from '@/lib/email/templates/lead-confirm';
import { LeadInternalEmail } from '@/lib/email/templates/lead-internal';
import { isLikelySpam, isEmailRateLimited, HONEYPOT_FIELD } from '@/lib/spam-protection';

const PripadSchema = z.object({
  kampan: z.string().min(1).max(80),
  obor: z.string().max(120).optional().default(''),
  velikost: z.string().max(60).optional().default(''),
  step3: z.string().max(2000).optional().default(''),
  wants: z.array(z.string().max(40)).max(20).optional().default([]),
  budget: z.string().max(40).optional().default(''),
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  phone: z.string().max(40).optional().default(''),
  url: z.string().max(500).optional().default(''),
  popis: z.string().max(4000).optional().default(''),
  utm_source: z.string().max(120).optional().default(''),
  utm_medium: z.string().max(120).optional().default(''),
  utm_campaign: z.string().max(120).optional().default(''),
});

export async function POST(request: Request) {
  const raw = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  // Silently drop bot submissions — pretend success so they don't retry.
  if (isLikelySpam(raw)) {
    return NextResponse.json({ success: true, caseNumber: 'LEAD-2026-00000' });
  }

  let parsed: z.infer<typeof PripadSchema>;
  try {
    parsed = PripadSchema.parse(raw);
  } catch (err) {
    const issues = err instanceof z.ZodError ? err.issues.map((i) => i.message).join(', ') : 'invalid body';
    return NextResponse.json({ error: `Vyplňte povinná pole. (${issues})` }, { status: 400 });
  }

  const supabase = await createClient();

  if (await isEmailRateLimited({ supabase, table: 'landing_leads', email: parsed.email, maxAttempts: 3 })) {
    return NextResponse.json(
      { error: 'Příliš mnoho žádostí z tohoto e-mailu. Zkuste to prosím za hodinu.' },
      { status: 429 },
    );
  }

  // Allocate a case number first so it's stable across retries.
  const { data: caseRow, error: caseErr } = await supabase.rpc('next_case_number');
  if (caseErr || typeof caseRow !== 'string') {
    console.error('next_case_number failed', caseErr);
    return NextResponse.json({ error: 'Nepodařilo se zaregistrovat. Zkuste znovu.' }, { status: 500 });
  }
  const caseNumber = caseRow;

  const { error: insertErr } = await supabase.from('landing_leads').insert({
    kampan: parsed.kampan,
    obor: parsed.obor || null,
    velikost_firmy: parsed.velikost || null,
    step3_odpoved: parsed.step3 || null,
    wants: parsed.wants ?? [],
    budget: parsed.budget || null,
    name: parsed.name,
    email: parsed.email,
    phone: parsed.phone || null,
    website_url: parsed.url || null,
    popis: parsed.popis || null,
    utm_source: parsed.utm_source || null,
    utm_medium: parsed.utm_medium || null,
    utm_campaign: parsed.utm_campaign || null,
    case_number: caseNumber,
  });

  if (insertErr) {
    console.error('landing_leads insert failed', insertErr);
    return NextResponse.json({ error: 'Nepodařilo se uložit. Zkuste znovu.' }, { status: 500 });
  }

  // Best-effort emails. Don't fail the request if Resend hiccups.
  await Promise.allSettled([
    sendEmail({
      to: parsed.email,
      subject: `Děkujeme — Váš případ ${caseNumber}`,
      replyTo: process.env.RESEND_REPLY_TO,
      body: LeadConfirmEmail({ name: parsed.name, caseNumber }),
    }).catch((e) => console.error('lead-confirm email failed', e)),

    process.env.RESEND_BCC_ADMIN
      ? sendEmail({
          to: process.env.RESEND_BCC_ADMIN,
          subject: `[ARBIQ] Nový lead ${caseNumber} (${parsed.kampan})`,
          replyTo: parsed.email,
          body: LeadInternalEmail({
            caseNumber,
            kampan: parsed.kampan,
            obor: parsed.obor,
            velikostFirmy: parsed.velikost,
            step3Odpoved: parsed.step3,
            name: parsed.name,
            email: parsed.email,
            phone: parsed.phone,
            websiteUrl: parsed.url,
            popis: parsed.popis,
            utmSource: parsed.utm_source,
            utmMedium: parsed.utm_medium,
            utmCampaign: parsed.utm_campaign,
          }),
        }).catch((e) => console.error('lead-internal email failed', e))
      : Promise.resolve(),
  ]);

  return NextResponse.json({ success: true, caseNumber });
}
