import { redirect } from 'next/navigation';
import { createClient } from "@/lib/supabase/server";
import { requireViewer } from "@/lib/supabase/viewer";
import PageHeader from '@/components/portal/PageHeader';
import TaskList, { type TaskRow } from '@/components/portal/TaskList';
import NewTaskForm from './NewTaskForm';

export const dynamic = 'force-dynamic';

export default async function UkolyPage() {
  const viewer = await requireViewer();
  const supabase = await createClient();
  const user = viewer;

  const { data } = await supabase
    .from('crm_tasks')
    .select('id, title, description, priority, status, due_date, client_id, lead_id, client:profiles!crm_tasks_client_id_fkey(full_name), lead:landing_leads(name, case_number)')
    .eq('assigned_to', user.id)
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(500);

  const tasks = ((data ?? []) as unknown as TaskRow[]);

  return (
    <div>
      <PageHeader
        eyebrow="CRM"
        title="Úkoly"
        subtitle="Vaše to-do. Klikněte na kruh pro označení jako hotové."
      />
      <div className="px-8 py-8 space-y-8">
        <section className="bg-coffee p-6">
          <NewTaskForm />
        </section>
        <section>
          <TaskList tasks={tasks} />
        </section>
      </div>
    </div>
  );
}
