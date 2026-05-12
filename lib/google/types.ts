import type { calendar_v3 } from 'googleapis';
import type { Database } from '@/lib/types/database';

export type EventRow = Database['public']['Tables']['events']['Row'];
export type EventInsert = Database['public']['Tables']['events']['Insert'];
export type EventUpdate = Database['public']['Tables']['events']['Update'];

export type ConnectionRow = Database['public']['Tables']['google_oauth_connections']['Row'];

export type GoogleEvent = calendar_v3.Schema$Event;

export type EventAttendee = {
  email: string;
  responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  optional?: boolean;
  displayName?: string;
};

export type EventVisibility = 'private' | 'shared';

export type CalendarConnectionStatus =
  | { state: 'not_connected' }
  | { state: 'connected'; email: string; lastSyncAt: string | null }
  | { state: 'error'; email: string; error: string }
  | { state: 'revoked'; email: string };
