import 'server-only';

import crypto from 'node:crypto';
import { google, type calendar_v3 } from 'googleapis';

import { createAdminClient } from '@/lib/supabase/admin';
import type { Database } from '@/lib/types/database';
import { decryptToken } from './encryption';
import { createOAuth2Client } from './oauth';
import type { EventInsert, EventRow, GoogleEvent } from './types';

type Json = Database['public']['Tables']['events']['Row']['conference_data'];

export function toGooglePayload(
  event: EventRow,
  opts: { withMeet: boolean },
): GoogleEvent {
  const attendees = Array.isArray(event.attendees)
    ? (event.attendees as Array<{ email: string }>)
    : [];

  const payload: GoogleEvent = {
    summary: event.title,
    description: event.description ?? undefined,
    location: event.location ?? undefined,
    start: event.all_day
      ? { date: event.start_at.slice(0, 10) }
      : { dateTime: event.start_at, timeZone: event.timezone },
    end: event.all_day
      ? { date: event.end_at.slice(0, 10) }
      : { dateTime: event.end_at, timeZone: event.timezone },
    attendees: attendees.length > 0 ? attendees.map(a => ({ email: a.email })) : undefined,
    extendedProperties: {
      private: {
        arbiq_event_id: event.id,
        arbiq_owner_id: event.owner_id,
        ...(event.lead_id ? { arbiq_lead_id: event.lead_id } : {}),
        ...(event.client_id ? { arbiq_client_id: event.client_id } : {}),
        ...(event.project_id ? { arbiq_project_id: event.project_id } : {}),
        arbiq_visibility: event.visibility,
      },
    },
  };

  if (opts.withMeet) {
    payload.conferenceData = {
      createRequest: {
        requestId: crypto.randomUUID(),
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    };
  }

  return payload;
}

export function fromGooglePayload(g: GoogleEvent, ownerId: string): EventInsert {
  const allDay = !!g.start?.date;
  const startAt = allDay
    ? `${g.start!.date}T00:00:00Z`
    : new Date(g.start!.dateTime!).toISOString();
  const endAt = allDay
    ? `${g.end!.date}T00:00:00Z`
    : new Date(g.end!.dateTime!).toISOString();

  const ext = (g.extendedProperties?.private ?? {}) as Record<string, string | undefined>;
  const visibility = ext['arbiq_visibility'] === 'shared' ? 'shared' : 'private';

  return {
    owner_id: ownerId,
    google_event_id: g.id ?? null,
    google_calendar_id: 'primary',
    etag: g.etag ?? null,
    title: g.summary ?? '(bez názvu)',
    description: g.description ?? null,
    location: g.location ?? null,
    start_at: startAt,
    end_at: endAt,
    all_day: allDay,
    timezone: g.start?.timeZone ?? 'Europe/Prague',
    visibility,
    attendees: (g.attendees ?? []).map(a => ({
      email: a.email!,
      responseStatus: a.responseStatus ?? 'needsAction',
      optional: a.optional ?? false,
    })),
    meet_link: g.hangoutLink ?? null,
    conference_data: (g.conferenceData ?? null) as Json,
    lead_id: ext['arbiq_lead_id'] ?? null,
    client_id: ext['arbiq_client_id'] ?? null,
    project_id: ext['arbiq_project_id'] ?? null,
    sync_status: 'synced',
    last_synced_at: new Date().toISOString(),
  };
}

/**
 * Vrátí Google Calendar API client autentikovaný za daného usera.
 * Načte connection, dešifruje refresh_token, vrátí oauth2 client + calendar.
 */
export async function googleCalendarFor(userId: string): Promise<{
  calendar: calendar_v3.Calendar;
  email: string;
  calendarId: string;
}> {
  const admin = createAdminClient();
  const { data: conn, error } = await admin
    .from('google_oauth_connections')
    .select('encrypted_refresh_token, google_user_email, calendar_id, status')
    .eq('user_id', userId)
    .single();

  if (error || !conn) throw new Error(`No Google connection for user ${userId}`);
  if (conn.status !== 'connected') throw new Error(`Google connection ${conn.status}`);

  const refreshToken = await decryptToken(conn.encrypted_refresh_token);
  const oauth2 = createOAuth2Client();
  oauth2.setCredentials({ refresh_token: refreshToken });

  const calendar = google.calendar({ version: 'v3', auth: oauth2 });
  return { calendar, email: conn.google_user_email, calendarId: conn.calendar_id };
}
