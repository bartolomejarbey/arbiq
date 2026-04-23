import { redirect } from 'next/navigation';
import { createClient } from "@/lib/supabase/server";
import { requireViewer } from "@/lib/supabase/viewer";
import PageHeader from '@/components/portal/PageHeader';
import StatusBadge from '@/components/portal/StatusBadge';
import { formatDate } from '@/lib/formatters';
import RecommendationsAdminClient from './RecommendationsAdminClient';

export const dynamic = 'force-dynamic';

type Row = {
  id: string;
  service_name: string;
  description: string;
  estimated_price: string | null;
  status: string;
  created_at: string;
  client: { id: string; full_name: string } | null;
};

type ClientOpt = { id: string; full_name: string };

export default async function DoporuceniAdminPage() {
  const viewer = await requireViewer();
  const supabase = await createClient();
  const user = viewer;

  const [{ data: recRows }, { data: clients }] = await Promise.all([
    supabase
      .from('recommendations')
      .select('id, service_name, description, estimated_price, status, created_at, client:profiles!recommendations_client_id_fkey(id, full_name)')
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, full_name').eq('role', 'klient').order('full_name'),
  ]);

  const recs = ((recRows ?? []) as unknown as Row[]);
  const clientList = ((clients ?? []) as unknown as ClientOpt[]);

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Doporučení" subtitle="Upsell návrhy, které vidí klient v portálu." />
      <div className="px-8 py-8 space-y-8">
        <RecommendationsAdminClient clients={clientList} />

        <div className="bg-coffee overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-tobacco">
                <Th>Klient</Th><Th>Služba</Th>
                <Th>Cena</Th><Th>Stav</Th><Th>Vytvořeno</Th>
              </tr>
            </thead>
            <tbody>
              {recs.length === 0 && (
                <tr><td colSpan={5} className="text-center text-sandstone py-12">Zatím žádná doporučení.</td></tr>
              )}
              {recs.map((r, i) => (
                <tr key={r.id} className={`border-b border-tobacco/50 ${i % 2 === 1 ? 'bg-coffee/40' : ''}`}>
                  <td className="px-4 py-3 text-sepia">{r.client?.full_name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="text-moonlight font-medium">{r.service_name}</div>
                    <div className="text-sandstone text-xs mt-1 max-w-md truncate">{r.description}</div>
                  </td>
                  <td className="px-4 py-3 text-sepia">{r.estimated_price ?? '—'}</td>
                  <td className="px-4 py-3"><StatusBadge kind="recommendation" value={r.status} /></td>
                  <td className="px-4 py-3 text-sandstone whitespace-nowrap">{formatDate(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left font-mono text-[10px] uppercase tracking-widest text-sandstone px-4 py-3">{children}</th>;
}
