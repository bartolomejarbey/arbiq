import { createClient } from '@/lib/supabase/server';
import { untyped } from '@/lib/supabase/untyped';

export type Firma = {
  id: string;
  client_id: string;
  nazev: string;
  ico: string | null;
  dic: string | null;
  street: string | null;
  city: string | null;
  zip: string | null;
  country: string | null;
  billing_email: string | null;
  contract_email: string | null;
  representative_name: string | null;
  phone: string | null;
  website_url: string | null;
  is_primary: boolean;
  archived_at: string | null;
};

const COLS =
  'id, client_id, nazev, ico, dic, street, city, zip, country, billing_email, contract_email, representative_name, phone, website_url, is_primary, archived_at';

/** Aktivní (nearchivované) firmy daného klienta-osoby, primární první. */
export async function getFirmyForClient(clientId: string): Promise<Firma[]> {
  const supabase = await createClient();
  const { data } = await untyped(supabase)
    .from('firmy')
    .select(COLS)
    .eq('client_id', clientId)
    .is('archived_at', null)
    .order('is_primary', { ascending: false })
    .order('nazev', { ascending: true });
  return (data ?? []) as Firma[];
}

/** Jedna firma podle id (RLS rozhodne o přístupu). */
export async function getFirma(firmaId: string): Promise<Firma | null> {
  const supabase = await createClient();
  const { data } = await untyped(supabase).from('firmy').select(COLS).eq('id', firmaId).maybeSingle();
  return (data as Firma | null) ?? null;
}
