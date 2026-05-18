import 'server-only';

/**
 * Údaje o dodavateli (Bartoloměj Rota / Arbiq.cz).
 *
 * Pravda žije v public.app_settings.dodavatel — server-only fetcher níže.
 * Pro statické PDF generování (kdyby DB nebyla dostupná) tu necháváme i fallback.
 */
export type Dodavatel = {
  name: string;
  brand: string;
  street: string;
  city: string;
  ico: string;
  dic: string | null;
  vat_payer: boolean;
  email: string;
  phone: string;
  bank_account: string;
  bank_name: string;
  iban: string;
  bic: string;
  website: string;
  place: string;
  legal_form: string;
};

export const DODAVATEL_FALLBACK: Dodavatel = {
  name: 'Bartoloměj Rota',
  brand: 'Arbiq.cz',
  street: 'Běleč 30',
  city: '391 43 Běleč',
  ico: '21875570',
  dic: null,
  vat_payer: false,
  email: 'bartolomej@arbiq.cz',
  phone: '+420 725 932 729',
  bank_account: '3140419018/3030',
  bank_name: 'Air Bank',
  iban: 'CZ44 3030 0000 0031 4041 9018',
  bic: 'AIRACZPP',
  website: 'arbiq.cz',
  place: 'Bělči',
  legal_form: 'Fyzická osoba podnikající dle živnostenského zákona',
};

/**
 * Načte dodavatele z app_settings; když chybí, použije fallback.
 * Volá se ze server actions / route handlers při generování PDF.
 */
export async function getDodavatel(): Promise<Dodavatel> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const admin = createAdminClient();
    const { data } = await admin
      .from('app_settings')
      .select('value')
      .eq('key', 'dodavatel')
      .single();
    const raw = (data as { value: string | null } | null)?.value;
    if (!raw) return DODAVATEL_FALLBACK;
    return { ...DODAVATEL_FALLBACK, ...(JSON.parse(raw) as Partial<Dodavatel>) };
  } catch {
    return DODAVATEL_FALLBACK;
  }
}
