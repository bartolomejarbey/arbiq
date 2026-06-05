import type { SmsProvider, SmsResult } from './provider';

/**
 * Fallback provider, když nejsou nastavené žádné SMS klíče (SMSBRANA_*).
 * Nic neodesílá — jen zaloguje a vrátí chybu. Díky němu je notifikační vrstva
 * "připravená na vložení API": kód volá sendSms() bez ohledu na to, zda je
 * provider nakonfigurovaný.
 */
export class NoopSmsProvider implements SmsProvider {
  readonly name = 'noop';
  readonly configured = false;

  async send(to: string, _text: string): Promise<SmsResult> {
    console.warn(
      `[SMS:noop] SMS provider není nakonfigurovaný (chybí SMSBRANA_LOGIN/PASSWORD). ` +
        `SMS na ${to} NEBYLA odeslána.`,
    );
    return { ok: false, error: 'SMS provider není nakonfigurovaný.', provider: this.name };
  }
}
