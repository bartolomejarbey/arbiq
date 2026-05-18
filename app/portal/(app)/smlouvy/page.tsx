import Link from 'next/link';
import { FileText, FileDown } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { untyped } from '@/lib/supabase/untyped';
import { requireViewer } from '@/lib/supabase/viewer';
import PageHeader from '@/components/portal/PageHeader';
import StatusBadge from '@/components/portal/StatusBadge';
import { formatDate, formatMoney } from '@/lib/formatters';

export const dynamic = 'force-dynamic';

type Row = {
  id: string;
  contract_number: string;
  title: string;
  total_price: number;
  status: string;
  created_at: string;
  pdf_url: string | null;
  docx_url: string | null;
};

export default async function SmlouvyClientPage() {
  const viewer = await requireViewer();
  const supabase = await createClient();

  const { data } = await untyped(supabase)
    .from('contracts')
    .select('id, contract_number, title, total_price, status, created_at, pdf_url, docx_url')
    .eq('client_id', viewer.id)
    .order('created_at', { ascending: false });

  const contracts = ((data ?? []) as unknown as Row[]);

  return (
    <div>
      <PageHeader eyebrow="Klientská zóna" title="Smlouvy" subtitle="Přehled Vašich smluv s ARBIQ — PDF i DOCX ke stažení." />
      <div className="px-8 py-8">
        {contracts.length === 0 ? (
          <p className="text-sandstone text-sm bg-coffee p-8">Zatím žádné smlouvy.</p>
        ) : (
          <div className="bg-coffee overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-tobacco">
                  <Th>Číslo</Th>
                  <Th>Název</Th>
                  <th className="text-right font-mono text-[10px] uppercase tracking-widest text-sandstone px-6 py-3">Cena</th>
                  <Th>Vytvořeno</Th>
                  <Th>Stav</Th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {contracts.map((c, i) => (
                  <tr key={c.id} className={`border-b border-tobacco/50 ${i % 2 === 1 ? 'bg-coffee/40' : ''}`}>
                    <td className="px-6 py-4 font-mono text-caramel">{c.contract_number}</td>
                    <td className="px-6 py-4 text-sepia">{c.title}</td>
                    <td className="px-6 py-4 text-right text-moonlight font-medium">{formatMoney(c.total_price)}</td>
                    <td className="px-6 py-4 text-sandstone">{formatDate(c.created_at)}</td>
                    <td className="px-6 py-4"><StatusBadge kind="task" value={mapStatus(c.status)} /></td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {c.pdf_url && (
                        <Link
                          href={`/api/portal/contracts/${c.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-caramel hover:text-caramel-light text-xs font-mono uppercase tracking-widest mr-3"
                        >
                          <FileText size={13} /> PDF
                        </Link>
                      )}
                      {c.docx_url && (
                        <a
                          href={`/api/portal/contracts/${c.id}/docx`}
                          className="inline-flex items-center gap-1 text-caramel hover:text-caramel-light text-xs font-mono uppercase tracking-widest"
                        >
                          <FileDown size={13} /> DOCX
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left font-mono text-[10px] uppercase tracking-widest text-sandstone px-6 py-3">{children}</th>;
}

function mapStatus(s: string): string {
  switch (s) {
    case 'koncept': return 'todo';
    case 'poslano': return 'doing';
    case 'podepsano': return 'done';
    case 'odmítnuto':
    case 'zruseno': return 'cancelled';
    default: return s;
  }
}
