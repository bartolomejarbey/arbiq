import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { createClient } from "@/lib/supabase/server";
import { requireViewer } from "@/lib/supabase/viewer";
import PageHeader from '@/components/portal/PageHeader';
import ProjectCard, { type ProjectCardData } from '@/components/portal/ProjectCard';
import RecommendationCard, { type RecommendationData } from '@/components/portal/RecommendationCard';
import StatsCard from '@/components/portal/StatsCard';
import EmptyState from '@/components/portal/EmptyState';
import { formatMoney, daysUntil } from '@/lib/formatters';
import { markRecommendationInterested, dismissRecommendation } from '@/lib/actions/recommendations';

export const dynamic = 'force-dynamic';

type ProjectRow = {
  id: string;
  name: string;
  status: string;
  progress: number;
  estimated_end_date: string | null;
};

type MilestoneRow = {
  project_id: string;
  name: string;
  due_date: string | null;
};

type InvoiceRow = {
  id: string;
  amount: number;
  due_date: string;
  status: string;
};

type RecRow = {
  id: string;
  service_name: string;
  description: string;
  estimated_price: string | null;
  status: string;
};

export default async function DashboardPage() {
  const viewer = await requireViewer();
  const supabase = await createClient();
  const user = viewer;

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();
  const fullName = (profile as { full_name?: string } | null)?.full_name ?? '';
  const firstName = fullName.split(' ')[0] || 'klientka/te';

  const [{ data: projectRows }, { data: invoiceRows }, { data: recRows }] = await Promise.all([
    supabase.from('projects').select('id, name, status, progress, estimated_end_date').eq('client_id', user.id).order('created_at', { ascending: false }),
    supabase.from('invoices').select('id, amount, due_date, status').eq('client_id', user.id),
    supabase.from('recommendations').select('id, service_name, description, estimated_price, status').eq('client_id', user.id).neq('status', 'nova').order('created_at', { ascending: false }).limit(3),
  ]);

  const projects = ((projectRows ?? []) as unknown as ProjectRow[]);
  const invoices = ((invoiceRows ?? []) as unknown as InvoiceRow[]);
  const recommendations = ((recRows ?? []) as unknown as RecRow[]);

  const nextMilestones: Record<string, { name: string; due_date: string | null }> = {};
  if (projects.length > 0) {
    const { data: milestoneRows } = await supabase
      .from('milestones')
      .select('project_id, name, due_date')
      .in('project_id', projects.map((p) => p.id))
      .in('status', ['ceka', 'aktivni'])
      .order('sort_order', { ascending: true });
    const milestones = ((milestoneRows ?? []) as unknown as MilestoneRow[]);
    for (const m of milestones) {
      if (!nextMilestones[m.project_id]) {
        nextMilestones[m.project_id] = { name: m.name, due_date: m.due_date };
      }
    }
  }

  const upcoming = invoices.find((i) => i.status === 'ceka');
  const overdue = invoices.filter((i) => i.status === 'po_splatnosti');
  const overdueAmount = overdue.reduce((sum, i) => sum + Number(i.amount), 0);
  const totalUnpaid = invoices.filter((i) => i.status === 'ceka' || i.status === 'po_splatnosti').reduce((sum, i) => sum + Number(i.amount), 0);

  const projectCards: ProjectCardData[] = projects.map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    progress: p.progress,
    estimated_end_date: p.estimated_end_date,
    nextMilestoneName: nextMilestones[p.id]?.name,
    nextMilestoneDate: nextMilestones[p.id]?.due_date ?? null,
  }));

  return (
    <div>
      <PageHeader
        eyebrow="Klientská zóna"
        title={<>Dobrý den, {firstName}.</>}
        subtitle="Tady je stav Vašich případů, faktur a doporučení."
      />

      <div className="px-8 py-8 space-y-12">

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard
            label="Aktivní případy"
            value={projects.filter((p) => !['dokoncen', 'zruseny'].includes(p.status)).length}
            tone="accent"
          />
          <StatsCard
            label="Nadcházející platba"
            value={upcoming ? formatMoney(upcoming.amount) : '—'}
            hint={upcoming ? renderDueHint(upcoming.due_date) : 'Vše vyrovnáno.'}
          />
          <StatsCard
            label="Po splatnosti"
            value={overdue.length > 0 ? formatMoney(overdueAmount) : '—'}
            hint={overdue.length > 0 ? `${overdue.length} faktura(y)` : 'Žádné prodlení.'}
            tone={overdue.length > 0 ? 'danger' : 'default'}
          />
        </section>

        <section>
          <SectionHeader title="Vaše případy" link="" linkLabel={null} />
          {projectCards.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {projectCards.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Zatím žádný případ"
              description="Jakmile spustíme spolupráci, uvidíte zde detailní timeline projektu."
            />
          )}
        </section>

        <section>
          <SectionHeader
            title="Faktury"
            link="/portal/faktury"
            linkLabel="Všechny faktury"
          />
          <div className="bg-coffee p-6">
            <div className="text-sandstone text-sm">
              Celkem nezaplaceno: <span className="text-moonlight font-medium">{formatMoney(totalUnpaid)}</span>
              {' '}({invoices.filter((i) => i.status === 'ceka' || i.status === 'po_splatnosti').length} faktura/y)
            </div>
          </div>
        </section>

        {recommendations.length > 0 && (
          <section>
            <SectionHeader
              title="Doporučení od ARBIQ"
              link="/portal/doporuceni"
              linkLabel="Všechna doporučení"
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {recommendations.map((r) => (
                <RecommendationCard
                  key={r.id}
                  rec={r as RecommendationData}
                  onInterested={markRecommendationInterested}
                  onDismiss={dismissRecommendation}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ title, link, linkLabel }: { title: string; link: string; linkLabel: string | null }) {
  return (
    <div className="flex items-baseline justify-between mb-4">
      <h2 className="font-display italic font-black text-2xl text-moonlight">{title}</h2>
      {linkLabel && link && (
        <Link href={link} className="text-caramel hover:text-caramel-light text-xs font-mono uppercase tracking-widest inline-flex items-center gap-1">
          {linkLabel} <ArrowRight size={12} />
        </Link>
      )}
    </div>
  );
}

function renderDueHint(date: string): string {
  const days = daysUntil(date);
  if (days === null) return '';
  if (days < 0) return `Po splatnosti ${Math.abs(days)} dní`;
  if (days === 0) return 'Dnes';
  if (days === 1) return 'Zítra';
  return `Za ${days} dní`;
}
