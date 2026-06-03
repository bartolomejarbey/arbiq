import { redirect } from 'next/navigation';
import { Download } from 'lucide-react';
import { createClient } from "@/lib/supabase/server";
import { requireViewer } from "@/lib/supabase/viewer";
import PageHeader from '@/components/portal/PageHeader';
import StatsCard from '@/components/portal/StatsCard';
import { formatMoney } from '@/lib/formatters';
import InvoicesAdminClient from './InvoicesAdminClient';

export const dynamic = 'force-dynamic';

type Row = {
  id: string;
  invoice_number: string;
  kind: string;
  amount: number;
  description: string | null;
  issued_at: string;
  due_date: string;
  status: string;
  pdf_url: string | null;
  shared_at: string | null;
  client_id: string | null;
  client: { full_name: string; email: string; billing_email: string | null; company: string | null; ico: string | null; parent_client_id: string | null } | null;
  customer_override: { full_name?: string | null; company?: string | null; email?: string | null } | null;
  project: { id: string; name: string } | null;
};

type ClientOpt = { id: string; full_name: string };

type ProjectOpt = { id: string; name: string; client_id: string };

export default async function FakturyAdminPage() {
  const viewer = await requireViewer();
  const supabase = await createClient();
  const user = viewer;

  const [{ data: invRows }, { data: clients }, { data: projects }] = await Promise.all([
    supabase
      .from('invoices')
      .select('id, invoice_number, kind, amount, description, issued_at, due_date, status, pdf_url, shared_at, client_id, customer_override, client:profiles!invoices_client_id_fkey(full_name, email, billing_email, company, ico, parent_client_id), project:projects(id, name)')
      .order('issued_at', { ascending: false }),
    supabase.from('profiles').select('id, full_name').eq('role', 'klient').order('full_name'),
    supabase.from('projects').select('id, name, client_id').order('name'),
  ]);

  const invoices = ((invRows ?? []) as unknown as Row[]);
  const totals = {
    paid: invoices.filter((i) => i.status === 'zaplaceno').reduce((s, i) => s + Number(i.amount), 0),
    waiting: invoices.filter((i) => i.status === 'ceka').reduce((s, i) => s + Number(i.amount), 0),
    overdue: invoices.filter((i) => i.status === 'po_splatnosti').reduce((s, i) => s + Number(i.amount), 0),
  };

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Faktury"
        actions={
          <a
            href="/api/portal/invoices/export"
            className="inline-flex items-center gap-2 bg-coffee border border-tobacco hover:border-caramel text-sepia px-4 py-2.5 font-mono text-xs uppercase tracking-widest transition-all"
          >
            <Download size={14} /> Export CSV
          </a>
        }
      />
      <div className="px-4 md:px-8 py-8 space-y-8">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard label="Zaplaceno (celkem)" value={formatMoney(totals.paid)} tone="success" />
          <StatsCard label="Čeká" value={formatMoney(totals.waiting)} tone="accent" />
          <StatsCard label="Po splatnosti" value={formatMoney(totals.overdue)} tone={totals.overdue > 0 ? 'danger' : 'default'} />
        </section>

        <InvoicesAdminClient
          invoices={invoices}
          clients={((clients ?? []) as unknown as ClientOpt[])}
          projects={((projects ?? []) as unknown as ProjectOpt[])}
        />
      </div>
    </div>
  );
}
