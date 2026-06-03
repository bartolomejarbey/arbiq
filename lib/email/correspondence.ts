import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import { untyped } from '@/lib/supabase/untyped';

/** Vytáhne čistou e-mailovou adresu z "Jméno <a@b.cz>" → "a@b.cz". */
export function extractEmail(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const m = raw.match(/<([^>]+)>/);
  const addr = (m ? m[1] : raw).trim().toLowerCase();
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(addr) ? addr : null;
}

/** Najde klienta podle libovolného z jeho e-mailů (hlavní / fakturační / smluvní). */
export async function findClientByEmail(rawEmail: string | null | undefined): Promise<string | null> {
  const addr = extractEmail(rawEmail);
  if (!addr) return null;
  // Anti filter-injection: ponech jen znaky platné v e-mailu (odeber , ( ) * apod.),
  // než hodnotu vložíme do PostgREST .or() filtru.
  const safe = addr.replace(/[^a-z0-9@._+-]/g, '');
  if (!safe) return null;
  const admin = createAdminClient();
  const { data } = await untyped(admin)
    .from('profiles')
    .select('id')
    .eq('role', 'klient')
    .or(`email.eq.${safe},billing_email.eq.${safe},contract_email.eq.${safe}`)
    .limit(1)
    .maybeSingle();
  return (data as { id?: string } | null)?.id ?? null;
}

/**
 * Zaloguje e-mailovou korespondenci klienta (zobrazí se mu v zóně).
 * Best-effort — nikdy nehází. Duplicitní message_id se tiše ignoruje.
 */
export async function logClientEmail(opts: {
  clientId: string;
  direction: 'inbound' | 'outbound';
  fromEmail?: string | null;
  toEmail?: string | null;
  subject?: string | null;
  body?: string | null;
  messageId?: string | null;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await untyped(admin).from('client_emails').insert({
      client_id: opts.clientId,
      direction: opts.direction,
      from_email: opts.fromEmail ?? null,
      to_email: opts.toEmail ?? null,
      subject: opts.subject ?? null,
      body: opts.body ?? null,
      message_id: opts.messageId ?? null,
    });
    // 23505 = unique_violation (duplicitní message_id) → ok, ignoruj.
    if (error && error.code !== '23505') {
      console.error('[CORRESPONDENCE] insert failed', error);
    }
  } catch (err) {
    console.error('[CORRESPONDENCE] log failed', err);
  }
}
