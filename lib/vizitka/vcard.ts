// Single source of truth pro vCard Bartoloměje Roty.
// Používá:
// - app/vizitka/bartolomej.vcf/route.ts (download endpoint, attachment header)
// - app/vizitka/page.tsx (kóduje do QR pro skenování z telefonu = automatický „Add Contact")
//
// Pravidla vCard 3.0:
// - Konec řádků MUSÍ být CRLF (\r\n) — iPhone Contacts jinak pole zahodí.
// - UTF-8 BOM na začátku pomáhá Outlook 2016 a starším správně rozpoznat diakritiku.
// - Speciální znaky (čárka, středník, backslash) v hodnotách se escapují backslash;
//   naše data je nemají, takže escape není potřeba.

const BOM = '﻿';
const CRLF = '\r\n';

const VCARD_LINES = [
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
  // Doplnit až bude k dispozici portrétová fotka určená pro vCard
  // (ideálně 400×400 JPEG, < 30 KB — větší se nevejde do QR kódu).
  'REV:2026-04-24T00:00:00Z',
  'END:VCARD',
];

/** Plný vCard payload včetně BOM (pro download endpoint). */
export const VCARD_BODY_WITH_BOM = BOM + VCARD_LINES.join(CRLF) + CRLF;

/** vCard bez BOM (pro QR kód — BOM by zbytečně zabíral data). */
export const VCARD_BODY_FOR_QR = VCARD_LINES.join(CRLF) + CRLF;
