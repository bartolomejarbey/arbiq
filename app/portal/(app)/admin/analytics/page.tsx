import { createClient } from "@/lib/supabase/server";
import { requireViewer } from "@/lib/supabase/viewer";
import PageHeader from '@/components/portal/PageHeader';
import StatsCard from '@/components/portal/StatsCard';
import MetricsCharts, { type MetricSeries } from '@/components/portal/MetricsCharts';

export const dynamic = 'force-dynamic';

type Row = {
  visitor_id: string;
  session_id: string;
  event: string;
  page: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  created_at: string;
};

function topN<T extends string>(items: (T | null)[], n: number): { key: string; count: number }[] {
  const m = new Map<string, number>();
  for (const it of items) {
    if (!it) continue;
    m.set(it, (m.get(it) ?? 0) + 1);
  }
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, count]) => ({ key, count }));
}

export default async function AnalyticsPage() {
  const viewer = await requireViewer();

  if (viewer.isPreview) {
    const series: MetricSeries[] = [{
      metric: 'navstevnost',
      label: '',
      data: Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        return { date: d.toISOString().slice(0, 10), value: 30 + Math.round(Math.random() * 80) + (i % 7 === 6 ? 60 : 0) };
      }),
    }];
    return (
      <div>
        <PageHeader eyebrow="Admin · DEMO" title="Analytics" subtitle="Vlastní lehký tracker (page views, CTA kliky, formuláře). Demo režim — fiktivní data." />
        <div className="px-8 py-8 space-y-8">
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatsCard label="Page views (30 d)" value="2 481" tone="accent" />
            <StatsCard label="Unikátní visitors" value="437" />
            <StatsCard label="Sessions" value="612" />
            <StatsCard label="Bounce rate" value="42 %" hint="Nižší je lepší" />
          </section>
          <section>
            <h2 className="font-display italic font-black text-2xl text-moonlight mb-4">Návštěvnost (posl. 30 dní)</h2>
            <MetricsCharts series={series} />
          </section>
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Box title="Top stránky">
              <Row k="/" v="612" />
              <Row k="/sluzby/webove-stranky" v="287" />
              <Row k="/rentgen" v="198" />
              <Row k="/pripady" v="174" />
              <Row k="/aplikace" v="143" />
            </Box>
            <Box title="Top eventy">
              <Row k="pageview" v="2 481" />
              <Row k="cta_hero_click" v="89" />
              <Row k="rentgen_submit" v="34" />
              <Row k="pripad_step_advance" v="156" />
              <Row k="kontakt_submit" v="22" />
            </Box>
            <Box title="Top zdroje (UTM)">
              <Row k="google" v="387" />
              <Row k="facebook" v="142" />
              <Row k="(direct)" v="118" />
              <Row k="linkedin" v="56" />
            </Box>
            <Box title="Top kampaně">
              <Row k="webove-stranky" v="98" />
              <Row k="seo-audit" v="64" />
              <Row k="brand" v="45" />
            </Box>
          </section>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: rows } = await supabase
    .from('analytics_events')
    .select('visitor_id, session_id, event, page, referrer, utm_source, utm_medium, utm_campaign, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(10000);

  const events = ((rows ?? []) as unknown as Row[]);
  const pageviews = events.filter((e) => e.event === 'pageview');

  const uniqueVisitors = new Set(events.map((e) => e.visitor_id)).size;
  const uniqueSessions = new Set(events.map((e) => e.session_id)).size;

  const byDay = new Map<string, number>();
  for (const e of pageviews) {
    const day = e.created_at.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }
  const series: MetricSeries[] = [{
    metric: 'navstevnost',
    label: '',
    data: [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, value]) => ({ date, value })),
  }];

  const topPages = topN(pageviews.map((e) => e.page), 10);
  const topEvents = topN(events.map((e) => e.event), 10);
  const topSources = topN(events.map((e) => e.utm_source), 8);
  const topCampaigns = topN(events.map((e) => e.utm_campaign), 8);

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Analytics" subtitle="Vlastní lehký tracker (page views, CTA kliky, formuláře). Posledních 30 dní." />
      <div className="px-8 py-8 space-y-8">
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard label="Page views (30 d)" value={pageviews.length.toLocaleString('cs')} tone="accent" />
          <StatsCard label="Unikátní visitors" value={uniqueVisitors.toLocaleString('cs')} />
          <StatsCard label="Sessions" value={uniqueSessions.toLocaleString('cs')} />
          <StatsCard label="Eventy celkem" value={events.length.toLocaleString('cs')} />
        </section>

        <section>
          <h2 className="font-display italic font-black text-2xl text-moonlight mb-4">Návštěvnost (posl. 30 dní)</h2>
          {series[0].data.length > 0 ? (
            <MetricsCharts series={series} />
          ) : (
            <p className="text-sandstone text-sm bg-coffee p-6">Zatím žádná data — tracker začne sbírat po prvním requestu.</p>
          )}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Box title="Top stránky">
            {topPages.length === 0 && <p className="text-sandstone text-sm">—</p>}
            {topPages.map((p) => <Row key={p.key} k={p.key} v={p.count.toLocaleString('cs')} />)}
          </Box>
          <Box title="Top eventy">
            {topEvents.length === 0 && <p className="text-sandstone text-sm">—</p>}
            {topEvents.map((p) => <Row key={p.key} k={p.key} v={p.count.toLocaleString('cs')} />)}
          </Box>
          <Box title="Top zdroje (UTM source)">
            {topSources.length === 0 && <p className="text-sandstone text-sm">—</p>}
            {topSources.map((p) => <Row key={p.key} k={p.key} v={p.count.toLocaleString('cs')} />)}
          </Box>
          <Box title="Top kampaně (UTM campaign)">
            {topCampaigns.length === 0 && <p className="text-sandstone text-sm">—</p>}
            {topCampaigns.map((p) => <Row key={p.key} k={p.key} v={p.count.toLocaleString('cs')} />)}
          </Box>
        </section>

        <p className="text-sandstone text-xs">
          Tracker respektuje cookie consent — pokud uživatel zamítne kategorii „Analytika", neukládá se nic.
          IP je hashovaná SHA-256 s denním saltem (stejné pravidlo jako consent log).
        </p>
      </div>
    </div>
  );
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-coffee p-6">
      <div className="font-mono text-[10px] uppercase tracking-widest text-sandstone mb-4">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between text-sm border-b border-tobacco/40 pb-2 last:border-b-0">
      <span className="text-moonlight font-mono text-xs truncate max-w-[70%]">{k}</span>
      <span className="text-caramel font-mono text-xs">{v}</span>
    </div>
  );
}
