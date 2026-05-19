'use client';

import { useState, useTransition, useMemo } from 'react';
import { Plus, Check, Ban, FileDown, FileText, RefreshCw } from 'lucide-react';
import StatusBadge from '@/components/portal/StatusBadge';
import { formatDate, formatMoney } from '@/lib/formatters';
import { createContract, markContractSigned, cancelContract, regenerateContractDocs } from '@/lib/actions/contracts';

type Row = {
  id: string;
  contract_number: string;
  title: string;
  total_price: number;
  status: string;
  created_at: string;
  pdf_url: string | null;
  docx_url: string | null;
  client_id: string;
  client: { full_name: string; email: string } | null;
  project: { id: string; name: string } | null;
};

type ClientOpt = { id: string; full_name: string; email: string };
type ProjectOpt = { id: string; name: string; client_id: string };

const inputClass =
  'w-full bg-espresso border border-tobacco px-3 py-2 text-moonlight focus:border-caramel focus:outline-none transition-colors';
const labelClass = 'font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-1.5';

export default function ContractsAdminClient({
  contracts,
  clients,
  projects,
}: {
  contracts: Row[];
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
      const res = await createContract(fd);
      if (!res.ok) setError(res.error);
      else {
        form.reset();
        setOpen(false);
        setSelectedClient('');
      }
    });
  }

  function handleSigned(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await markContractSigned(id);
      if (!res.ok) setError(res.error);
    });
  }

  function handleCancel(id: string) {
    if (!confirm('Zrušit smlouvu?')) return;
    setError(null);
    startTransition(async () => {
      const res = await cancelContract(id);
      if (!res.ok) setError(res.error);
    });
  }

  function handleRegen(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await regenerateContractDocs(id);
      if (!res.ok) setError(`Regenerace selhala: ${res.error}`);
    });
  }

  return (
    <div className="space-y-6">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 bg-caramel text-espresso px-4 py-2.5 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all"
        >
          <Plus size={14} /> Nová smlouva o dílo
        </button>
      ) : (
        <form onSubmit={onCreate} className="bg-coffee p-6 space-y-5">
          <h3 className="font-display italic text-xl text-moonlight">Nová smlouva o dílo</h3>
          <p className="text-sandstone text-xs">Vyplň jen klíčové údaje — zbytek (čl. III–XII, NDA, podpisy) doplní šablona automaticky.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="s_client_id">Klient *</label>
              <select id="s_client_id" name="client_id" required className={inputClass} value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}>
                <option value="" disabled>— vyberte klienta —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="s_project_id">Projekt (volitelné)</label>
              <select id="s_project_id" name="project_id" className={inputClass} defaultValue="">
                <option value="">— bez projektu —</option>
                {projectsForClient.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="s_title">Název smlouvy *</label>
            <input
              id="s_title"
              name="title"
              required
              placeholder="např. Webová prezentace pro Prosner s.r.o."
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="s_subject">Předmět díla *</label>
            <input
              id="s_subject"
              name="subject"
              required
              placeholder="Vytvoření webové prezentace, e-shopu, aplikace…"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="s_scope_bullets">Specifikace díla (jedna odrážka per řádek)</label>
            <textarea
              id="s_scope_bullets"
              name="scope_bullets"
              rows={6}
              placeholder={'Responzivní web s 7 podstránkami\nMulti-jazyk CZ/EN/DE/PL\nKalkulačka ceny dopravy\nKontaktní formulář\nZákladní on-page SEO'}
              className={`${inputClass} resize-y`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className={labelClass} htmlFor="s_total_price">Celková cena (Kč) *</label>
              <input id="s_total_price" name="total_price" required type="number" min="1" step="1" placeholder="27000" className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="s_deposit_percent">Záloha (%)</label>
              <input id="s_deposit_percent" name="deposit_percent" type="number" min="0" max="100" step="1" defaultValue={50} className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="s_deadline_days">Termín (dnů od podpisu)</label>
              <input id="s_deadline_days" name="deadline_days" type="number" min="1" max="365" defaultValue={14} className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="s_warranty_months">Záruka (měsíců)</label>
              <input id="s_warranty_months" name="warranty_months" type="number" min="0" max="36" defaultValue={3} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass} htmlFor="s_hourly_rate">Sazba vícepráce (Kč / hod)</label>
              <input id="s_hourly_rate" name="hourly_rate" type="number" min="100" step="1" defaultValue={900} className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="s_monthly_fee">Měsíční paušál (volitelné)</label>
              <input id="s_monthly_fee" name="monthly_fee" type="number" min="0" step="1" placeholder="např. 7500" className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="s_place_of_signing">Místo podpisu</label>
              <input id="s_place_of_signing" name="place_of_signing" defaultValue="Bělči" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-tobacco pt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="has_nda" defaultChecked className="w-4 h-4 accent-caramel" />
              <span className="text-sepia text-sm">Zahrnout NDA článek</span>
            </label>
            <div>
              <label className={labelClass} htmlFor="s_nda_penalty">Pokuta za porušení NDA (Kč)</label>
              <input id="s_nda_penalty" name="nda_penalty" type="number" min="0" step="1" defaultValue={100000} className={inputClass} />
            </div>
          </div>

          <div className="border-t border-tobacco pt-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="has_exclusivity" className="w-4 h-4 accent-caramel" />
              <span className="text-sepia text-sm">Zahrnout závazek exkluzivity</span>
            </label>
            <div>
              <label className={labelClass} htmlFor="s_exclusivity_clause">Text exkluzivity (vyplň pokud má smysl)</label>
              <textarea
                id="s_exclusivity_clause"
                name="exclusivity_clause"
                rows={3}
                placeholder="Zhotovitel se zavazuje po dobu trvání smlouvy neposkytovat technologické řešení typu díla přímým konkurentům Objednatele…"
                className={`${inputClass} resize-y`}
              />
            </div>
          </div>

          {error && <p className="text-rust text-xs font-mono">{error}</p>}

          <div className="flex items-center gap-3">
            <button type="submit" disabled={pending} className="bg-caramel text-espresso px-5 py-2.5 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all disabled:opacity-50">
              {pending ? 'Generuji PDF + DOCX…' : 'Vytvořit smlouvu'}
            </button>
            <button type="button" onClick={() => { setOpen(false); setSelectedClient(''); }} className="text-sandstone hover:text-moonlight text-xs font-mono uppercase tracking-widest">
              Zrušit
            </button>
          </div>
        </form>
      )}

      <div className="bg-coffee overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-tobacco">
              <Th>Číslo</Th>
              <Th>Klient</Th>
              <Th>Název</Th>
              <th className="text-right font-mono text-[10px] uppercase tracking-widest text-sandstone px-4 py-3">Cena</th>
              <Th>Vytvořeno</Th>
              <Th>Stav</Th>
              <th />
            </tr>
          </thead>
          <tbody>
            {contracts.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-sandstone py-12">Zatím žádné smlouvy.</td>
              </tr>
            )}
            {contracts.map((c, i) => (
              <tr key={c.id} className={`border-b border-tobacco/50 hover:bg-tobacco/30 ${i % 2 === 1 ? 'bg-coffee/40' : ''}`}>
                <td className="px-4 py-3 font-mono text-caramel">{c.contract_number}</td>
                <td className="px-4 py-3 text-sepia">{c.client?.full_name ?? '—'}</td>
                <td className="px-4 py-3 text-sepia max-w-xs truncate">{c.title}</td>
                <td className="px-4 py-3 text-right text-moonlight">{formatMoney(c.total_price)}</td>
                <td className="px-4 py-3 text-sandstone whitespace-nowrap">{formatDate(c.created_at)}</td>
                <td className="px-4 py-3"><StatusBadge kind="task" value={mapStatus(c.status)} /></td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {c.pdf_url ? (
                    <>
                      <a
                        href={`/api/portal/contracts/${c.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-caramel hover:text-caramel-light text-xs font-mono uppercase tracking-widest mr-2"
                        title="Zobrazit PDF"
                      >
                        <FileText size={13} /> PDF
                      </a>
                      <button
                        onClick={() => handleRegen(c.id)}
                        disabled={pending}
                        className="inline-flex items-center text-sandstone hover:text-caramel mr-3 disabled:opacity-50 align-middle"
                        title="Přegenerovat PDF + DOCX (přepíše stávající)"
                      >
                        <RefreshCw size={11} className={pending ? 'animate-spin' : ''} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleRegen(c.id)}
                      disabled={pending}
                      className="inline-flex items-center gap-1 text-rust hover:text-caramel-light text-xs font-mono uppercase tracking-widest mr-3 disabled:opacity-50"
                      title="PDF chybí — regenerovat"
                    >
                      <RefreshCw size={13} className={pending ? 'animate-spin' : ''} /> Regen PDF
                    </button>
                  )}
                  {c.docx_url && (
                    <a
                      href={`/api/portal/contracts/${c.id}/docx`}
                      className="inline-flex items-center gap-1 text-caramel hover:text-caramel-light text-xs font-mono uppercase tracking-widest mr-3"
                      title="Stáhnout DOCX"
                    >
                      <FileDown size={13} /> DOCX
                    </a>
                  )}
                  {c.status !== 'podepsano' && c.status !== 'zruseno' && (
                    <>
                      <button
                        onClick={() => handleSigned(c.id)}
                        disabled={pending}
                        className="text-olive hover:text-caramel mr-2 disabled:opacity-50"
                        title="Označit jako podepsanou"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => handleCancel(c.id)}
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
    case 'podepsano': return 'done';
    case 'odmítnuto':
    case 'zruseno': return 'cancelled';
    default: return s;
  }
}
