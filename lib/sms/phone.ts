/**
 * Normalizace telefonního čísla na formát pro SMS Bránu: jen číslice
 * s mezinárodní předvolbou bez '+' (např. "420776123456"). Vrací null,
 * pokud číslo nelze rozumně normalizovat.
 *
 * Pravidla:
 *  - "+420 776 123 456" / "00420776123456" → "420776123456"
 *  - "776 123 456" (9 číslic, CZ bez předvolby) → "420776123456"
 *  - "420776123456" (už s předvolbou) → beze změny
 */
export function normalizePhoneForSms(
  raw: string | null | undefined,
  defaultCc = '420',
): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const international = trimmed.startsWith('+') || trimmed.startsWith('00');
  // Ponech jen číslice.
  const digits = trimmed.replace(/^00/, '').replace(/\D/g, '');
  if (digits.length === 0) return null;

  if (international) {
    return digits.length >= 9 ? digits : null;
  }
  // Tuzemské 9-místné číslo bez předvolby.
  if (digits.length === 9) return `${defaultCc}${digits}`;
  // Už obsahuje předvolbu (11–15 číslic).
  if (digits.length >= 11 && digits.length <= 15) return digits;
  return null;
}
