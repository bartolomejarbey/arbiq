import { describe, it, expect } from 'vitest';
import { toGooglePayload, fromGooglePayload } from '@/lib/google/calendar';
import type { EventRow } from '@/lib/google/types';

const base: EventRow = {
  id: 'ev-1',
  created_at: '2026-05-12T10:00:00Z',
  updated_at: '2026-05-12T10:00:00Z',
  owner_id: 'owner-1',
  google_event_id: null,
  google_calendar_id: 'primary',
  etag: null,
  title: 'Schůzka s klientem',
  description: 'Pravidelný catch-up',
  location: 'Praha',
  start_at: '2026-05-13T09:00:00Z',
  end_at: '2026-05-13T10:00:00Z',
  all_day: false,
  timezone: 'Europe/Prague',
  visibility: 'private',
  attendees: [],
  meet_link: null,
  conference_data: null,
  lead_id: null,
  client_id: null,
  project_id: null,
  sync_status: 'pending',
  sync_error: null,
  last_synced_at: null,
  deleted_at: null,
};

describe('toGooglePayload', () => {
  it('maps basic fields', () => {
    const g = toGooglePayload(base, { withMeet: false });
    expect(g.summary).toBe('Schůzka s klientem');
    expect(g.description).toBe('Pravidelný catch-up');
    expect(g.location).toBe('Praha');
    expect(g.start?.dateTime).toBe('2026-05-13T09:00:00Z');
    expect(g.end?.dateTime).toBe('2026-05-13T10:00:00Z');
    expect(g.start?.timeZone).toBe('Europe/Prague');
  });

  it('attaches attendees', () => {
    const ev = { ...base, attendees: [{ email: 'a@b.cz' }, { email: 'c@d.cz' }] as any };
    const g = toGooglePayload(ev, { withMeet: false });
    expect(g.attendees).toHaveLength(2);
    expect(g.attendees?.[0].email).toBe('a@b.cz');
  });

  it('with Meet → conferenceData with createRequest', () => {
    const g = toGooglePayload(base, { withMeet: true });
    expect(g.conferenceData?.createRequest?.conferenceSolutionKey?.type).toBe('hangoutsMeet');
    expect(g.conferenceData?.createRequest?.requestId).toBeTruthy();
  });

  it('without Meet → no conferenceData', () => {
    const g = toGooglePayload(base, { withMeet: false });
    expect(g.conferenceData).toBeUndefined();
  });

  it('all_day event → date instead of dateTime', () => {
    const ev = { ...base, all_day: true, start_at: '2026-05-13T00:00:00Z', end_at: '2026-05-14T00:00:00Z' };
    const g = toGooglePayload(ev, { withMeet: false });
    expect(g.start?.date).toBe('2026-05-13');
    expect(g.start?.dateTime).toBeUndefined();
  });

  it('embeds ARBIQ extendedProperties', () => {
    const ev = { ...base, lead_id: 'lead-9' };
    const g = toGooglePayload(ev, { withMeet: false });
    expect(g.extendedProperties?.private?.arbiq_event_id).toBe('ev-1');
    expect(g.extendedProperties?.private?.arbiq_lead_id).toBe('lead-9');
  });
});

describe('fromGooglePayload', () => {
  const googleEvent = {
    id: 'g-evt-123',
    etag: '"3382000000000"',
    summary: 'Meeting',
    description: 'Catch-up',
    location: 'Online',
    start: { dateTime: '2026-05-13T09:00:00+02:00', timeZone: 'Europe/Prague' },
    end: { dateTime: '2026-05-13T10:00:00+02:00', timeZone: 'Europe/Prague' },
    attendees: [{ email: 'a@b.cz', responseStatus: 'accepted' as const }],
    hangoutLink: 'https://meet.google.com/abc-defg-hij',
    conferenceData: { conferenceId: 'abc-defg-hij' },
    status: 'confirmed',
    extendedProperties: {
      private: { arbiq_event_id: 'arbiq-ev-99', arbiq_lead_id: 'lead-9', arbiq_visibility: 'shared' },
    },
  };

  it('extracts core fields', () => {
    const ev = fromGooglePayload(googleEvent, 'owner-1');
    expect(ev.title).toBe('Meeting');
    expect(ev.description).toBe('Catch-up');
    expect(ev.location).toBe('Online');
    expect(ev.google_event_id).toBe('g-evt-123');
    expect(ev.etag).toBe('"3382000000000"');
    expect(ev.owner_id).toBe('owner-1');
  });

  it('extracts dateTime and converts to ISO UTC', () => {
    const ev = fromGooglePayload(googleEvent, 'owner-1');
    expect(ev.start_at).toMatch(/^2026-05-13T0[0-9]:00:00/);
    expect(ev.all_day).toBe(false);
  });

  it('handles all_day (date-only) events', () => {
    const allDay = { ...googleEvent, start: { date: '2026-05-13' }, end: { date: '2026-05-14' } };
    const ev = fromGooglePayload(allDay, 'owner-1');
    expect(ev.all_day).toBe(true);
    expect(ev.start_at).toBe('2026-05-13T00:00:00Z');
  });

  it('extracts CRM linky from extendedProperties', () => {
    const ev = fromGooglePayload(googleEvent, 'owner-1');
    expect(ev.lead_id).toBe('lead-9');
    expect(ev.visibility).toBe('shared');
  });

  it('extracts Meet link', () => {
    const ev = fromGooglePayload(googleEvent, 'owner-1');
    expect(ev.meet_link).toBe('https://meet.google.com/abc-defg-hij');
  });
});
