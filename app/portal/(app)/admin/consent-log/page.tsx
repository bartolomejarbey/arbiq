import { createClient } from "@/lib/supabase/server";
import { requireViewer } from "@/lib/supabase/viewer";
import PageHeader from '@/components/portal/PageHeader';
import StatsCard from '@/components/portal/StatsCard';
import { formatDate } from '@/lib/formatters';

export const dynamic = 'force-dynamic';

type Row = {
  id: number;
  anon_id: string;
  ip_hash: string | null;
  user_agent: string | null;
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  source: string | null;
  created_at: string;
};

export default async function ConsentLogPage() {
  const viewer = await requireViewer();

  if (viewer.isPreview) {
    return (
      <div>
        <PageHeader eyebrow="Admin · DEMO" title="Cookie consent log" subtitle="GDPR audit trail souhlasů s cookies. (Demo režim — bez dat.)" />
        <div className="px-8 py-8">
          <p className="text-sandstone text-sm bg-coffee p-6">V demo režimu se reálné záznamy o souhlasech nezobrazují.</p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: rows, count }, { data: stats }] = await Promise.all([
    supabase
      .from('cookie_consent_log')
      .select('id, anon_id, ip_hash, user_agent, necessary, analytics, marketing, source, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('cookie_consent_log')
      .select('analytics, marketing, source'),
  ]);

  const log = ((rows ?? []) as unknown as Row[]);
  const all = ((stats ?? []) as unknown as { analytics: boolean; marketing: boolean; source: string | null }[]);

  const total = count ?? 0;
  const acceptAll = all.filter((r) => r.source === 'banner_accept_all').length;
  const necOnly = all.filter((r) => r.source === 'banner_necessary').length;
  const custom = all.filter((r) => r.source === 'banner_custom').length;
  const analyticsAccepted = all.filter((r) => r.analytics).length;

  return (
    <div>
      <PageHeader eyebrow="Admin · GDPR" title="Cookie consent log" subtitle="Audit trail všech souhlasů s cookies — pro případ kontroly ÚOOÚ." />
      <div className="px-8 py-8 space-y-8">
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard label="Celkem záznamů" value={total} tone="accent" />
          <StatsCard label="Přijato vše" value={acceptAll} tone="success" />
          <StatsCard label="Jen nezbytné" value={necOnly} />
          <StatsCard label="Analytika povolena" value={analyticsAccepted} hint={`${total > 0 ? Math.round(analyticsAccepted / total * 100) : 0} %`} />
        </section>

        <section className="bg-coffee overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-tobacco">
                <Th>Datum</Th><Th>Anon ID</Th><Th>IP (hash)</Th><Th>Nezbytné</Th><Th>Analytika</Th><Th>Marketing</Th><Th>Zdroj</Th>
              </tr>
            </thead>
            <tbody>
              {log.length === 0 && (
                <tr><td colSpan={7} className="text-center text-sandstone py-12">Zatím žádné záznamy.</td></tr>
              )}
              {log.map((r, i) => (
                <tr key={r.id} className={`border-b border-tobacco/50 ${i % 2 === 1 ? 'bg-coffee/40' : ''}`}>
                  <td className="px-4 py-3 text-sandstone whitespace-nowrap">{formatDate(r.created_at)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-sepia truncate max-w-[160px]">{r.anon_id}</td>
                  <td className="px-4 py-3 font-mono text-xs text-sandstone">{r.ip_hash ?? '—'}</td>
                  <td className="px-4 py-3"><Bool v={r.necessary} /></td>
                  <td className="px-4 py-3"><Bool v={r.analytics} /></td>
                  <td className="px-4 py-3"><Bool v={r.marketing} /></td>
                  <td className="px-4 py-3 font-mono text-xs text-sepia">{r.source ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <p className="text-sandstone text-xs">
          IP je hashována SHA-256 s denním saltem — neumožňuje korelovat napříč dny, ale dovoluje denní deduplikaci.
          User Agent uložen pro identifikaci browseru. Anon ID pochází z localStorage prohlížeče.
        </p>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left font-mono text-[10px] uppercase tracking-widest text-sandstone px-4 py-3">{children}</th>;
}

function Bool({ v }: { v: boolean }) {
  return v
    ? <span className="text-olive font-mono text-xs">ANO</span>
    : <span className="text-sandstone/60 font-mono text-xs">ne</span>;
}
