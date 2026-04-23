import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createHash } from 'crypto';

const TrackSchema = z.object({
  visitor_id: z.string().min(4).max(64),
  session_id: z.string().min(4).max(64),
  event: z.string().min(1).max(60),
  page: z.string().max(200).optional().default('/'),
  referrer: z.string().max(300).nullable().optional(),
  utm: z.record(z.string(), z.string().max(100)).optional().default({}),
  props: z.record(z.string(), z.unknown()).optional().default({}),
});

function hashIp(req: Request): string | null {
  const xff = req.headers.get('x-forwarded-for');
  const ip = xff?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? null;
  if (!ip) return null;
  const day = new Date().toISOString().slice(0, 10);
  return createHash('sha256').update(`${ip}|${day}|arbiq`).digest('hex').slice(0, 16);
}

export async function POST(request: Request) {
  let parsed: z.infer<typeof TrackSchema>;
  try {
    parsed = TrackSchema.parse(await request.json());
  } catch {
    // Tracker je best-effort — nikdy nesmí blokovat klienta.
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  const supabase = await createClient();
  const utm = parsed.utm ?? {};

  const { error } = await supabase.from('analytics_events').insert({
    visitor_id: parsed.visitor_id,
    session_id: parsed.session_id,
    event: parsed.event,
    page: parsed.page,
    referrer: parsed.referrer ?? null,
    utm_source: utm.utm_source ?? null,
    utm_medium: utm.utm_medium ?? null,
    utm_campaign: utm.utm_campaign ?? null,
    utm_term: utm.utm_term ?? null,
    utm_content: utm.utm_content ?? null,
    user_agent: request.headers.get('user-agent')?.slice(0, 400) ?? null,
    ip_hash: hashIp(request),
    props: (parsed.props ?? {}) as never,
  });

  if (error) {
    console.error('track insert failed', error.message);
  }
  return NextResponse.json({ ok: true });
}
