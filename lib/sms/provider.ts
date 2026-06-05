/**
 * Obecné rozhraní SMS poskytovatele. Konkrétní implementace (SMS Brána) žije
 * v `./smsbrana`, fallback v `./noop`. Výběr dle env v `./index`.
 *
 * Záměr: vrstva je "připravená na vložení API" — přidání dalšího providera =
 * nová třída implementující SmsProvider + větev v getSmsProvider().
 */
export type SmsResult =
  | { ok: true; id?: string; price?: number; credit?: number; provider: string }
  | { ok: false; error: string; code?: string | number; provider: string };

export interface SmsProvider {
  /** Strojový název providera (do logů / SmsResult.provider). */
  readonly name: string;
  /** true, pokud má provider vyplněné přihlašovací údaje a umí reálně odeslat. */
  readonly configured: boolean;
  /**
   * Odešle SMS. `to` musí být už normalizované mezinárodní číslo bez '+'
   * (viz normalizePhoneForSms). Nikdy nevyhazuje — chybu vrací v SmsResult.
   */
  send(to: string, text: string): Promise<SmsResult>;
}
