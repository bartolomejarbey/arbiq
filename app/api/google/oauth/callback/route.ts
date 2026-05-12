import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  parseStateToken,
  exchangeCodeForTokens,
  fetchUserEmail,
} from '@/lib/google/oauth';
import { encryptToken } from '@/lib/google/encryption';
import { initialSync, startWatch } from '@/lib/services/calendar-sync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const errorParam = searchParams.get('error');

  const settingsUrl = `${process.env.APP_URL}/portal/nastaveni/kalendar`;

  if (errorParam) {
    return NextResponse.redirect(
      `${settingsUrl}?err=${encodeURIComponent(errorParam)}`,
    );
  }
  if (!code || !state) {
    return NextResponse.redirect(`${settingsUrl}?err=missing_params`);
  }

  let userId: string;
  try {
    ({ userId } = parseStateToken(state));
  } catch {
    return NextResponse.redirect(`${settingsUrl}?err=invalid_state`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const email = await fetchUserEmail(tokens.accessToken);
    const encryptedRefresh = await encryptToken(tokens.refreshToken);

    const admin = createAdminClient();
    await admin.from('google_oauth_connections').upsert({
      user_id: userId,
      encrypted_refresh_token: encryptedRefresh,
      access_token: tokens.accessToken,
      access_token_expires_at: tokens.expiresAt.toISOString(),
      google_user_email: email,
      calendar_id: 'primary',
      status: 'connected',
      last_error: null,
    });

    // Initial sync + watch (fire-and-forget; uživatel uvidí výsledek po refreshi)
    initialSync(userId)
      .then(() => startWatch(userId))
      .catch(console.error);

    return NextResponse.redirect(`${settingsUrl}?ok=1`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.redirect(
      `${settingsUrl}?err=${encodeURIComponent(msg.slice(0, 200))}`,
    );
  }
}
