import 'server-only';

import { createHash, randomBytes } from 'node:crypto';
import type { SmsProvider, SmsResult } from './provider';

/**
 * SMS Brána — SMSConnect HTTP API (https://www.smsbrana.cz/).
 * Endpoint: https://api.smsbrana.cz/smsconnect/http.php
 *
 * Zabezpečená autentizace (doporučená SMS Bránou): místo posílání hesla se
 * posílá `auth = md5(password + time + salt)`, kde `time` je aktuální čas ve
 * formátu YYYYMMDDThhmmss a `salt` je náhodný unikátní řetězec. Server si
 * stejný hash spočítá z času, který jsme poslali, takže nezáleží na časové zóně,
 * jen na rozumné aktuálnosti (ochrana proti replay).
 *
 * Heslo/login se NIKDY nedostane do logů ani do gitu — žijí jen v env
 * (SMSBRANA_LOGIN, SMSBRANA_PASSWORD, volitelně SMSBRANA_SENDER_ID).
 */

const ENDPOINT = 'https://api.smsbrana.cz/smsconnect/http.php';

/** Aktuální čas ve formátu, který SMSConnect očekává: YYYYMMDDThhmmss. */
export function smsBranaTime(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}` +
    `T${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
  );
}

/** Secure auth dle SMSConnect: md5(password + time + salt), hex lowercase. */
export function smsBranaAuth(password: string, time: string, salt: string): string {
  return createHash('md5').update(`${password}${time}${salt}`).digest('hex');
}

/** Mapa chybových kódů `err` z odpovědi SMS Brány. */
export const SMSBRANA_ERR: Record<string, string> = {
  '0': 'OK',
  '1': 'neznámá chyba',
  '2': 'neplatný login',
  '3': 'neplatný hash nebo čas (autorizace)',
  '4': 'nepovolená IP adresa (zkontroluj nastavení SMSConnect)',
  '5': 'neplatný název akce',
  '6': 'salt už byla dnes jednou použita',
  '7': 'neplatná salt',
  '8': 'databázová chyba',
  '9': 'nedostatečný kredit',
  '10': 'neplatné číslo příjemce',
  '11': 'prázdný text zprávy',
  '12': 'text zprávy je delší než povolených 459 znaků',
};

function xmlTag(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}>\\s*([\\s\\S]*?)\\s*</${tag}>`, 'i'));
  return m ? m[1].trim() : null;
}

/** Naparsuje XML odpověď SMS Brány na SmsResult. */
export function parseSmsBranaResponse(xml: string): SmsResult {
  const err = xmlTag(xml, 'err') ?? '1';
  const smsId = xmlTag(xml, 'sms_id') ?? xmlTag(xml, 'id') ?? undefined;
  const priceRaw = xmlTag(xml, 'price');
  const creditRaw = xmlTag(xml, 'credit');
  const price = priceRaw != null && priceRaw !== '' ? Number(priceRaw) : undefined;
  const credit = creditRaw != null && creditRaw !== '' ? Number(creditRaw) : undefined;

  if (err === '0') {
    return { ok: true, id: smsId, price, credit, provider: 'smsbrana' };
  }
  return {
    ok: false,
    code: err,
    error: SMSBRANA_ERR[err] ?? `chyba SMS Brána (err=${err})`,
    provider: 'smsbrana',
  };
}

/** Sestaví query parametry pro action=send_sms se secure auth. */
export function buildSmsBranaSendParams(args: {
  login: string;
  password: string;
  number: string;
  message: string;
  time: string;
  salt: string;
  senderId?: string;
}): URLSearchParams {
  const params = new URLSearchParams({
    action: 'send_sms',
    login: args.login,
    time: args.time,
    salt: args.salt,
    auth: smsBranaAuth(args.password, args.time, args.salt),
    number: args.number,
    message: args.message,
  });
  if (args.senderId) params.set('sender_id', args.senderId);
  return params;
}

export type SmsBranaOptions = {
  login: string;
  password: string;
  senderId?: string;
  endpoint?: string;
  /** Injektovatelné pro testy. */
  fetchImpl?: typeof fetch;
  now?: () => Date;
  saltGen?: () => string;
};

export class SmsBranaProvider implements SmsProvider {
  readonly name = 'smsbrana';
  private readonly login: string;
  private readonly password: string;
  private readonly senderId?: string;
  private readonly endpoint: string;
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => Date;
  private readonly saltGen: () => string;

  constructor(opts: SmsBranaOptions) {
    this.login = opts.login;
    this.password = opts.password;
    this.senderId = opts.senderId;
    this.endpoint = opts.endpoint ?? ENDPOINT;
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.now = opts.now ?? (() => new Date());
    this.saltGen = opts.saltGen ?? (() => randomBytes(16).toString('hex'));
  }

  get configured(): boolean {
    return Boolean(this.login && this.password);
  }

  async send(to: string, text: string): Promise<SmsResult> {
    if (!this.configured) {
      return { ok: false, error: 'SMS Brána není nakonfigurovaná.', provider: this.name };
    }
    const time = smsBranaTime(this.now());
    const salt = this.saltGen();
    const params = buildSmsBranaSendParams({
      login: this.login,
      password: this.password,
      number: to,
      message: text,
      time,
      salt,
      senderId: this.senderId,
    });

    let xml: string;
    try {
      const res = await this.fetchImpl(`${this.endpoint}?${params.toString()}`, { method: 'GET' });
      if (!res.ok) {
        return { ok: false, error: `HTTP ${res.status} od SMS Brány.`, code: res.status, provider: this.name };
      }
      xml = await res.text();
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Síťová chyba při volání SMS Brány.',
        provider: this.name,
      };
    }
    return parseSmsBranaResponse(xml);
  }
}
