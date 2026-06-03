import { redirect } from 'next/navigation';
import { getViewerRole } from '@/lib/supabase/viewer';
import PageHeader from '@/components/portal/PageHeader';
import AssistantChat from './AssistantChat';

export const dynamic = 'force-dynamic';

export default async function AsistentPage() {
  const role = await getViewerRole();
  if (role !== 'admin' && role !== 'obchodnik') redirect('/portal/dashboard');

  return (
    <div>
      <PageHeader
        eyebrow="AI"
        title="Asistent"
        subtitle="Napiš přirozeně, co potřebuješ — vytvořím nabídky, faktury, smlouvy, klienty a víc."
      />
      <div className="px-4 md:px-8 py-6">
        <AssistantChat />
      </div>
    </div>
  );
}
