import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from "@/lib/supabase/server";
import { requireViewer } from "@/lib/supabase/viewer";
import PageHeader from '@/components/portal/PageHeader';
import StatusBadge from '@/components/portal/StatusBadge';
import { formatDate, formatMoney } from '@/lib/formatters';
import NewProjectForm from './NewProjectForm';

export const dynamic = 'force-dynamic';

type Row = {
  id: string;
  name: string;
  status: string;
  progress: number;
  total_value: number | null;
  estimated_end_date: string | null;
  client: { id: string; full_name: string } | null;
};

type ClientOpt = { id: string; full_name: string };

export default async function ProjektyAdminPage() {
  const viewer = await requireViewer();
  const supabase = await createClient();
  const user = viewer;

  const [{ data: projects }, { data: clients }, { data: obchodnici }] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, status, progress, total_value, estimated_end_date, client:profiles!projects_client_id_fkey(id, full_name)')
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, full_name').eq('role', 'klient').order('full_name'),
    supabase.from('profiles').select('id, full_name').in('role', ['obchodnik', 'admin']).order('full_name'),
  ]);

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Projekty" subtitle="Všechny projekty napříč klienty." />
      <div className="px-8 py-8 space-y-8">
        <section className="bg-coffee p-6">
          <NewProjectForm
            clients={((clients ?? []) as unknown as ClientOpt[])}
            obchodnici={((obchodnici ?? []) as unknown as ClientOpt[])}
          />
        </section>

        <div className="bg-coffee overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-tobacco">
                <Th>Název</Th>
                <Th>Klient</Th>
                <Th>Status</Th>
                <Th>Postup</Th>
                <Th>Termín</Th>
                <th className="text-right font-mono text-[10px] uppercase tracking-widest text-sandstone px-4 py-3">Hodnota</th>
              </tr>
            </thead>
            <tbody>
              {((projects ?? []) as unknown as Row[]).map((p, i) => (
                <tr key={p.id} className={`border-b border-tobacco/50 hover:bg-tobacco/30 ${i % 2 === 1 ? 'bg-coffee/40' : ''}`}>
                  <td className="px-4 py-3">
                    <Link href={`/portal/admin/projekt/${p.id}`} className="text-moonlight hover:text-caramel">{p.name}</Link>
                  </td>
                  <td className="px-4 py-3 text-sepia">{p.client?.full_name ?? '—'}</td>
                  <td className="px-4 py-3"><StatusBadge kind="project" value={p.status} /></td>
                  <td className="px-4 py-3 text-sepia">{p.progress}&nbsp;%</td>
                  <td className="px-4 py-3 text-sandstone whitespace-nowrap">{formatDate(p.estimated_end_date)}</td>
                  <td className="px-4 py-3 text-right text-moonlight">{formatMoney(p.total_value)}</td>
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
