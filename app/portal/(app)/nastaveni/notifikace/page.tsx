import { createClient } from '@/lib/supabase/server';
import { requireViewer } from '@/lib/supabase/viewer';
import { untyped } from '@/lib/supabase/untyped';
import PageHeader from '@/components/portal/PageHeader';
import { NOTIFICATION_TYPES } from '@/lib/notifications/channels';
import { isSmsConfigured } from '@/lib/sms';
import NotifikaceClient, { type PrefMap } from './NotifikaceClient';

export const dynamic = 'force-dynamic';

export default async function NotifikacePage() {
  const viewer = await requireViewer();

  let master = { email: true, sms: false, phone: '' };
  let prefs: PrefMap = {};
  let isAdmin = false;

  if (!viewer.isPreview) {
    const supabase = await createClient();
    const [{ data: prof }, { data: prefRows }] = await Promise.all([
      untyped(supabase)
        .from('profiles')
        .select('phone, role, email_notifications_enabled, sms_notifications_enabled')
        .eq('id', viewer.id)
        .single(),
      untyped(supabase)
        .from('notification_prefs')
        .select('type, email, sms, inapp')
        .eq('user_id', viewer.id),
    ]);

    const p = prof as {
      phone?: string | null;
      role?: string | null;
      email_notifications_enabled?: boolean | null;
      sms_notifications_enabled?: boolean | null;
    } | null;
    master = {
      email: p?.email_notifications_enabled ?? true,
      sms: p?.sms_notifications_enabled ?? false,
      phone: p?.phone ?? '',
    };
    isAdmin = p?.role === 'admin';

    for (const row of (prefRows ?? []) as Array<{ type: string; email: boolean; sms: boolean; inapp: boolean }>) {
      prefs[row.type] = { email: row.email, sms: row.sms, inapp: row.inapp };
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Nastavení"
        title="Notifikace"
        subtitle="Kam vám mají chodit upozornění — e-mail, SMS, do portálu."
      />
      <div className="px-4 md:px-8 py-8">
        <NotifikaceClient
          master={master}
          prefs={prefs}
          types={NOTIFICATION_TYPES}
          isAdmin={isAdmin}
          smsConfigured={isSmsConfigured()}
        />
      </div>
    </div>
  );
}
