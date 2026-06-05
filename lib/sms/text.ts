/**
 * Převede české diakritické znaky na ASCII. SMS se standardně posílají bez
 * diakritiky (GSM-7) — jinak by se zpráva kódovala v UCS-2 a vešlo by se jen
 * 70 znaků na díl (místo 160), což zbytečně zdražuje. Dispatch používá tuto
 * funkci pro výchozí text SMS.
 */
const MAP: Record<string, string> = {
  á: 'a', č: 'c', ď: 'd', é: 'e', ě: 'e', í: 'i', ň: 'n', ó: 'o', ř: 'r',
  š: 's', ť: 't', ú: 'u', ů: 'u', ý: 'y', ž: 'z',
  Á: 'A', Č: 'C', Ď: 'D', É: 'E', Ě: 'E', Í: 'I', Ň: 'N', Ó: 'O', Ř: 'R',
  Š: 'S', Ť: 'T', Ú: 'U', Ů: 'U', Ý: 'Y', Ž: 'Z',
};

export function asciiFoldCs(input: string): string {
  let out = '';
  for (const ch of input) out += MAP[ch] ?? ch;
  // Fallback pro ostatní diakritiku (např. ö, ü) přes Unicode dekompozici
  // a odstranění kombinujících znaků (U+0300–U+036F).
  return out.normalize('NFKD').replace(/[̀-ͯ]/g, '');
}
