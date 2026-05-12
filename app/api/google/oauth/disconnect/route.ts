import 'server-only';

import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { requireViewer } from '@/lib/supabase/viewer';
import { createAdminClient } from '@/lib/supabase/admin';
import { decryptToken } from '@/lib/google/encryption';
import { createOAuth2Client } from '@/lib/google/oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const viewer = await requireViewer();
  if (viewer.isPreview) {
    return NextResponse.json({ ok: false, error: 'preview' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: conn } = await admin
    .from('google_oauth_connections')
    .select('encrypted_refresh_token, watch_channel_id, watch_resource_id')
    .eq('user_id', viewer.id)
    .single();

  if (!conn) return NextResponse.json({ ok: true });

  // 1. Stop watch channel (best-effort)
  if (conn.watch_channel_id && conn.watch_resource_id) {
    try {
      const refreshToken = await decryptToken(conn.encrypted_refresh_token);
      const oauth2 = createOAuth2Client();
      oauth2.setCredentials({ refresh_token: refreshToken });
      const calendar = google.calendar({ version: 'v3', auth: oauth2 });
      await calendar.channels.stop({
        requestBody: {
          id: conn.watch_channel_id,
          resourceId: conn.watch_resource_id,
        },
      });
    } catch {
      // ignore — channel může být expired
    }
  }

  // 2. Revoke token u Google (best-effort)
  try {
    const refreshToken = await decryptToken(conn.encrypted_refresh_token);
    await fetch(`https://oauth2.googleapis.com/revoke?token=${refreshToken}`, {
      method: 'POST',
    });
  } catch {
    // ignore
  }

  // 3. Smaž connection (events zůstávají)
  await admin.from('google_oauth_connections').delete().eq('user_id', viewer.id);

  return NextResponse.json({ ok: true });
}
