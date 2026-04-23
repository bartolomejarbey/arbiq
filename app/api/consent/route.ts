import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createHash } from 'crypto';

const ConsentSchema = z.object({
  anon_id: z.string().min(8).max(64),
  necessary: z.boolean().default(true),
  analytics: z.boolean().default(false),
  marketing: z.boolean().default(false),
  source: z.enum(['banner_accept_all', 'banner_necessary', 'banner_custom', 'portal_settings']).default('banner_custom'),
});

function hashIp(req: Request): string | null {
  const xff = req.headers.get('x-forwarded-for');
  const ip = xff?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? null;
  if (!ip) return null;
  // Hash s daily salt — neumožňuje korelovat přes dny ale dovoluje deduplikaci za den
  const day = new Date().toISOString().slice(0, 10);
  return createHash('sha256').update(`${ip}|${day}|arbiq`).digest('hex').slice(0, 16);
}

export async function POST(request: Request) {
  let parsed: z.infer<typeof ConsentSchema>;
  try {
    parsed = ConsentSchema.parse(await request.json());
  } catch (err) {
    const issues = err instanceof z.ZodError ? err.issues.map((i) => i.message).join(', ') : 'invalid';
    return NextResponse.json({ error: issues }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from('cookie_consent_log').insert({
    anon_id: parsed.anon_id,
    necessary: parsed.necessary,
    analytics: parsed.analytics,
    marketing: parsed.marketing,
    source: parsed.source,
    ip_hash: hashIp(request),
    user_agent: request.headers.get('user-agent')?.slice(0, 400) ?? null,
  });

  if (error) {
    console.error('consent insert failed', error);
    // Fail-open: nezablokujeme uživatele jen kvůli logging
    return NextResponse.json({ ok: true, logged: false });
  }
  return NextResponse.json({ ok: true, logged: true });
}
