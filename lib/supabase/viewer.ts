import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from './server';
import type { UserRole } from '@/lib/types/database';

export const PREVIEW_COOKIE = 'arbiq_preview';

export const PREVIEW_USER = {
  id: '00000000-0000-0000-0000-000000001000',
  email: 'preview@arbiq.cz',
} as const;

export const PREVIEW_PROFILE = {
  id: PREVIEW_USER.id,
  full_name: 'Sherlock Holmes (demo)',
  email: PREVIEW_USER.email,
  role: 'admin' as UserRole,
  avatar_url: null,
  email_notifications_enabled: true,
  is_active: true,
};

export async function isPreviewMode(): Promise<boolean> {
  const c = await cookies();
  return c.get(PREVIEW_COOKIE)?.value === '1';
}

export type Viewer = {
  id: string;
  email: string;
  isPreview: boolean;
};

/**
 * Returns the current viewer (real Supabase user or preview placeholder).
 * Returns null if neither — caller should redirect to login.
 *
 * In preview mode all data queries return empty/fail-safe results because
 * Supabase queries against the preview UUID find nothing — pages render
 * empty-state UI which is good enough for a visual walkthrough.
 */
export async function getViewer(): Promise<Viewer | null> {
  if (await isPreviewMode()) {
    return { id: PREVIEW_USER.id, email: PREVIEW_USER.email, isPreview: true };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { id: user.id, email: user.email ?? '', isPreview: false };
}

/** Convenience: redirect to login if no viewer. */
export async function requireViewer(): Promise<Viewer> {
  const v = await getViewer();
  if (!v) redirect('/portal/login');
  return v;
}
