import { createClient } from '@/lib/supabase/server';
import { untyped } from '@/lib/supabase/untyped';
import { requireViewer } from '@/lib/supabase/viewer';
import PageHeader from '@/components/portal/PageHeader';
import NotificationList, { type NotificationRow } from './NotificationList';

export const dynamic = 'force-dynamic';

export default async function NotifikacePage() {
  const viewer = await requireViewer();
  const supabase = await createClient();

  const { data } = await untyped(supabase)
    .from('notifications')
    .select('id, type, title, body, link, read_at, created_at')
    .eq('user_id', viewer.id)
    .order('created_at', { ascending: false })
    .limit(100);

  const items = ((data ?? []) as unknown as NotificationRow[]);

  return (
    <div>
      <PageHeader eyebrow="Portál" title="Oznámení" subtitle="Události, které vyžadují vaši pozornost." />
      <div className="px-8 py-8">
        <NotificationList initial={items} />
      </div>
    </div>
  );
}
