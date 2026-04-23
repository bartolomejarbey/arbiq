'use client';

import { useState, useTransition, useMemo } from 'react';
import { Plus, Check, Ban } from 'lucide-react';
import StatusBadge from '@/components/portal/StatusBadge';
import { formatDate, formatMoney } from '@/lib/formatters';
import { createInvoice, markInvoicePaid, cancelInvoice } from '@/lib/actions/invoices';

type Row = {
  id: string;
  invoice_number: string;
  amount: number;
  description: string | null;
  issued_at: string;
  due_date: string;
  status: string;
  client_id: string;
  client: { full_name: string; email: string } | null;
  project: { id: string; name: string } | null;
};

type ClientOpt = { id: string; full_name: string };
type ProjectOpt = { id: string; name: string; client_id: string };

const inputClass =
  'w-full bg-espresso border border-tobacco px-3 py-2 text-moonlight focus:border-caramel focus:outline-none transition-colors';
const labelClass = 'font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-1.5';

export default function InvoicesAdminClient({
  invoices,
  clients,
  projects,
}: {
  invoices: Row[];
  clients: ClientOpt[];
  projects: ProjectOpt[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<string>('');

  const projectsForClient = useMemo(
    () => projects.filter((p) => !selectedClient || p.client_id === selectedClient),
    [projects, selectedClient],
  );

  function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const res = await createInvoice(fd);
      if (!res.ok) setError(res.error);
      else { form.reset(); setOpen(false); setSelectedClient(''); }
    });
  }

  function handlePaid(id: string) {
    startTransition(() => { void markInvoicePaid(id); });
  }

  function handleCancel(id: string) {
    if (!confirm('Stornovat fakturu?')) return;
    startTransition(() => { void cancelInvoice(id); });
  }

  return (
    <div className="space-y-6">
      {!open ? (
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 bg-caramel text-espresso px-4 py-2.5 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all">
          <Plus size={14} /> Nová faktura
        </button>
      ) : (
        <form onSubmit={onCreate} className="bg-coffee p-6 space-y-4">
          <h3 className="font-display italic text-xl text-moonlight">Nová faktura</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="i_client_id">Klient</label>
              <select id="i_client_id" name="client_id" required className={inputClass} value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}>
                <option value="" disabled>— vyberte —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="i_project_id">Projekt (volitelné)</label>
              <select id="i_project_id" name="project_id" className={inputClass} defaultValue="">
                <option value="">— bez projektu —</option>
                {projectsForClient.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass} htmlFor="i_amount">Částka (Kč)</label>
              <input id="i_amount" name="amount" required inputMode="numeric" placeholder="15000" className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="i_issued_at">Vystaveno</label>
              <input id="i_issued_at" name="issued_at" type="date" defaultValue={new Date().toISOString().slice(0,10)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="i_due_date">Splatnost</label>
              <input id="i_due_date" name="due_date" type="date" required className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass} htmlFor="i_description">Popis</label>
            <textarea id="i_description" name="description" rows={2} className={`${inputClass} resize-none`} />
          </div>
          {error && <p className="text-rust text-xs font-mono">{error}</p>}
          <div className="flex items-center gap-3">
            <button type="submit" disabled={pending} className="bg-caramel text-espresso px-5 py-2.5 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all disabled:opacity-50">
              {pending ? 'Vytvářím…' : 'Vytvořit fakturu'}
            </button>
            <button type="button" onClick={() => { setOpen(false); setSelectedClient(''); }} className="text-sandstone hover:text-moonlight text-xs font-mono uppercase tracking-widest">Zrušit</button>
          </div>
        </form>
      )}

      <div className="bg-coffee overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-tobacco">
              <Th>Číslo</Th><Th>Klient</Th><Th>Popis</Th>
              <th className="text-right font-mono text-[10px] uppercase tracking-widest text-sandstone px-4 py-3">Částka</th>
              <Th>Vystaveno</Th><Th>Splatnost</Th><Th>Stav</Th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 && (
              <tr><td colSpan={8} className="text-center text-sandstone py-12">Zatím žádné faktury.</td></tr>
            )}
            {invoices.map((inv, i) => (
              <tr key={inv.id} className={`border-b border-tobacco/50 hover:bg-tobacco/30 ${i % 2 === 1 ? 'bg-coffee/40' : ''}`}>
                <td className="px-4 py-3 font-mono text-caramel">{inv.invoice_number}</td>
                <td className="px-4 py-3 text-sepia">{inv.client?.full_name ?? '—'}</td>
                <td className="px-4 py-3 text-sepia max-w-xs truncate">{inv.description ?? '—'}</td>
                <td className="px-4 py-3 text-right text-moonlight">{formatMoney(inv.amount)}</td>
                <td className="px-4 py-3 text-sandstone whitespace-nowrap">{formatDate(inv.issued_at)}</td>
                <td className="px-4 py-3 text-sandstone whitespace-nowrap">{formatDate(inv.due_date)}</td>
                <td className="px-4 py-3"><StatusBadge kind="invoice" value={inv.status} /></td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {inv.status !== 'zaplaceno' && inv.status !== 'zruseno' && (
                    <button onClick={() => handlePaid(inv.id)} disabled={pending} className="text-olive hover:text-caramel mr-3 disabled:opacity-50" title="Označit jako zaplacené">
                      <Check size={14} />
                    </button>
                  )}
                  {inv.status !== 'zaplaceno' && inv.status !== 'zruseno' && (
                    <button onClick={() => handleCancel(inv.id)} disabled={pending} className="text-sandstone hover:text-rust disabled:opacity-50" title="Stornovat">
                      <Ban size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left font-mono text-[10px] uppercase tracking-widest text-sandstone px-4 py-3">{children}</th>;
}
