import { redirect } from 'next/navigation';
import { createClient } from "@/lib/supabase/server";
import { requireViewer } from "@/lib/supabase/viewer";
import PageHeader from '@/components/portal/PageHeader';
import InvoiceTable, { type InvoiceRow } from '@/components/portal/InvoiceTable';
import StatsCard from '@/components/portal/StatsCard';
import { formatMoney } from '@/lib/formatters';

export const dynamic = 'force-dynamic';

export default async function InvoicesPage() {
  const viewer = await requireViewer();
  const supabase = await createClient();
  const user = viewer;

  const { data } = await supabase
    .from('invoices')
    .select('id, invoice_number, amount, description, issued_at, due_date, paid_at, status, pdf_url')
    .eq('client_id', user.id)
    .order('issued_at', { ascending: false });

  const invoices = ((data ?? []) as unknown as InvoiceRow[]);

  const paid = invoices.filter((i) => i.status === 'zaplaceno').reduce((s, i) => s + Number(i.amount), 0);
  const waiting = invoices.filter((i) => i.status === 'ceka').reduce((s, i) => s + Number(i.amount), 0);
  const overdue = invoices.filter((i) => i.status === 'po_splatnosti').reduce((s, i) => s + Number(i.amount), 0);

  return (
    <div>
      <PageHeader eyebrow="Klientská zóna" title="Faktury" subtitle="Přehled vystavených faktur a jejich stavu." />
      <div className="px-8 py-8 space-y-8">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard label="Zaplaceno" value={formatMoney(paid)} tone="success" />
          <StatsCard label="Čeká na zaplacení" value={formatMoney(waiting)} tone="accent" />
          <StatsCard label="Po splatnosti" value={formatMoney(overdue)} tone={overdue > 0 ? 'danger' : 'default'} />
        </section>
        <section className="bg-coffee">
          <InvoiceTable invoices={invoices} />
        </section>
      </div>
    </div>
  );
}
