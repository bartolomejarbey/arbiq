import { createClient } from '@/lib/supabase/server';
import { requireViewer } from '@/lib/supabase/viewer';
import PageHeader from '@/components/portal/PageHeader';
import CalendarClient from './CalendarClient';
import { startOfWeek, endOfWeek, subWeeks, addWeeks } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function KalendarPage() {
  const viewer = await requireViewer();

  if (viewer.isPreview) {
    return (
      <div>
        <PageHeader
          eyebrow="CRM · DEMO"
          title="Kalendář"
          subtitle="Demo data."
        />
        <div className="px-8 py-8">
          <p className="text-sepia/70">Kalendář v demo módu zatím není.</p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const now = new Date();
  const rangeStart = subWeeks(startOfWeek(now, { weekStartsOn: 1 }), 1).toISOString();
  const rangeEnd = addWeeks(endOfWeek(now, { weekStartsOn: 1 }), 2).toISOString();

  const { data: events } = await supabase
    .from('events')
    .select(
      '*, lead:landing_leads(id, name, case_number), client:profiles!events_client_id_fkey(id, full_name), project:projects(id, name)',
    )
    .gte('start_at', rangeStart)
    .lt('start_at', rangeEnd)
    .is('deleted_at', null)
    .order('start_at', { ascending: true });

  const { data: connection } = await supabase
    .from('google_oauth_connections')
    .select('google_user_email, last_sync_at, status, last_error')
    .eq('user_id', viewer.id)
    .maybeSingle();

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      <CalendarClient
        initialEvents={(events ?? []) as unknown[]}
        viewerId={viewer.id}
        connection={connection}
      />
    </div>
  );
}
