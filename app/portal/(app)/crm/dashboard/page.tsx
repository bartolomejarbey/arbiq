import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { createClient } from "@/lib/supabase/server";
import { requireViewer } from "@/lib/supabase/viewer";
import { PREVIEW_LEADS, PREVIEW_TASKS, PREVIEW_STATS } from '@/lib/preview-data';
import PageHeader from '@/components/portal/PageHeader';
import StatsCard from '@/components/portal/StatsCard';
import LeadTable, { type LeadRow } from '@/components/portal/LeadTable';
import TaskList, { type TaskRow } from '@/components/portal/TaskList';
import { formatMoney } from '@/lib/formatters';

export const dynamic = 'force-dynamic';

export default async function CrmDashboardPage() {
  const viewer = await requireViewer();

  // Demo data v preview módu — návštěvník vidí ostrý dashboard.
  if (viewer.isPreview) {
    const newLeads = PREVIEW_LEADS.filter((l) => l.status === 'new') as unknown as LeadRow[];
    const tasks = PREVIEW_TASKS as unknown as TaskRow[];
    return (
      <div>
        <PageHeader eyebrow="CRM · DEMO" title="Přehled" subtitle="Ukázka — klienti jsou Sherlock Holmes a spol." />
        <div className="px-8 py-8 space-y-12">
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatsCard label="Aktivní klienti" value={PREVIEW_STATS.activeClients} tone="accent" />
            <StatsCard label="Leady ke zpracování" value={newLeads.length} tone={newLeads.length > 0 ? 'danger' : 'default'} />
            <StatsCard label="Otevřené úkoly" value={tasks.length} hint="3 s termínem tento týden" />
            <StatsCard label="Hodnota pipeline" value={formatMoney(PREVIEW_STATS.pipelineValue)} />
          </section>
          <section>
            <h2 className="font-display italic font-black text-2xl text-moonlight mb-4">Nepřiřazené nové leady</h2>
            <LeadTable leads={newLeads} />
          </section>
          <section>
            <h2 className="font-display italic font-black text-2xl text-moonlight mb-4">Vaše dnešní úkoly</h2>
            <TaskList tasks={tasks} />
          </section>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const user = viewer;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();
  const role = (profile as { role?: string } | null)?.role ?? 'obchodnik';
  const isAdmin = role === 'admin';

  // For obchodnik: only their assigned clients/projects/leads.
  // For admin: everything (RLS lets them through; we just don't filter).
  let activeClientsQuery = supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'klient').eq('is_active', true);
  if (!isAdmin) activeClientsQuery = activeClientsQuery.eq('assigned_obchodnik', user.id);

  const [
    { count: activeClients },
    { data: newLeadsRows },
    { data: tasksRows },
    { data: pipelineRows },
  ] = await Promise.all([
    activeClientsQuery,
    supabase
      .from('landing_leads')
      .select('id, created_at, case_number, kampan, obor, velikost_firmy, step3_odpoved, name, email, phone, website_url, popis, utm_source, utm_medium, utm_campaign, status, source_tag, assigned_to, notes')
      .eq('status', 'new')
      .is('assigned_to', null)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('crm_tasks')
      .select('id, title, description, priority, status, due_date, client_id, lead_id, client:profiles!crm_tasks_client_id_fkey(full_name), lead:landing_leads(name, case_number)')
      .eq('assigned_to', user.id)
      .neq('status', 'done')
      .neq('status', 'cancelled')
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(50),
    supabase.from('projects').select('total_value, status').not('status', 'in', '("dokoncen","zruseny")'),
  ]);

  const newLeads = ((newLeadsRows ?? []) as unknown as LeadRow[]);
  const tasks = ((tasksRows ?? []) as unknown as TaskRow[]);
  const pipeline = ((pipelineRows ?? []) as unknown as { total_value: number | null }[]);

  const upcomingFollowups = tasks.filter((t) => t.due_date).length;
  const pipelineValue = pipeline.reduce((sum, p) => sum + Number(p.total_value ?? 0), 0);

  return (
    <div>
      <PageHeader
        eyebrow={isAdmin ? 'Admin · CRM' : 'CRM'}
        title="Přehled"
        subtitle={isAdmin ? 'Vidíte data všech obchodníků.' : 'Vaše leady, klienti a úkoly.'}
      />

      <div className="px-8 py-8 space-y-12">
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard label="Aktivní klienti" value={activeClients ?? 0} tone="accent" />
          <StatsCard label="Leady ke zpracování" value={newLeads.length} tone={newLeads.length > 0 ? 'danger' : 'default'} />
          <StatsCard label="Otevřené úkoly" value={tasks.length} hint={`${upcomingFollowups} s termínem`} />
          <StatsCard label="Hodnota pipeline" value={formatMoney(pipelineValue)} />
        </section>

        <section>
          <SectionHeader title="Nepřiřazené nové leady" link="/portal/crm/leady" />
          <LeadTable leads={newLeads} />
        </section>

        <section>
          <SectionHeader title="Vaše dnešní úkoly" link="/portal/crm/ukoly" />
          <TaskList tasks={tasks} />
        </section>
      </div>
    </div>
  );
}

function SectionHeader({ title, link }: { title: string; link: string }) {
  return (
    <div className="flex items-baseline justify-between mb-4">
      <h2 className="font-display italic font-black text-2xl text-moonlight">{title}</h2>
      <Link href={link} className="text-caramel hover:text-caramel-light text-xs font-mono uppercase tracking-widest inline-flex items-center gap-1">
        Vše <ArrowRight size={12} />
      </Link>
    </div>
  );
}
