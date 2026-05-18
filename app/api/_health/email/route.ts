import { NextResponse, type NextRequest } from 'next/server';
import { Resend } from 'resend';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Diagnostika emailové konfigurace. Vyžaduje `?token=<CRON_SECRET>`
 * (sdílíme tajemství s cron jobs, abychom nemuseli další secret).
 *
 * Vrací:
 *   - které env vars jsou nastavené (maskované)
 *   - test send (volitelně přes `?send=jan@example.cz`)
 */
function mask(v: string | undefined | null): string {
  if (!v) return '(missing)';
  if (v.length <= 8) return `(set, len=${v.length})`;
  return `${v.slice(0, 4)}...${v.slice(-4)} (len=${v.length})`;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const env = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '(missing)',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: mask(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    SUPABASE_SERVICE_ROLE_KEY: mask(process.env.SUPABASE_SERVICE_ROLE_KEY),
    RESEND_API_KEY: mask(process.env.RESEND_API_KEY),
    RESEND_FROM: process.env.RESEND_FROM || '(missing — fallback ARBIQ <noreply@arbiq.cz>)',
    RESEND_BCC_ADMIN: process.env.RESEND_BCC_ADMIN || '(missing — fallback bartolomej@arbiq.cz,info@arbiq.cz)',
    RESEND_REPLY_TO: process.env.RESEND_REPLY_TO || '(missing)',
    RESEND_INBOUND_WEBHOOK_SECRET: mask(process.env.RESEND_INBOUND_WEBHOOK_SECRET),
    RESEND_FORWARD_DESTINATION: process.env.RESEND_FORWARD_DESTINATION || '(missing)',
    APP_URL: process.env.APP_URL || '(missing)',
  };

  // Supabase service-role ping (problém "Invalid API key" při vytvoření klienta).
  let supabase: unknown = '(skipped — env missing)';
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const c = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false } },
      );
      const { data, error } = await c.auth.admin.listUsers({ page: 1, perPage: 1 });
      if (error) {
        supabase = { ok: false, error: error.message, code: (error as { status?: number }).status };
      } else {
        supabase = { ok: true, userCount: data?.users?.length ?? 0, note: 'service-role key funguje' };
      }
    } catch (err) {
      supabase = { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  const want = url.searchParams.get('send');
  let send: unknown = '(skipped — pass ?send=email to test)';
  if (want && process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const res = await resend.emails.send({
        from: process.env.RESEND_FROM || 'ARBIQ <noreply@arbiq.cz>',
        to: want,
        subject: `[ARBIQ diag] ${new Date().toISOString().slice(0, 19)}`,
        html: '<p>Pokud čteš tento email, Resend funguje z produkce ARBIQ.</p>',
      });
      if (res.error) {
        send = { ok: false, error: res.error.message, code: (res.error as { name?: string }).name };
      } else {
        send = { ok: true, id: res.data?.id ?? null };
      }
    } catch (err) {
      send = { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  } else if (want && !process.env.RESEND_API_KEY) {
    send = { ok: false, error: 'RESEND_API_KEY missing — nemohu poslat' };
  }

  return NextResponse.json({
    ok: !!process.env.RESEND_API_KEY && !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    env,
    supabase,
    send,
    note: 'Pro skutečný test send přidej &send=ty@example.cz',
  }, { status: 200 });
}
