// vCard download endpoint pro digitální vizitku Bartoloměje Roty.
// URL: /vizitka/bartolomej.vcf — odkazováno z app/vizitka/page.tsx jako <a href download>.
// Obsah vCardu žije v lib/vizitka/vcard.ts (sdílí ho QR komponenta na vizitce).

import { VCARD_BODY_WITH_BOM } from '@/lib/vizitka/vcard';

export const dynamic = 'force-static';
export const runtime = 'nodejs';

export function GET() {
  return new Response(VCARD_BODY_WITH_BOM, {
    status: 200,
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': 'attachment; filename="bartolomej-rota.vcf"',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
