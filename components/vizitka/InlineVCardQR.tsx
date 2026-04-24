'use client';

import { QRCodeCanvas } from 'qrcode.react';

/**
 * QR kód kódující rovnou vCard text (ne URL).
 * Po naskenování telefonem se zobrazí prompt „Add to Contacts" — žádné stahování,
 * žádný internet potřeba. Funguje offline z displeje druhého telefonu.
 */
export default function InlineVCardQR({ vcard }: { vcard: string }) {
  return (
    <QRCodeCanvas
      value={vcard}
      size={240}
      level="M"
      fgColor="#241B14"
      bgColor="#EDE2CC"
      includeMargin
      imageSettings={{
        src: '/arbiq-logo.png',
        height: 44,
        width: 44,
        excavate: true,
      }}
    />
  );
}
