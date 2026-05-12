import 'server-only';

import crypto from 'node:crypto';
import { subDays } from 'date-fns';

import { createAdminClient } from '@/lib/supabase/admin';
import { googleCalendarFor, toGooglePayload, fromGooglePayload } from '@/lib/google/calendar';
import { signChannelToken } from '@/lib/google/webhook';
import type { EventRow, GoogleEvent } from '@/lib/google/types';

const WATCH_TTL_DAYS = 7;

type LogEntry = {
  user_id: string;
  event_id: string | null;
  direction: 'outbound' | 'inbound';
  action: 'insert' | 'update' | 'delete' | 'watch_renew' | 'full_resync';
  status: 'ok' | 'error' | 'retry';
  error?: string | null;
  request_payload?: unknown;
  response_payload?: unknown;
};

export async function logSync(entry: LogEntry): Promise<void> {
  const admin = createAdminClient();
  await admin.from('event_sync_log').insert({
    user_id: entry.user_id,
    event_id: entry.event_id,
    direction: entry.direction,
    action: entry.action,
    status: entry.status,
    error: entry.error ?? null,
    request_payload: (entry.request_payload ?? null) as never,
    response_payload: (entry.response_payload ?? null) as never,
  });
}

/**
 * Načte všechny aktivní obchodník + admin profily (kromě ownera) a vrátí
 * jejich emaily jako attendees. Použito při výsledné expanzi `shared` eventů.
 */
async function buildSharedAttendees(
  ownerId: string,
  manualAttendees: Array<{ email: string }>,
): Promise<Array<{ email: string }>> {
  const admin = createAdminClient();
  const { data: team } = await admin
    .from('profiles')
    .select('email')
    .in('role', ['obchodnik', 'admin'])
    .eq('is_active', true)
    .neq('id', ownerId);

  const teamEmails = (team ?? []).map(t => ({ email: t.email }));
  const seen = new Set<string>();
  const result: Array<{ email: string }> = [];
  for (const a of [...teamEmails, ...manualAttendees]) {
    const lower = a.email.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      result.push(a);
    }
  }
  return result;
}

async function applySharedExpansion(event: EventRow): Promise<EventRow> {
  if (event.visibility !== 'shared') return event;
  const expanded = await buildSharedAttendees(
    event.owner_id,
    Array.isArray(event.attendees) ? (event.attendees as Array<{ email: string }>) : [],
  );
  return { ...event, attendees: expanded as never };
}

// ============================================================================
// Outbound
// ============================================================================

export async function pushEventInsert(
  event: EventRow,
  opts: { withMeet: boolean },
): Promise<boolean> {
  const admin = createAdminClient();
  try {
    const expanded = await applySharedExpansion(event);
    const { calendar, calendarId } = await googleCalendarFor(event.owner_id);
    const payload = toGooglePayload(expanded, { withMeet: opts.withMeet });
    const resp = await calendar.events.insert({
      calendarId,
      sendUpdates: 'none',
      conferenceDataVersion: opts.withMeet ? 1 : 0,
      requestBody: payload,
    });

    await admin
      .from('events')
      .update({
        google_event_id: resp.data.id,
        etag: resp.data.etag,
        meet_link: resp.data.hangoutLink ?? null,
        conference_data: (resp.data.conferenceData ?? null) as never,
        sync_status: 'synced',
        sync_error: null,
        last_synced_at: new Date().toISOString(),
      })
      .eq('id', event.id);

    await logSync({
      user_id: event.owner_id,
      event_id: event.id,
      direction: 'outbound',
      action: 'insert',
      status: 'ok',
      response_payload: { google_event_id: resp.data.id },
    });
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await admin
      .from('events')
      .update({ sync_status: 'error', sync_error: msg.slice(0, 500) })
      .eq('id', event.id);
    await logSync({
      user_id: event.owner_id,
      event_id: event.id,
      direction: 'outbound',
      action: 'insert',
      status: 'error',
      error: msg,
    });
    return false;
  }
}

export async function pushEventUpdate(event: EventRow): Promise<boolean> {
  if (!event.google_event_id) {
    return pushEventInsert(event, { withMeet: !!event.meet_link });
  }
  const admin = createAdminClient();
  try {
    const expanded = await applySharedExpansion(event);
    const { calendar, calendarId } = await googleCalendarFor(event.owner_id);
    const payload = toGooglePayload(expanded, { withMeet: false });
    const resp = await calendar.events.update({
      calendarId,
      eventId: event.google_event_id,
      sendUpdates: 'none',
      requestBody: payload,
    });

    await admin
      .from('events')
      .update({
        etag: resp.data.etag,
        sync_status: 'synced',
        sync_error: null,
        last_synced_at: new Date().toISOString(),
      })
      .eq('id', event.id);

    await logSync({
      user_id: event.owner_id,
      event_id: event.id,
      direction: 'outbound',
      action: 'update',
      status: 'ok',
    });
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await admin
      .from('events')
      .update({ sync_status: 'error', sync_error: msg.slice(0, 500) })
      .eq('id', event.id);
    await logSync({
      user_id: event.owner_id,
      event_id: event.id,
      direction: 'outbound',
      action: 'update',
      status: 'error',
      error: msg,
    });
    return false;
  }
}

export async function pushEventDelete(event: EventRow): Promise<boolean> {
  const admin = createAdminClient();
  if (!event.google_event_id) {
    await admin
      .from('events')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', event.id);
    return true;
  }
  try {
    const { calendar, calendarId } = await googleCalendarFor(event.owner_id);
    await calendar.events.delete({
      calendarId,
      eventId: event.google_event_id,
      sendUpdates: 'none',
    });

    await admin
      .from('events')
      .update({
        deleted_at: new Date().toISOString(),
        sync_status: 'synced',
        last_synced_at: new Date().toISOString(),
      })
      .eq('id', event.id);

    await logSync({
      user_id: event.owner_id,
      event_id: event.id,
      direction: 'outbound',
      action: 'delete',
      status: 'ok',
    });
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('410') || msg.includes('Resource has been deleted')) {
      await admin
        .from('events')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', event.id);
      return true;
    }
    await admin
      .from('events')
      .update({ sync_status: 'error', sync_error: msg.slice(0, 500) })
      .eq('id', event.id);
    await logSync({
      user_id: event.owner_id,
      event_id: event.id,
      direction: 'outbound',
      action: 'delete',
      status: 'error',
      error: msg,
    });
    return false;
  }
}

// ============================================================================
// Inbound
// ============================================================================

export async function upsertFromGoogle(
  userId: string,
  g: GoogleEvent,
): Promise<'inserted' | 'updated' | 'deleted' | 'noop' | 'conflict'> {
  if (!g.id) return 'noop';
  const admin = createAdminClient();

  if (g.status === 'cancelled') {
    const { data: existing } = await admin
      .from('events')
      .select('id')
      .eq('owner_id', userId)
      .eq('google_event_id', g.id)
      .maybeSingle();
    if (existing) {
      await admin
        .from('events')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', existing.id);
      await logSync({
        user_id: userId,
        event_id: existing.id,
        direction: 'inbound',
        action: 'delete',
        status: 'ok',
      });
      return 'deleted';
    }
    return 'noop';
  }

  const { data: existing } = await admin
    .from('events')
    .select('id, etag, sync_status, updated_at')
    .eq('owner_id', userId)
    .eq('google_event_id', g.id)
    .maybeSingle();

  const incoming = fromGooglePayload(g, userId);

  if (existing) {
    if (existing.etag === g.etag) return 'noop';

    if (existing.sync_status === 'pending') {
      const localUpdated = new Date(existing.updated_at);
      const googleUpdated = new Date(g.updated ?? 0);
      if (localUpdated > googleUpdated) {
        return 'conflict';
      }
    }

    await admin
      .from('events')
      .update({
        title: incoming.title,
        description: incoming.description,
        location: incoming.location,
        start_at: incoming.start_at,
        end_at: incoming.end_at,
        all_day: incoming.all_day,
        timezone: incoming.timezone,
        attendees: incoming.attendees as never,
        meet_link: incoming.meet_link,
        conference_data: incoming.conference_data as never,
        visibility: incoming.visibility,
        etag: g.etag,
        sync_status: 'synced',
        sync_error: null,
        last_synced_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    await logSync({
      user_id: userId,
      event_id: existing.id,
      direction: 'inbound',
      action: 'update',
      status: 'ok',
    });
    return 'updated';
  }

  const { data: inserted } = await admin
    .from('events')
    .insert(incoming as never)
    .select('id')
    .single();
  await logSync({
    user_id: userId,
    event_id: inserted?.id ?? null,
    direction: 'inbound',
    action: 'insert',
    status: 'ok',
  });
  return 'inserted';
}

export async function pullChanges(
  userId: string,
): Promise<{ pulled: number; resetSyncToken: boolean }> {
  const admin = createAdminClient();
  const { data: conn } = await admin
    .from('google_oauth_connections')
    .select('sync_token, calendar_id')
    .eq('user_id', userId)
    .single();
  if (!conn) throw new Error(`No connection for ${userId}`);

  const { calendar, calendarId } = await googleCalendarFor(userId);
  let pageToken: string | undefined;
  let nextSyncToken: string | null | undefined;
  let pulled = 0;

  try {
    do {
      const resp = await calendar.events.list({
        calendarId,
        syncToken: conn.sync_token ?? undefined,
        pageToken,
        showDeleted: true,
        singleEvents: true,
        maxResults: 250,
      });
      for (const ev of resp.data.items ?? []) {
        await upsertFromGoogle(userId, ev);
        pulled++;
      }
      pageToken = resp.data.nextPageToken ?? undefined;
      nextSyncToken = resp.data.nextSyncToken ?? undefined;
    } while (pageToken);

    await admin
      .from('google_oauth_connections')
      .update({
        sync_token: nextSyncToken ?? conn.sync_token,
        last_sync_at: new Date().toISOString(),
        last_error: null,
      })
      .eq('user_id', userId);

    return { pulled, resetSyncToken: false };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('410') || msg.toLowerCase().includes('sync token')) {
      await admin
        .from('google_oauth_connections')
        .update({ sync_token: null })
        .eq('user_id', userId);
      return { pulled, resetSyncToken: true };
    }
    await admin
      .from('google_oauth_connections')
      .update({
        status: msg.includes('invalid_grant') ? 'revoked' : 'error',
        last_error: msg.slice(0, 500),
      })
      .eq('user_id', userId);
    throw e;
  }
}

export async function initialSync(userId: string): Promise<number> {
  const admin = createAdminClient();
  const { calendar, calendarId } = await googleCalendarFor(userId);

  await admin
    .from('google_oauth_connections')
    .update({ sync_token: null })
    .eq('user_id', userId);

  let pageToken: string | undefined;
  let nextSyncToken: string | null | undefined;
  let pulled = 0;
  const timeMin = subDays(new Date(), 30).toISOString();

  do {
    const resp = await calendar.events.list({
      calendarId,
      timeMin,
      pageToken,
      singleEvents: true,
      maxResults: 250,
    });
    for (const ev of resp.data.items ?? []) {
      await upsertFromGoogle(userId, ev);
      pulled++;
    }
    pageToken = resp.data.nextPageToken ?? undefined;
    nextSyncToken = resp.data.nextSyncToken ?? undefined;
  } while (pageToken);

  await admin
    .from('google_oauth_connections')
    .update({
      sync_token: nextSyncToken,
      last_sync_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  await logSync({
    user_id: userId,
    event_id: null,
    direction: 'inbound',
    action: 'full_resync',
    status: 'ok',
    response_payload: { pulled },
  });

  return pulled;
}

export async function startWatch(userId: string): Promise<void> {
  const admin = createAdminClient();
  const { calendar, calendarId } = await googleCalendarFor(userId);
  const channelId = crypto.randomUUID();
  const channelToken = signChannelToken(userId);
  const expiration = Date.now() + WATCH_TTL_DAYS * 86400 * 1000;

  const resp = await calendar.events.watch({
    calendarId,
    requestBody: {
      id: channelId,
      type: 'web_hook',
      address: `${process.env.APP_URL}/api/google/calendar/webhook`,
      token: channelToken,
      expiration: expiration.toString(),
    },
  });

  await admin
    .from('google_oauth_connections')
    .update({
      watch_channel_id: channelId,
      watch_resource_id: resp.data.resourceId,
      watch_expires_at: new Date(parseInt(resp.data.expiration!)).toISOString(),
    })
    .eq('user_id', userId);

  await logSync({
    user_id: userId,
    event_id: null,
    direction: 'inbound',
    action: 'watch_renew',
    status: 'ok',
  });
}

export async function renewWatch(userId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: conn } = await admin
    .from('google_oauth_connections')
    .select('watch_channel_id, watch_resource_id')
    .eq('user_id', userId)
    .single();

  if (conn?.watch_channel_id && conn?.watch_resource_id) {
    try {
      const { calendar } = await googleCalendarFor(userId);
      await calendar.channels.stop({
        requestBody: {
          id: conn.watch_channel_id,
          resourceId: conn.watch_resource_id,
        },
      });
    } catch {
      // best-effort
    }
  }
  await startWatch(userId);
}
