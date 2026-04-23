import { notFound, redirect } from 'next/navigation';
import { createClient } from "@/lib/supabase/server";
import { requireViewer } from "@/lib/supabase/viewer";
import PageHeader from '@/components/portal/PageHeader';
import StatusBadge from '@/components/portal/StatusBadge';
import ProjectEditClient from './ProjectEditClient';
import type { Milestone } from '@/components/portal/Timeline';

export const dynamic = 'force-dynamic';

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  start_date: string | null;
  estimated_end_date: string | null;
  total_value: number | null;
  client_id: string;
  obchodnik_id: string | null;
  client: { full_name: string; email: string } | null;
};

export default async function AdminProjektDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const viewer = await requireViewer();
  const supabase = await createClient();
  const user = viewer;

  const [{ data: projectRow }, { data: milestoneRows }] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, description, status, progress, start_date, estimated_end_date, total_value, client_id, obchodnik_id, client:profiles!projects_client_id_fkey(full_name, email)')
      .eq('id', id)
      .single(),
    supabase.from('milestones').select('id, name, description, status, due_date, completed_at').eq('project_id', id).order('sort_order'),
  ]);

  const project = projectRow as unknown as ProjectRow | null;
  if (!project) notFound();
  const milestones = ((milestoneRows ?? []) as unknown as Milestone[]);

  return (
    <div>
      <PageHeader
        eyebrow="Admin · Projekt"
        title={project.name}
        subtitle={project.client?.full_name ?? undefined}
        actions={<StatusBadge kind="project" value={project.status} />}
      />
      <div className="px-8 py-8">
        <ProjectEditClient project={project} milestones={milestones} />
      </div>
    </div>
  );
}
