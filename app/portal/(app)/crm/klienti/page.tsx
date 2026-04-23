import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from "@/lib/supabase/server";
import { requireViewer } from "@/lib/supabase/viewer";
import PageHeader from '@/components/portal/PageHeader';
import EmptyState from '@/components/portal/EmptyState';
import { formatDate, formatMoney } from '@/lib/formatters';

export const dynamic = 'force-dynamic';

type ClientRow = {
  id: string;
  full_name: string;
  email: string;
  company: string | null;
  is_active: boolean;
  created_at: string;
  projects: { id: string; total_value: number | null; status: string }[] | null;
};

export default async function KlientiPage() {
  const viewer = await requireViewer();
  const supabase = await createClient();
  const user = viewer;

  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email, company, is_active, created_at, projects(id, total_value, status)')
    .eq('role', 'klient')
    .order('full_name', { ascending: true });

  const clients = ((data ?? []) as unknown as ClientRow[]);

  return (
    <div>
      <PageHeader
        eyebrow="CRM"
        title="Klienti"
        subtitle="Vaši přiřazení klienti a jejich projekty."
      />
      <div className="px-8 py-8">
        {clients.length === 0 ? (
          <EmptyState title="Zatím nemáte přiřazené klienty" description="Konvertujte lead nebo si nechte přiřadit klienta administrátorem." />
        ) : (
          <div className="bg-coffee overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-tobacco">
                  <th className="text-left font-mono text-[10px] uppercase tracking-widest text-sandstone px-6 py-3">Jméno</th>
                  <th className="text-left font-mono text-[10px] uppercase tracking-widest text-sandstone px-6 py-3">Firma</th>
                  <th className="text-left font-mono text-[10px] uppercase tracking-widest text-sandstone px-6 py-3">Projekty</th>
                  <th className="text-right font-mono text-[10px] uppercase tracking-widest text-sandstone px-6 py-3">Hodnota</th>
                  <th className="text-left font-mono text-[10px] uppercase tracking-widest text-sandstone px-6 py-3">Klient od</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c, i) => {
                  const projectCount = c.projects?.length ?? 0;
                  const value = c.projects?.reduce((s, p) => s + Number(p.total_value ?? 0), 0) ?? 0;
                  return (
                    <tr key={c.id} className={`border-b border-tobacco/50 hover:bg-tobacco/30 ${i % 2 === 1 ? 'bg-coffee/40' : ''}`}>
                      <td className="px-6 py-4">
                        <Link href={`/portal/crm/klient/${c.id}`} className="text-moonlight hover:text-caramel">
                          {c.full_name}
                        </Link>
                        <div className="text-sandstone text-xs">{c.email}</div>
                      </td>
                      <td className="px-6 py-4 text-sepia">{c.company ?? '—'}</td>
                      <td className="px-6 py-4 text-sepia">{projectCount}</td>
                      <td className="px-6 py-4 text-right text-moonlight">{formatMoney(value)}</td>
                      <td className="px-6 py-4 text-sandstone">{formatDate(c.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
