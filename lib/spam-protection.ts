import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Hidden form field name. Real users never fill it (it has display:none).
 * Spam bots blindly fill every input — we silently drop those submissions.
 */
export const HONEYPOT_FIELD = 'website_url_hp';

/** Returns true if the payload trips the honeypot. */
export function isLikelySpam(payload: Record<string, unknown> | null | undefined): boolean {
  if (!payload || typeof payload !== 'object') return false;
  const v = (payload as Record<string, unknown>)[HONEYPOT_FIELD];
  return typeof v === 'string' && v.length > 0;
}

type RateLimitArgs = {
  supabase: SupabaseClient;
  table: 'landing_leads' | 'rentgen_orders' | 'contact_messages';
  email: string;
  withinHours?: number;
  maxAttempts?: number;
};

/**
 * Soft per-email rate limit: counts how many rows in `table` were submitted
 * with this `email` in the last `withinHours`. Returns true if over `maxAttempts`.
 *
 * Uses Supabase counted query against the table the form would write into.
 * Fail-open: if the count query throws, we let the request through (better
 * than blocking real users when DB hiccups).
 */
export async function isEmailRateLimited(args: RateLimitArgs): Promise<boolean> {
  const { supabase, table, email, withinHours = 1, maxAttempts = 3 } = args;
  try {
    const since = new Date(Date.now() - withinHours * 3600 * 1000).toISOString();
    const { count } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq('email', email.toLowerCase())
      .gte('created_at', since);
    return (count ?? 0) >= maxAttempts;
  } catch {
    return false;
  }
}
