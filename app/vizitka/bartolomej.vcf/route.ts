// vCard 3.0 endpoint pro digitální vizitku Bartoloměje Roty.
// URL: /vizitka/bartolomej.vcf — odkazováno z app/vizitka/page.tsx jako <a href download>.
//
// Pravidla vCard 3.0:
// - Konec řádků MUSÍ být CRLF (\r\n), jinak iPhone Contacts pole zahodí.
// - UTF-8 BOM na začátku zajistí správné renderování diakritiky ve starších Outlook verzích.
// - Speciální znaky v hodnotách (čárka, středník, backslash) se escapují backslash; v našich
//   datech čárky/středníky nemáme ani v adrese strukturované přes ;, takže escape není potřeba.

export const dynamic = 'force-static';
export const runtime = 'nodejs';

const BOM = '﻿';
const CRLF = '\r\n';

const lines = [
  'BEGIN:VCARD',
  'VERSION:3.0',
  'FN:Bartoloměj Rota',
  'N:Rota;Bartoloměj;;;',
  'ORG:ARBIQ',
  'TITLE:Zakladatel',
  'TEL;TYPE=CELL,VOICE:+420725932729',
  'TEL;TYPE=CELL;X-ABLabel=WhatsApp:+420725893968',
  'EMAIL;TYPE=INTERNET,WORK:bartolomej@arbiq.cz',
  'URL:https://arbiq.cz',
  'ADR;TYPE=WORK:;;Školská 689/20;Praha 1;;110 00;Česká republika',
  'NOTE:ARBIQ — detektivní agentura pro digitální business. Web. Marketing. Aplikace na míru.',
  // PHOTO;ENCODING=BASE64;TYPE=JPEG:<base64-encoded-jpeg>
  // Doplnit až bude k dispozici portrétová fotka určená pro vCard (ideálně 400×400 JPEG, < 30 KB).
  'REV:2026-04-24T00:00:00Z',
  'END:VCARD',
];

const VCARD_BODY = BOM + lines.join(CRLF) + CRLF;

export function GET() {
  return new Response(VCARD_BODY, {
    status: 200,
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': 'attachment; filename="bartolomej-rota.vcf"',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
