import { redirect } from 'next/navigation';
import { createClient } from "@/lib/supabase/server";
import { requireViewer } from "@/lib/supabase/viewer";
import PageHeader from '@/components/portal/PageHeader';
import KanbanBoard, { type KanbanLead } from '@/components/portal/KanbanBoard';

export const dynamic = 'force-dynamic';

export default async function PipelinePage() {
  const viewer = await requireViewer();
  const supabase = await createClient();
  const user = viewer;

  const { data } = await supabase
    .from('landing_leads')
    .select('id, name, case_number, kampan, pipeline_stage, created_at, email')
    .order('created_at', { ascending: false })
    .limit(500);

  const leads = ((data ?? []) as unknown as KanbanLead[]);

  return (
    <div>
      <PageHeader
        eyebrow="CRM"
        title="Pipeline"
        subtitle="Přetáhněte kartu pro změnu fáze."
      />
      <div className="px-8 py-8">
        <KanbanBoard leads={leads} />
      </div>
    </div>
  );
}
