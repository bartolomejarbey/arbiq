import 'server-only';

import type { SmsProvider, SmsResult } from './provider';
import { SmsBranaProvider } from './smsbrana';
import { NoopSmsProvider } from './noop';
import { normalizePhoneForSms } from './phone';

export type { SmsProvider, SmsResult } from './provider';
export { normalizePhoneForSms } from './phone';
export { asciiFoldCs } from './text';

let _provider: SmsProvider | null = null;

/**
 * Vybere SMS providera dle env. SMSBRANA_LOGIN + SMSBRANA_PASSWORD → SMS Brána,
 * jinak Noop (nic neodešle). Singleton — vytvoří se jen jednou za běh.
 *
 * Přidání dalšího providera = nová větev zde.
 */
export function getSmsProvider(): SmsProvider {
  if (_provider) return _provider;
  const login = process.env.SMSBRANA_LOGIN;
  const password = process.env.SMSBRANA_PASSWORD;
  if (login && password) {
    _provider = new SmsBranaProvider({
      login,
      password,
      senderId: process.env.SMSBRANA_SENDER_ID || undefined,
    });
  } else {
    _provider = new NoopSmsProvider();
  }
  return _provider;
}

/** Jen pro testy — vynuluje cache providera. */
export function __resetSmsProvider(): void {
  _provider = null;
}

/**
 * Odešle SMS na dané (libovolně zformátované) číslo. Číslo se normalizuje,
 * při neúspěchu vrací SmsResult s chybou (nikdy nevyhazuje).
 */
export async function sendSms(toRaw: string | null | undefined, text: string): Promise<SmsResult> {
  const provider = getSmsProvider();
  const to = normalizePhoneForSms(toRaw);
  if (!to) {
    return { ok: false, error: 'Neplatné nebo chybějící telefonní číslo.', provider: provider.name };
  }
  if (!text || !text.trim()) {
    return { ok: false, error: 'Prázdný text SMS.', provider: provider.name };
  }
  return provider.send(to, text);
}

/** Je nakonfigurovaný reálný SMS provider (ne Noop)? */
export function isSmsConfigured(): boolean {
  return getSmsProvider().configured;
}
