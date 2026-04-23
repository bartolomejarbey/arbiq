'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PREVIEW_COOKIE } from '@/lib/supabase/viewer';

/**
 * V produkci je preview mode přepnut na "demo" — návštěvník bez přihlášení
 * vidí celý portál s vtipnými mock daty (Sherlock Holmes klientela, atd.)
 * jako ukázku co umíme. Žádná reálná data se nezobrazují, mutating actions
 * selžou na RLS protože preview UUID nikde neexistuje v profiles.
 *
 * Pokud chcete preview úplně zakázat v produkci, nastavte env var:
 *   DISABLE_PORTAL_PREVIEW=1
 */
export async function enterPreview() {
  if (process.env.DISABLE_PORTAL_PREVIEW === '1') {
    redirect('/portal/login?error=Demo+m%C3%B3d+je+v+produkci+vypnut%C3%BD.');
  }
  const c = await cookies();
  c.set(PREVIEW_COOKIE, '1', {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 4, // 4 hours
  });
  redirect('/portal/admin/statistiky');
}

export async function exitPreview() {
  const c = await cookies();
  c.delete(PREVIEW_COOKIE);
  redirect('/portal/login');
}
