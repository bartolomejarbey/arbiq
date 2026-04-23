import { Download } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatDate, formatMoney } from '@/lib/formatters';

export type InvoiceRow = {
  id: string;
  invoice_number: string;
  amount: number;
  description: string | null;
  issued_at: string;
  due_date: string;
  paid_at: string | null;
  status: string;
  pdf_url: string | null;
};

export default function InvoiceTable({ invoices }: { invoices: InvoiceRow[] }) {
  if (invoices.length === 0) {
    return <p className="text-sandstone text-sm px-8 py-12">Zatím žádné faktury.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-tobacco">
            <th className="text-left font-mono text-[10px] uppercase tracking-widest text-sandstone px-6 py-3">Číslo</th>
            <th className="text-left font-mono text-[10px] uppercase tracking-widest text-sandstone px-6 py-3">Popis</th>
            <th className="text-right font-mono text-[10px] uppercase tracking-widest text-sandstone px-6 py-3">Částka</th>
            <th className="text-left font-mono text-[10px] uppercase tracking-widest text-sandstone px-6 py-3">Vystaveno</th>
            <th className="text-left font-mono text-[10px] uppercase tracking-widest text-sandstone px-6 py-3">Splatnost</th>
            <th className="text-left font-mono text-[10px] uppercase tracking-widest text-sandstone px-6 py-3">Stav</th>
            <th className="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv, i) => (
            <tr
              key={inv.id}
              className={`border-b border-tobacco/50 ${i % 2 === 1 ? 'bg-coffee/40' : ''}`}
            >
              <td className="px-6 py-4 font-mono text-caramel">{inv.invoice_number}</td>
              <td className="px-6 py-4 text-sepia max-w-md truncate">{inv.description ?? '—'}</td>
              <td className="px-6 py-4 text-right text-moonlight font-medium">{formatMoney(inv.amount)}</td>
              <td className="px-6 py-4 text-sandstone">{formatDate(inv.issued_at)}</td>
              <td className="px-6 py-4 text-sandstone">{formatDate(inv.due_date)}</td>
              <td className="px-6 py-4"><StatusBadge kind="invoice" value={inv.status} /></td>
              <td className="px-6 py-4 text-right">
                {inv.pdf_url && (
                  <a
                    href={inv.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-caramel hover:text-caramel-light text-xs font-mono uppercase tracking-widest"
                  >
                    <Download size={12} /> PDF
                  </a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
