import Link from 'next/link';
import { createClient } from "@/lib/supabase/server";
import { requireViewer } from "@/lib/supabase/viewer";
import PageHeader from '@/components/portal/PageHeader';
import StatsCard from '@/components/portal/StatsCard';
import { formatDate } from '@/lib/formatters';

export const dynamic = 'force-dynamic';

type Session = {
  id: string;
  visitor_id: string;
  page_path: string | null;
  user_agent: string | null;
  started_at: string;
  last_message_at: string | null;
  message_count: number;
};

type FirstMessage = { session_id: string; content: string };

export default async function AdminChatsPage() {
  const viewer = await requireViewer();

  if (viewer.isPreview) {
    return (
      <div>
        <PageHeader eyebrow="Admin · DEMO" title="Chaty s asistentem" subtitle="Konverzace návštěvníků s AI asistentem ARBIQ. (Demo režim — bez dat.)" />
        <div className="px-8 py-8 space-y-8">
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatsCard label="Sessions (30 d)" value="—" tone="accent" />
            <StatsCard label="Zpráv celkem" value="—" />
            <StatsCard label="Průměr zpráv / session" value="—" />
            <StatsCard label="Konverze" value="—" />
          </section>
          <p className="text-sandstone text-sm bg-coffee p-6">
            V demo režimu se konverzace nezobrazují. Po nasazení uvidíte seznam všech chatů s odkazem na transkript.
          </p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: sessions, count: totalSessions }, { count: totalMessages }] = await Promise.all([
    supabase
      .from('chat_sessions')
      .select('id, visitor_id, page_path, user_agent, started_at, last_message_at, message_count', { count: 'exact' })
      .gte('started_at', since)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(100),
    supabase.from('chat_messages').select('id', { count: 'exact', head: true }).gte('created_at', since),
  ]);

  const list = ((sessions ?? []) as unknown as Session[]);
  const sessCount = totalSessions ?? 0;
  const msgCount = totalMessages ?? 0;
  const avgMsgs = sessCount > 0 ? (msgCount / sessCount).toFixed(1) : '0';

  // Fetch first user message per session for preview
  const sessionIds = list.map((s) => s.id);
  let firstByes: Record<string, string> = {};
  if (sessionIds.length > 0) {
    const { data: msgs } = await supabase
      .from('chat_messages')
      .select('session_id, content, created_at, role')
      .in('session_id', sessionIds)
      .eq('role', 'user')
      .order('created_at', { ascending: true });
    const seen = new Set<string>();
    for (const m of ((msgs ?? []) as unknown as (FirstMessage & { role: string })[])) {
      if (seen.has(m.session_id)) continue;
      seen.add(m.session_id);
      firstByes[m.session_id] = m.content;
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Chaty s asistentem" subtitle="Konverzace návštěvníků s AI asistentem. Posledních 30 dní." />
      <div className="px-8 py-8 space-y-8">
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard label="Sessions (30 d)" value={sessCount.toLocaleString('cs')} tone="accent" />
          <StatsCard label="Zpráv celkem" value={msgCount.toLocaleString('cs')} />
          <StatsCard label="Průměr zpráv / session" value={avgMsgs} />
          <StatsCard label="Aktivní (s 3+ zprávami)" value={list.filter((s) => s.message_count >= 3).length} tone="success" />
        </section>

        <section className="bg-coffee">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-tobacco">
                <Th>Začátek</Th><Th>Visitor</Th><Th>Stránka</Th><Th>Zpráv</Th><Th>První dotaz</Th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr><td colSpan={5} className="text-center text-sandstone py-12">Zatím žádné konverzace.</td></tr>
              )}
              {list.map((s, i) => (
                <tr key={s.id} className={`border-b border-tobacco/50 ${i % 2 === 1 ? 'bg-coffee/40' : ''} hover:bg-tobacco/20`}>
                  <td className="px-4 py-3 text-sandstone whitespace-nowrap">{formatDate(s.started_at)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-sepia truncate max-w-[140px]">{s.visitor_id}</td>
                  <td className="px-4 py-3 font-mono text-xs text-sepia">{s.page_path ?? '—'}</td>
                  <td className="px-4 py-3 text-moonlight">{s.message_count}</td>
                  <td className="px-4 py-3">
                    <Link href={`/portal/admin/chats/${s.id}`} className="text-caramel hover:text-caramel-light text-sm truncate block max-w-[400px]">
                      {firstByes[s.id] ?? '(bez zpráv)'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left font-mono text-[10px] uppercase tracking-widest text-sandstone px-4 py-3">{children}</th>;
}
