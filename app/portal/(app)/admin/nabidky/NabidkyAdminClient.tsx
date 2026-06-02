'use client';

import { useState, useTransition, useMemo } from 'react';
import { Plus, Check, Ban, FileText, RefreshCw, Trash2, FileSignature } from 'lucide-react';
import StatusBadge from '@/components/portal/StatusBadge';
import { formatDate, formatMoney } from '@/lib/formatters';
import {
  createQuote,
  regenerateQuotePdf,
  markQuoteAccepted,
  cancelQuote,
  convertQuoteToContract,
} from '@/lib/actions/quotes';

type Row = {
  id: string;
  quote_number: string;
  title: string;
  total_price: number;
  status: string;
  valid_until: string;
  created_at: string;
  pdf_url: string | null;
  client_id: string;
  client: { full_name: string; email: string } | null;
  project: { id: string; name: string } | null;
};

type ClientOpt = { id: string; full_name: string; email: string };
type ProjectOpt = { id: string; name: string; client_id: string };

type ItemDraft = {
  id: string;
  label: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
};

const inputClass =
  'w-full bg-espresso border border-tobacco px-3 py-2 text-moonlight focus:border-caramel focus:outline-none transition-colors';
const labelClass = 'font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-1.5';

function newItem(): ItemDraft {
  return {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Math.random()),
    label: '',
    description: '',
    quantity: 1,
    unit: 'ks',
    unit_price: 0,
  };
}

export default function NabidkyAdminClient({
  quotes,
  clients,
  projects,
}: {
  quotes: Row[];
  clients: ClientOpt[];
  projects: ProjectOpt[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState('');
  const [items, setItems] = useState<ItemDraft[]>([newItem()]);

  const projectsForClient = useMemo(
    () => projects.filter((p) => !selectedClient || p.client_id === selectedClient),
    [projects, selectedClient],
  );

  const totalSum = items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0);

  function updateItem(id: string, key: keyof ItemDraft, value: string | number) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [key]: value } : it)));
  }
  function removeItem(id: string) {
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.id !== id) : prev));
  }
  function addItem() {
    setItems((prev) => [...prev, newItem()]);
  }

  function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (items.length === 0 || items.every((i) => !i.label.trim())) {
      setError('Přidej alespoň jednu položku.');
      return;
    }
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set(
      'items',
      JSON.stringify(
        items
          .filter((it) => it.label.trim().length > 0)
          .map((it) => ({
            label: it.label.trim(),
            description: it.description.trim() || null,
            quantity: Number(it.quantity) || 1,
            unit: it.unit.trim() || 'ks',
            unit_price: Number(it.unit_price) || 0,
          })),
      ),
    );
    startTransition(async () => {
      const res = await createQuote(fd);
      if (!res.ok) setError(res.error);
      else {
        form.reset();
        setOpen(false);
        setSelectedClient('');
        setItems([newItem()]);
      }
    });
  }

  function handleAccept(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await markQuoteAccepted(id);
      if (!res.ok) setError(res.error);
    });
  }

  function handleCancel(id: string) {
    if (!confirm('Zrušit nabídku?')) return;
    setError(null);
    startTransition(async () => {
      const res = await cancelQuote(id);
      if (!res.ok) setError(res.error);
    });
  }

  function handleRegen(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await regenerateQuotePdf(id);
      if (!res.ok) setError(`Regenerace selhala: ${res.error}`);
    });
  }

  function handleConvert(id: string) {
    if (!confirm('Převést tuto nabídku na smlouvu o dílo? Předvyplní se z položek nabídky.')) return;
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const res = await convertQuoteToContract(id);
      if (!res.ok) setError(res.error);
      else setNotice('Smlouva vytvořena z nabídky — najdete ji v sekci Smlouvy.');
    });
  }

  return (
    <div className="space-y-6">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 bg-caramel text-espresso px-4 py-2.5 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all"
        >
          <Plus size={14} /> Nová cenová nabídka
        </button>
      ) : (
        <form onSubmit={onCreate} className="bg-coffee p-6 space-y-5">
          <h3 className="font-display italic text-xl text-moonlight">Nová cenová nabídka</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="q_client_id">Klient *</label>
              <select
                id="q_client_id"
                name="client_id"
                required
                className={inputClass}
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
              >
                <option value="" disabled>— vyberte klienta —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="q_project_id">Projekt (volitelné)</label>
              <select id="q_project_id" name="project_id" className={inputClass} defaultValue="">
                <option value="">— bez projektu —</option>
                {projectsForClient.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="q_title">Název nabídky *</label>
            <input
              id="q_title"
              name="title"
              required
              placeholder="např. Webové stránky pro GATMA stav s.r.o"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="q_intro">Sales intro (volitelné, kursívou v hlavičce)</label>
            <textarea
              id="q_intro"
              name="intro_text"
              rows={2}
              placeholder="Děkujeme za projevený zájem. V nabídce najdete kompletní rozsah řešení a podmínky spolupráce."
              className={`${inputClass} resize-y`}
            />
          </div>

          {/* ITEMS */}
          <div className="space-y-3 border-t border-tobacco pt-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-caramel">Položky *</span>
              <span className="font-mono text-xs text-moonlight">Celkem: {formatMoney(totalSum)}</span>
            </div>
            {items.map((it) => (
              <div key={it.id} className="bg-espresso p-3 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_80px_120px_120px_30px] gap-2">
                  <input
                    placeholder="Název položky"
                    value={it.label}
                    onChange={(e) => updateItem(it.id, 'label', e.target.value)}
                    className={inputClass}
                  />
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="Množ."
                    value={it.quantity}
                    onChange={(e) => updateItem(it.id, 'quantity', Number(e.target.value))}
                    className={inputClass}
                  />
                  <input
                    placeholder="Jedn."
                    value={it.unit}
                    onChange={(e) => updateItem(it.id, 'unit', e.target.value)}
                    className={inputClass}
                  />
                  <input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="Cena/jedn"
                    value={it.unit_price}
                    onChange={(e) => updateItem(it.id, 'unit_price', Number(e.target.value))}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(it.id)}
                    disabled={items.length === 1}
                    className="text-sandstone hover:text-rust disabled:opacity-30"
                    title="Odebrat řádek"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <input
                  placeholder="Detailní popis (volitelné, max 500 znaků)"
                  value={it.description}
                  onChange={(e) => updateItem(it.id, 'description', e.target.value)}
                  className={inputClass}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-1 text-caramel hover:text-caramel-light font-mono text-xs uppercase tracking-widest"
            >
              <Plus size={12} /> Přidat řádek
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-tobacco pt-4">
            <div>
              <label className={labelClass} htmlFor="q_payment_terms">Platební podmínky</label>
              <input
                id="q_payment_terms"
                name="payment_terms"
                defaultValue="50 % záloha při akceptaci, 50 % po předání díla"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="q_deadline_days">Termín dodání (dnů)</label>
              <input id="q_deadline_days" name="deadline_days" type="number" min="1" max="365" defaultValue={14} className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="q_valid_days">Platnost (dnů)</label>
              <input id="q_valid_days" name="valid_days" type="number" min="1" max="365" defaultValue={30} className={inputClass} />
            </div>
          </div>

          {error && <p className="text-rust text-xs font-mono">{error}</p>}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="bg-caramel text-espresso px-5 py-2.5 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all disabled:opacity-50"
            >
              {pending ? 'Generuji PDF…' : 'Vytvořit nabídku'}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setSelectedClient(''); setItems([newItem()]); }}
              className="text-sandstone hover:text-moonlight text-xs font-mono uppercase tracking-widest"
            >
              Zrušit
            </button>
          </div>
        </form>
      )}

      {(notice || (error && !open)) && (
        <div className={`p-4 text-sm font-mono ${error ? 'bg-rust/10 border border-rust/40 text-rust' : 'bg-olive/10 border border-olive/40 text-olive'}`}>
          {error ?? notice}
        </div>
      )}

      <div className="bg-coffee overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-tobacco">
              <Th>Číslo</Th>
              <Th>Klient</Th>
              <Th>Název</Th>
              <th className="text-right font-mono text-[10px] uppercase tracking-widest text-sandstone px-4 py-3">Cena</th>
              <Th>Platí do</Th>
              <Th>Stav</Th>
              <th />
            </tr>
          </thead>
          <tbody>
            {quotes.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-sandstone py-12">Zatím žádné nabídky.</td>
              </tr>
            )}
            {quotes.map((q, i) => (
              <tr key={q.id} className={`border-b border-tobacco/50 hover:bg-tobacco/30 ${i % 2 === 1 ? 'bg-coffee/40' : ''}`}>
                <td className="px-4 py-3 font-mono text-caramel">{q.quote_number}</td>
                <td className="px-4 py-3 text-sepia">{q.client?.full_name ?? '—'}</td>
                <td className="px-4 py-3 text-sepia max-w-xs truncate">{q.title}</td>
                <td className="px-4 py-3 text-right text-moonlight">{formatMoney(q.total_price)}</td>
                <td className="px-4 py-3 text-sandstone whitespace-nowrap">{formatDate(q.valid_until)}</td>
                <td className="px-4 py-3"><StatusBadge kind="task" value={mapStatus(q.status)} /></td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {q.pdf_url ? (
                    <>
                      <a
                        href={`/api/portal/quotes/${q.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-caramel hover:text-caramel-light text-xs font-mono uppercase tracking-widest mr-2"
                        title="Otevřít PDF"
                      >
                        <FileText size={13} /> PDF
                      </a>
                      <button
                        onClick={() => handleRegen(q.id)}
                        disabled={pending}
                        className="inline-flex items-center text-sandstone hover:text-caramel mr-3 disabled:opacity-50"
                        title="Přegenerovat PDF"
                      >
                        <RefreshCw size={11} className={pending ? 'animate-spin' : ''} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleRegen(q.id)}
                      disabled={pending}
                      className="inline-flex items-center gap-1 text-rust hover:text-caramel-light text-xs font-mono uppercase tracking-widest mr-3 disabled:opacity-50"
                      title="Regenerovat PDF"
                    >
                      <RefreshCw size={13} className={pending ? 'animate-spin' : ''} /> Regen PDF
                    </button>
                  )}
                  {q.status !== 'zruseno' && q.status !== 'expirovano' && (
                    <button
                      onClick={() => handleConvert(q.id)}
                      disabled={pending}
                      className="text-caramel hover:text-caramel-light mr-2 disabled:opacity-50"
                      title="Převést na smlouvu o dílo"
                    >
                      <FileSignature size={14} />
                    </button>
                  )}
                  {q.status !== 'akceptovano' && q.status !== 'zruseno' && (
                    <>
                      <button
                        onClick={() => handleAccept(q.id)}
                        disabled={pending}
                        className="text-olive hover:text-caramel mr-2 disabled:opacity-50"
                        title="Označit jako akceptováno"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => handleCancel(q.id)}
                        disabled={pending}
                        className="text-sandstone hover:text-rust disabled:opacity-50"
                        title="Zrušit"
                      >
                        <Ban size={14} />
                      </button>
                    </>
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

function mapStatus(s: string): string {
  switch (s) {
    case 'koncept': return 'todo';
    case 'poslano': return 'doing';
    case 'akceptovano': return 'done';
    case 'odmitnuto':
    case 'zruseno':
    case 'expirovano': return 'cancelled';
    default: return s;
  }
}
