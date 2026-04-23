import { redirect } from 'next/navigation';
import { createClient } from "@/lib/supabase/server";
import { requireViewer } from "@/lib/supabase/viewer";
import { PREVIEW_STATS } from '@/lib/preview-data';
import PageHeader from '@/components/portal/PageHeader';
import StatsCard from '@/components/portal/StatsCard';
import MetricsCharts, { type MetricSeries } from '@/components/portal/MetricsCharts';
import { formatMoney } from '@/lib/formatters';

export const dynamic = 'force-dynamic';

export default async function StatistikyPage() {
  const viewer = await requireViewer();

  // Demo data v preview módu — ať návštěvník vidí ostrý dashboard.
  if (viewer.isPreview) {
    const series: MetricSeries[] = [{
      metric: 'leady',
      label: '',
      data: Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        return { date: d.toISOString().slice(0, 10), value: Math.round(Math.random() * 4) + (i % 7 === 0 ? 6 : 1) };
      }),
    }];
    return (
      <div>
        <PageHeader eyebrow="Admin · DEMO" title="Statistiky" subtitle="Ukázka co Vám portál zobrazuje. Klienti jsou fiktivní (Sherlock Holmes &amp; spol.)." />
        <div className="px-8 py-8 space-y-12">
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatsCard label="Tržby tento měsíc" value={formatMoney(PREVIEW_STATS.revenueThisMonth)} tone="success" />
            <StatsCard label="Tržby celkem" value={formatMoney(PREVIEW_STATS.revenueAllTime)} />
            <StatsCard label="Aktivní klienti" value={PREVIEW_STATS.activeClients} tone="accent" />
            <StatsCard label="Pipeline" value={formatMoney(PREVIEW_STATS.pipelineValue)} />
          </section>
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCard label="Leady (90 dní)" value={PREVIEW_STATS.leadsLast90} />
            <StatsCard label="Konverzní poměr" value={`${PREVIEW_STATS.conversionRate} %`} hint="6 z 23 kvalifikováno" />
            <StatsCard label="Top kampaň" value={PREVIEW_STATS.topKampan} hint={`${PREVIEW_STATS.topKampanCount} leadů`} />
          </section>
          <section>
            <h2 className="font-display italic font-black text-2xl text-moonlight mb-4">Příchozí leady (posl. 30 dní)</h2>
            <MetricsCharts series={series} />
          </section>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const user = viewer;

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const last90Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90).toISOString();

  const [{ data: invoicesAll }, { count: clientsCount }, { data: leadsRecent }, { data: leadsAll }, { data: pipeline }] = await Promise.all([
    supabase.from('invoices').select('amount, status, paid_at, issued_at'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'klient').eq('is_active', true),
    supabase.from('landing_leads').select('created_at, status, kampan').gte('created_at', last90Days),
    supabase.from('landing_leads').select('id, status'),
    supabase.from('projects').select('total_value, status').not('status', 'in', '("dokoncen","zruseny")'),
  ]);

  const invoices = ((invoicesAll ?? []) as unknown as { amount: number; status: string; paid_at: string | null; issued_at: string }[]);
  const leads90 = ((leadsRecent ?? []) as unknown as { created_at: string; status: string; kampan: string }[]);
  const leadsTotal = ((leadsAll ?? []) as unknown as { id: string; status: string }[]);
  const projects = ((pipeline ?? []) as unknown as { total_value: number | null }[]);

  const revenueAllTime = invoices.filter((i) => i.status === 'zaplaceno').reduce((s, i) => s + Number(i.amount), 0);
  const revenueThisMonth = invoices
    .filter((i) => i.status === 'zaplaceno' && i.paid_at && i.paid_at >= thisMonthStart)
    .reduce((s, i) => s + Number(i.amount), 0);

  const convertedCount = leadsTotal.filter((l) => l.status === 'converted').length;
  const conversionRate = leadsTotal.length > 0 ? Math.round((convertedCount / leadsTotal.length) * 100) : 0;

  // Top campaign (last 90d)
  const kampanCounts: Record<string, number> = {};
  for (const l of leads90) kampanCounts[l.kampan] = (kampanCounts[l.kampan] ?? 0) + 1;
  const topKampan = Object.entries(kampanCounts).sort((a, b) => b[1] - a[1])[0];

  // Leads-per-day series (last 90 days)
  const byDay = new Map<string, number>();
  for (const l of leads90) {
    const day = l.created_at.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }
  const leadSeries: MetricSeries[] = [{
    metric: 'leady',
    label: '',
    data: [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, value]) => ({ date, value })),
  }];

  const pipelineValue = projects.reduce((s, p) => s + Number(p.total_value ?? 0), 0);

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Statistiky" subtitle="Přehled výkonu firmy." />
      <div className="px-8 py-8 space-y-12">
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard label="Tržby tento měsíc" value={formatMoney(revenueThisMonth)} tone="success" />
          <StatsCard label="Tržby celkem" value={formatMoney(revenueAllTime)} />
          <StatsCard label="Aktivní klienti" value={clientsCount ?? 0} tone="accent" />
          <StatsCard label="Pipeline (otevřené projekty)" value={formatMoney(pipelineValue)} />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard label="Leady (posl. 90 dní)" value={leads90.length} />
          <StatsCard label="Konverzní poměr (lead → klient)" value={`${conversionRate} %`} hint={`${convertedCount} z ${leadsTotal.length}`} />
          <StatsCard label="Nejúspěšnější kampaň (90 d)" value={topKampan ? topKampan[0] : '—'} hint={topKampan ? `${topKampan[1]} leadů` : ''} />
        </section>

        <section>
          <h2 className="font-display italic font-black text-2xl text-moonlight mb-4">Příchozí leady (posl. 90 dní)</h2>
          {leadSeries[0].data.length > 0 ? (
            <MetricsCharts series={leadSeries} />
          ) : (
            <p className="text-sandstone text-sm bg-coffee p-6">Zatím žádné leady v tomto období.</p>
          )}
        </section>
      </div>
    </div>
  );
}
