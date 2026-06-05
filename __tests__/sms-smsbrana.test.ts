import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import {
  smsBranaTime,
  smsBranaAuth,
  buildSmsBranaSendParams,
  parseSmsBranaResponse,
  SmsBranaProvider,
} from '@/lib/sms/smsbrana';
import { normalizePhoneForSms } from '@/lib/sms/phone';
import { asciiFoldCs } from '@/lib/sms/text';
import { NoopSmsProvider } from '@/lib/sms/noop';

const OK_XML = `<?xml version="1.0" encoding="utf-8"?><result><err>0</err><price>1.20</price><credit>98.80</credit><sms_id>abc123</sms_id></result>`;
const CREDIT_XML = `<?xml version="1.0"?><result><err>9</err></result>`;

function fakeFetch(xml: string, opts: { ok?: boolean; status?: number } = {}): {
  impl: typeof fetch;
  calls: string[];
} {
  const calls: string[] = [];
  const impl = (async (url: string | URL | Request) => {
    calls.push(String(url));
    return {
      ok: opts.ok ?? true,
      status: opts.status ?? 200,
      text: async () => xml,
    };
  }) as unknown as typeof fetch;
  return { impl, calls };
}

describe('smsBranaTime', () => {
  it('formátuje YYYYMMDDThhmmss s nulami', () => {
    // měsíc je 0-indexovaný: 5 = červen
    expect(smsBranaTime(new Date(2026, 5, 5, 14, 30, 9))).toBe('20260605T143009');
    expect(smsBranaTime(new Date(2026, 0, 1, 0, 0, 0))).toBe('20260101T000000');
  });
});

describe('smsBranaAuth', () => {
  it('je md5(password + time + salt)', () => {
    const expected = createHash('md5').update('heslo' + '20260605T143009' + 'salt123').digest('hex');
    expect(smsBranaAuth('heslo', '20260605T143009', 'salt123')).toBe(expected);
  });
});

describe('buildSmsBranaSendParams', () => {
  it('obsahuje akci, login, čas, salt, validní auth, číslo a zprávu', () => {
    const p = buildSmsBranaSendParams({
      login: 'barthist_h1',
      password: 'tajne',
      number: '420776123456',
      message: 'Ahoj',
      time: '20260605T143009',
      salt: 'xyz',
      senderId: 'ARBIQ',
    });
    expect(p.get('action')).toBe('send_sms');
    expect(p.get('login')).toBe('barthist_h1');
    expect(p.get('time')).toBe('20260605T143009');
    expect(p.get('salt')).toBe('xyz');
    expect(p.get('number')).toBe('420776123456');
    expect(p.get('message')).toBe('Ahoj');
    expect(p.get('sender_id')).toBe('ARBIQ');
    expect(p.get('auth')).toBe(smsBranaAuth('tajne', '20260605T143009', 'xyz'));
    // heslo se NIKDY neposílá v plaintextu
    expect(p.toString()).not.toContain('tajne');
  });

  it('vynechá sender_id, když není zadaný', () => {
    const p = buildSmsBranaSendParams({
      login: 'l', password: 'p', number: '420776123456', message: 'x', time: 't', salt: 's',
    });
    expect(p.has('sender_id')).toBe(false);
  });
});

describe('parseSmsBranaResponse', () => {
  it('err=0 → ok s id/price/credit', () => {
    const r = parseSmsBranaResponse(OK_XML);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.id).toBe('abc123');
      expect(r.price).toBe(1.2);
      expect(r.credit).toBe(98.8);
      expect(r.provider).toBe('smsbrana');
    }
  });

  it('err=9 → chyba nedostatečný kredit', () => {
    const r = parseSmsBranaResponse(CREDIT_XML);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe('9');
      expect(r.error).toMatch(/kredit/i);
    }
  });

  it('neznámý err kód → fallback hláška', () => {
    const r = parseSmsBranaResponse('<result><err>99</err></result>');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/err=99/);
  });
});

describe('normalizePhoneForSms', () => {
  it('CZ 9-místné bez předvolby → 420…', () => {
    expect(normalizePhoneForSms('776 123 456')).toBe('420776123456');
  });
  it('+420 a 00420 → bez plus', () => {
    expect(normalizePhoneForSms('+420776123456')).toBe('420776123456');
    expect(normalizePhoneForSms('00420 776 123 456')).toBe('420776123456');
  });
  it('už s předvolbou beze změny', () => {
    expect(normalizePhoneForSms('420776123456')).toBe('420776123456');
  });
  it('nevalidní → null', () => {
    expect(normalizePhoneForSms('')).toBeNull();
    expect(normalizePhoneForSms(null)).toBeNull();
    expect(normalizePhoneForSms('123')).toBeNull();
  });
});

describe('asciiFoldCs', () => {
  it('odstraní českou diakritiku', () => {
    expect(asciiFoldCs('Faktura č. 5 je splatná')).toBe('Faktura c. 5 je splatna');
    expect(asciiFoldCs('Příliš žluťoučký kůň')).toBe('Prilis zlutoucky kun');
  });
});

describe('SmsBranaProvider', () => {
  it('odešle a vrátí ok při err=0 a volá správný endpoint s auth', async () => {
    const { impl, calls } = fakeFetch(OK_XML);
    const provider = new SmsBranaProvider({
      login: 'barthist_h1',
      password: 'tajne',
      fetchImpl: impl,
      now: () => new Date(2026, 5, 5, 14, 30, 9),
      saltGen: () => 'fixedsalt',
    });
    const res = await provider.send('420776123456', 'Ahoj');
    expect(res.ok).toBe(true);
    expect(calls).toHaveLength(1);
    const url = calls[0];
    expect(url).toContain('api.smsbrana.cz/smsconnect/http.php');
    expect(url).toContain('action=send_sms');
    expect(url).toContain(`auth=${smsBranaAuth('tajne', '20260605T143009', 'fixedsalt')}`);
    expect(url).not.toContain('tajne');
  });

  it('err=9 → ok false', async () => {
    const { impl } = fakeFetch(CREDIT_XML);
    const provider = new SmsBranaProvider({ login: 'l', password: 'p', fetchImpl: impl });
    const res = await provider.send('420776123456', 'x');
    expect(res.ok).toBe(false);
  });

  it('HTTP chyba → ok false', async () => {
    const { impl } = fakeFetch('', { ok: false, status: 500 });
    const provider = new SmsBranaProvider({ login: 'l', password: 'p', fetchImpl: impl });
    const res = await provider.send('420776123456', 'x');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe(500);
  });

  it('configured je false bez údajů', () => {
    const provider = new SmsBranaProvider({ login: '', password: '' });
    expect(provider.configured).toBe(false);
  });
});

describe('NoopSmsProvider', () => {
  it('nic neodešle a vrátí chybu', async () => {
    const res = await new NoopSmsProvider().send('420776123456', 'x');
    expect(res.ok).toBe(false);
    expect(res.provider).toBe('noop');
  });
});
