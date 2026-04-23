import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from "@/lib/supabase/server";
import { requireViewer } from "@/lib/supabase/viewer";
import PageHeader from '@/components/portal/PageHeader';
import MetricsCharts, { type MetricSeries } from '@/components/portal/MetricsCharts';
import EmptyState from '@/components/portal/EmptyState';

export const dynamic = 'force-dynamic';

type MetricRow = {
  recorded_for: string;
  metric: string;
  metric_label: string | null;
  value: number;
};

export default async function VysledkyPage() {
  const viewer = await requireViewer();
  const supabase = await createClient();
  const user = viewer;

  const { data } = await supabase
    .from('metrics')
    .select('recorded_for, metric, metric_label, value')
    .eq('client_id', user.id)
    .order('recorded_for', { ascending: true });

  const rows = ((data ?? []) as unknown as MetricRow[]);

  const grouped = new Map<string, MetricSeries>();
  for (const r of rows) {
    const key = `${r.metric}::${r.metric_label ?? ''}`;
    if (!grouped.has(key)) {
      grouped.set(key, { metric: r.metric, label: r.metric_label ?? '', data: [] });
    }
    grouped.get(key)!.data.push({ date: r.recorded_for, value: Number(r.value) });
  }
  const series = [...grouped.values()];

  return (
    <div>
      <PageHeader
        eyebrow="Klientská zóna"
        title="Výsledky"
        subtitle="Klíčové metriky z Vašich kampaní a webu."
      />
      <div className="px-8 py-8">
        {series.length > 0 ? (
          <MetricsCharts series={series} />
        ) : (
          <EmptyState
            title="Zatím nemáte marketingové výsledky"
            description="Jakmile začneme měřit Vaše kampaně, uvidíte zde grafy návštěvnosti, konverzí a leadů."
            action={
              <Link
                href="/portal/doporuceni"
                className="inline-block bg-caramel text-espresso px-6 py-3 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all"
              >
                Chci začít s marketingem
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
