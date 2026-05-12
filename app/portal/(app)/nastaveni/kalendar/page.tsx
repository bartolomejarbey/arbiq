import { createClient } from '@/lib/supabase/server';
import { requireViewer } from '@/lib/supabase/viewer';
import PageHeader from '@/components/portal/PageHeader';
import SettingsClient from './SettingsClient';
import type { CalendarConnectionStatus } from '@/lib/google/types';

export const dynamic = 'force-dynamic';

export default async function CalendarSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; err?: string }>;
}) {
  const viewer = await requireViewer();
  const sp = await searchParams;

  let status: CalendarConnectionStatus = { state: 'not_connected' };

  if (!viewer.isPreview) {
    const supabase = await createClient();
    const { data: conn } = await supabase
      .from('google_oauth_connections')
      .select('google_user_email, last_sync_at, last_error, status')
      .eq('user_id', viewer.id)
      .maybeSingle();

    if (conn) {
      if (conn.status === 'connected') {
        status = {
          state: 'connected',
          email: conn.google_user_email,
          lastSyncAt: conn.last_sync_at,
        };
      } else if (conn.status === 'error') {
        status = {
          state: 'error',
          email: conn.google_user_email,
          error: conn.last_error ?? 'unknown',
        };
      } else if (conn.status === 'revoked') {
        status = { state: 'revoked', email: conn.google_user_email };
      }
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Nastavení"
        title="Google Calendar"
        subtitle="Obousměrná synchronizace s Vaším primárním Google kalendářem."
      />
      <div className="px-8 py-8">
        <SettingsClient
          status={status}
          flashOk={sp.ok === '1'}
          flashError={sp.err ?? null}
        />
      </div>
    </div>
  );
}
