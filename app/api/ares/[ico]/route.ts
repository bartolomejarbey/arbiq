import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Volné API ARES (Ministerstvo financí ČR):
// https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/{ico}
// Žádný klíč, ale rate-limit existuje — proto gateujeme jen pro přihlášené.

type AresSidlo = {
  nazevUlice?: string | null;
  cisloDomovni?: number | string | null;
  cisloOrientacni?: number | string | null;
  cisloOrientacniPismeno?: string | null;
  nazevObce?: string | null;
  nazevCastiObce?: string | null;
  psc?: number | string | null;
  textovaAdresa?: string | null;
};

type AresResponse = {
  ico?: string;
  obchodniJmeno?: string;
  dic?: string | null;
  sidlo?: AresSidlo;
  pravniForma?: { nazev?: string } | null;
  datumVzniku?: string;
};

function composeStreet(s?: AresSidlo | null): string | null {
  if (!s) return null;
  const ulice = s.nazevUlice ?? s.nazevCastiObce ?? '';
  const cd = s.cisloDomovni != null ? String(s.cisloDomovni) : '';
  const co = s.cisloOrientacni != null ? String(s.cisloOrientacni) : '';
  const pismeno = s.cisloOrientacniPismeno ?? '';
  const num = co ? `${cd}/${co}${pismeno}` : cd;
  const joined = `${ulice} ${num}`.trim();
  return joined.length > 0 ? joined : (s.textovaAdresa ?? null);
}

function composeCity(s?: AresSidlo | null): string | null {
  if (!s) return null;
  const psc = s.psc != null ? String(s.psc).replace(/(\d{3})(\d{2})/, '$1 $2') : '';
  const obec = s.nazevObce ?? '';
  return `${psc} ${obec}`.trim() || null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ico: string }> },
): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { ico: rawIco } = await params;
  const ico = rawIco.replace(/\D/g, '').padStart(8, '0');
  if (!/^\d{8}$/.test(ico)) {
    return NextResponse.json({ error: 'IČO musí mít 8 číslic.' }, { status: 400 });
  }

  try {
    const r = await fetch(
      `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`,
      { cache: 'no-store', headers: { accept: 'application/json' } },
    );
    if (r.status === 404) return NextResponse.json({ error: 'Firma s tímto IČO neexistuje.' }, { status: 404 });
    if (!r.ok) return NextResponse.json({ error: `ARES nedostupné (${r.status}).` }, { status: 502 });
    const data = (await r.json()) as AresResponse;

    return NextResponse.json({
      ico: data.ico ?? ico,
      name: data.obchodniJmeno ?? null,
      dic: data.dic ?? null,
      vat_payer: !!data.dic,
      street: composeStreet(data.sidlo),
      city: composeCity(data.sidlo),
      legal_form: data.pravniForma?.nazev ?? null,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'ARES fetch failed' }, { status: 502 });
  }
}
