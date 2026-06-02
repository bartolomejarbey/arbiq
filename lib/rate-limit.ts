import 'server-only';

import { createHash } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

/** Denně rotující hash IP (nekoreluje napříč dny, dovolí rate-limit klíč). */
export function clientIpHash(req: Request, salt = 'rl'): string {
  // Preferuj platformou nastavené hlavičky (Vercel) — x-forwarded-for je
  // user-controlled a dá se spoofnout pro obejití limitu.
  const ip =
    req.headers.get('x-vercel-forwarded-for') ??
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown';
  const day = new Date().toISOString().slice(0, 10);
  return createHash('sha256').update(`${ip}|${day}|${salt}`).digest('hex').slice(0, 16);
}

/**
 * Serverless-safe rate limit přes DB RPC rl_hit (atomický counter).
 * Vrací true = povoleno (pod limitem). Fail-open při chybě DB.
 */
export async function rateLimit(
  supabase: SupabaseClient,
  bucket: string,
  limit: number,
  windowSec: number,
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('rl_hit', {
      p_bucket: bucket,
      p_limit: limit,
      p_window: windowSec,
    });
    if (error) return true;
    return data === true;
  } catch {
    return true;
  }
}
