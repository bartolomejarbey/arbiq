import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyChannelToken } from '@/lib/google/webhook';
import { pullChanges, initialSync } from '@/lib/services/calendar-sync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const channelId = req.headers.get('x-goog-channel-id');
  const channelToken = req.headers.get('x-goog-channel-token');
  const resourceState = req.headers.get('x-goog-resource-state');

  if (!channelId || !channelToken) return new NextResponse(null, { status: 400 });

  // 'sync' = init ping po watch — jen ACK
  if (resourceState === 'sync') return new NextResponse(null, { status: 200 });

  const admin = createAdminClient();
  const { data: conn } = await admin
    .from('google_oauth_connections')
    .select('user_id')
    .eq('watch_channel_id', channelId)
    .single();

  if (!conn) return new NextResponse('channel not found', { status: 404 });

  if (!verifyChannelToken(channelToken, conn.user_id)) {
    return new NextResponse('forbidden', { status: 403 });
  }

  try {
    const result = await pullChanges(conn.user_id);
    if (result.resetSyncToken) {
      await initialSync(conn.user_id);
    }
  } catch (e) {
    console.error('Webhook pull failed', e);
  }

  return new NextResponse(null, { status: 200 });
}
