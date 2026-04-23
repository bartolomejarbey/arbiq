'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PREVIEW_COOKIE } from '@/lib/supabase/viewer';

export async function enterPreview() {
  const c = await cookies();
  c.set(PREVIEW_COOKIE, '1', {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 hours
  });
  redirect('/portal/dashboard');
}

export async function exitPreview() {
  const c = await cookies();
  c.delete(PREVIEW_COOKIE);
  redirect('/portal/login');
}
