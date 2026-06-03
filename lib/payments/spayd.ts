import 'server-only';
import QRCode from 'qrcode';

/**
 * SPAYD — Short Payment Descriptor (česká QR platba).
 * Specifikace: https://qr-platba.cz/pro-vyvojare/specifikace-formatu/
 *
 * Příklad výstupu:
 *   SPD*1.0*ACC:CZ4430300000003140419018*AM:9250.00*CC:CZK*MSG:Faktura 162*X-VS:162
 */

export type SpaydInput = {
  /** IBAN bez mezer. Pokud zadáš s mezerami, normalizujeme. */
  iban: string;
  /** Volitelný BIC. */
  bic?: string;
  /** Částka v Kč (nebo měnové jednotce currency). Zaokrouhlujeme na 2 desetinná místa. */
  amount: number;
  /** Měna ISO 4217, defaultně CZK. */
  currency?: string;
  /** Variabilní symbol (typicky číslo faktury, jen číslice, max 10 znaků). */
  variableSymbol?: string;
  /** Konstantní symbol. */
  constantSymbol?: string;
  /** Specifický symbol. */
  specificSymbol?: string;
  /** Zpráva pro příjemce (max ~60 znaků). */
  message?: string;
  // POZOR: SPAYD pole `DT` (datum splatnosti) ZÁMĚRNĚ nepoužíváme.
  // Některé mobilní banky ho interpretují jako „naplánovat platbu na
  // tento den" a klient pak platí až poslední den splatnosti místo
  // hned po naskenování. Necháme bez DT — banka pošle ihned.
};

const ACCENT_MAP: Record<string, string> = {
  á: 'a', č: 'c', ď: 'd', é: 'e', ě: 'e', í: 'i', ň: 'n', ó: 'o',
  ř: 'r', š: 's', ť: 't', ú: 'u', ů: 'u', ý: 'y', ž: 'z',
  Á: 'A', Č: 'C', Ď: 'D', É: 'E', Ě: 'E', Í: 'I', Ň: 'N', Ó: 'O',
  Ř: 'R', Š: 'S', Ť: 'T', Ú: 'U', Ů: 'U', Ý: 'Y', Ž: 'Z',
};

/** SPAYD nedovoluje hvězdičky/dvojtečky v hodnotách — escapujeme + odstraňujeme diakritiku. */
function spaydSafe(value: string): string {
  return value
    .split('')
    .map((c) => ACCENT_MAP[c] ?? c)
    .join('')
    .replace(/[*:]/g, ' ')
    .trim();
}

export function buildSpaydPayload(input: SpaydInput): string {
  const iban = input.iban.replace(/\s+/g, '').toUpperCase();
  const amount = input.amount.toFixed(2);
  const currency = (input.currency ?? 'CZK').toUpperCase();

  const parts: string[] = ['SPD', '1.0', `ACC:${iban}${input.bic ? '+' + input.bic : ''}`];
  parts.push(`AM:${amount}`);
  parts.push(`CC:${currency}`);
  if (input.variableSymbol) parts.push(`X-VS:${input.variableSymbol.replace(/\D/g, '').slice(0, 10)}`);
  if (input.constantSymbol) parts.push(`X-KS:${input.constantSymbol.replace(/\D/g, '').slice(0, 10)}`);
  if (input.specificSymbol) parts.push(`X-SS:${input.specificSymbol.replace(/\D/g, '').slice(0, 10)}`);
  if (input.message) parts.push(`MSG:${spaydSafe(input.message).slice(0, 60)}`);
  // `DT:` (datum splatnosti) záměrně vynecháno — viz komentář v SpaydInput.

  return parts.join('*');
}

/** Vrací data URL (PNG) QR kódu — vhodné pro @react-pdf/renderer <Image src>. */
export async function buildSpaydQrDataUrl(input: SpaydInput): Promise<string> {
  return spaydQrDataUrlFromPayload(buildSpaydPayload(input));
}

/** Stejné jako buildSpaydQrDataUrl, ale z hotového SPAYD payloadu (uloženého na faktuře). */
export async function spaydQrDataUrlFromPayload(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 360,
    // Pevné bílé pozadí — průhledné (#FFFFFF00) láme některé bankovní QR čtečky.
    color: { dark: '#241B14', light: '#FFFFFF' },
  });
}
