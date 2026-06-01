'use client';

import { useState, useTransition, useMemo } from 'react';
import { Plus, Check, Ban, FileText, RefreshCw, ChevronDown, Send } from 'lucide-react';
import StatusBadge from '@/components/portal/StatusBadge';
import { formatDate, formatMoney } from '@/lib/formatters';
import { createInvoice, markInvoicePaid, cancelInvoice, regenerateInvoicePdf, sendInvoiceToClient } from '@/lib/actions/invoices';
import IcoLookup from '@/components/portal/IcoLookup';

type Row = {
  id: string;
  invoice_number: string;
  amount: number;
  description: string | null;
  issued_at: string;
  due_date: string;
  status: string;
  pdf_url: string | null;
  shared_at: string | null;
  client_id: string | null;
  client: { full_name: string; email: string } | null;
  customer_override: { full_name?: string | null; company?: string | null } | null;
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
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [noClient, setNoClient] = useState(false);
  const [cust, setCust] = useState({
    full_name: '', company: '', ico: '', dic: '', street: '', city: '', email: '', phone: '',
  });
  const [sup, setSup] = useState({
    name: '', ico: '', dic: '', vat_payer: false, street: '', city: '',
  });

  const projectsForClient = useMemo(
    () => projects.filter((p) => !selectedClient || p.client_id === selectedClient),
    [projects, selectedClient],
  );

  function resetAll() {
    setOpen(false);
    setSelectedClient('');
    setNoClient(false);
    setCust({ full_name: '', company: '', ico: '', dic: '', street: '', city: '', email: '', phone: '' });
    setSup({ name: '', ico: '', dic: '', vat_payer: false, street: '', city: '' });
    setOverrideOpen(false);
  }

  function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (noClient) fd.delete('client_id');
    startTransition(async () => {
      const res = await createInvoice(fd);
      if (!res.ok) setError(res.error);
      else { form.reset(); resetAll(); }
    });
  }

  function handlePaid(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await markInvoicePaid(id);
      if (!res.ok) setError(res.error);
    });
  }

  function handleCancel(id: string) {
    if (!confirm('Stornovat fakturu?')) return;
    setError(null);
    startTransition(async () => {
      const res = await cancelInvoice(id);
      if (!res.ok) setError(res.error);
    });
  }

  function handleRegen(id: string) {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const res = await regenerateInvoicePdf(id);
      if (!res.ok) setError(`Regenerace PDF selhala: ${res.error}`);
    });
  }

  function handleSend(id: string) {
    if (!confirm('Poslat fakturu klientovi jako PDF přílohu e-mailu? Zároveň se zpřístupní v jeho zóně.')) return;
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const res = await sendInvoiceToClient(id);
      if (!res.ok) setError(res.error);
      else setNotice(`Faktura odeslána na ${res.sentTo}.`);
    });
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

          <div className="flex items-center gap-3 bg-espresso p-3 border border-tobacco">
            <input
              id="no_client_toggle"
              type="checkbox"
              name="no_client"
              checked={noClient}
              onChange={(e) => setNoClient(e.target.checked)}
              className="w-4 h-4 accent-caramel"
            />
            <label htmlFor="no_client_toggle" className="text-sepia text-sm cursor-pointer select-none">
              Není klient — vystavit jednorázově (odběratele vyplním ručně)
            </label>
          </div>

          {!noClient ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="i_client_id">Klient</label>
                <select id="i_client_id" name="client_id" required={!noClient} className={inputClass} value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}>
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
          ) : (
            <div className="bg-espresso p-4 space-y-3 border border-tobacco">
              <div className="font-mono text-[10px] uppercase tracking-widest text-caramel">Odběratel (jednorázový)</div>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 items-end">
                <div>
                  <label className={labelClass} htmlFor="cust_ico">IČO</label>
                  <input
                    id="cust_ico"
                    name="cust_ico"
                    value={cust.ico}
                    onChange={(e) => setCust((s) => ({ ...s, ico: e.target.value }))}
                    placeholder="21875570"
                    className={inputClass}
                  />
                </div>
                <IcoLookup
                  ico={cust.ico}
                  onResult={(d) => setCust((s) => ({
                    ...s,
                    ico: d.ico,
                    company: d.name ?? s.company,
                    full_name: s.full_name || (d.name ?? ''),
                    dic: d.dic ?? s.dic,
                    street: d.street ?? s.street,
                    city: d.city ?? s.city,
                  }))}
                  className="md:pb-0.5"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} htmlFor="cust_full_name">Jméno / Kontakt *</label>
                  <input id="cust_full_name" name="cust_full_name" required={noClient} value={cust.full_name} onChange={(e) => setCust((s) => ({ ...s, full_name: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="cust_company">Firma</label>
                  <input id="cust_company" name="cust_company" value={cust.company} onChange={(e) => setCust((s) => ({ ...s, company: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="cust_dic">DIČ</label>
                  <input id="cust_dic" name="cust_dic" value={cust.dic} onChange={(e) => setCust((s) => ({ ...s, dic: e.target.value }))} placeholder="CZ..." className={inputClass} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="cust_email">E-mail</label>
                  <input id="cust_email" name="cust_email" type="email" value={cust.email} onChange={(e) => setCust((s) => ({ ...s, email: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="cust_street">Ulice + č.p.</label>
                  <input id="cust_street" name="cust_street" value={cust.street} onChange={(e) => setCust((s) => ({ ...s, street: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="cust_city">Město + PSČ</label>
                  <input id="cust_city" name="cust_city" value={cust.city} onChange={(e) => setCust((s) => ({ ...s, city: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="cust_phone">Telefon</label>
                  <input id="cust_phone" name="cust_phone" value={cust.phone} onChange={(e) => setCust((s) => ({ ...s, phone: e.target.value }))} className={inputClass} />
                </div>
              </div>
            </div>
          )}
          <div>
            <label className={labelClass} htmlFor="i_invoice_number">Číslo faktury (volitelné)</label>
            <input
              id="i_invoice_number"
              name="invoice_number"
              placeholder="auto: FYYYYNNNNN"
              pattern="[A-Za-z0-9._/\-]+"
              title="Písmena, číslice, ._-/"
              className={inputClass}
            />
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

          {/* JINÝ DODAVATEL — collapsible override */}
          <div className="border-t border-tobacco pt-4">
            <button
              type="button"
              onClick={() => setOverrideOpen((v) => !v)}
              className="w-full flex items-center justify-between text-left font-mono text-[10px] uppercase tracking-widest text-caramel hover:text-caramel-light"
            >
              <span>Vystavit za jinou firmu (volitelné)</span>
              <ChevronDown size={14} className={`transition-transform ${overrideOpen ? 'rotate-180' : ''}`} />
            </button>
            {overrideOpen && (
              <div className="mt-3 space-y-3 bg-espresso p-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="use_supplier_override" defaultChecked className="w-4 h-4 accent-caramel" />
                  <span className="text-sepia text-xs">Použít tyto údaje místo defaultního dodavatele (Bartoloměj Rota / Arbiq.cz)</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 items-end">
                  <div>
                    <label className={labelClass} htmlFor="sup_ico">IČO</label>
                    <input id="sup_ico" name="sup_ico" value={sup.ico} onChange={(e) => setSup((s) => ({ ...s, ico: e.target.value }))} placeholder="21402027" className={inputClass} />
                  </div>
                  <IcoLookup
                    ico={sup.ico}
                    onResult={(d) => setSup((s) => ({
                      ...s,
                      ico: d.ico,
                      name: d.name ?? s.name,
                      dic: d.dic ?? s.dic,
                      vat_payer: d.vat_payer || s.vat_payer,
                      street: d.street ?? s.street,
                      city: d.city ?? s.city,
                    }))}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass} htmlFor="sup_name">Jméno / Firma</label>
                    <input id="sup_name" name="sup_name" value={sup.name} onChange={(e) => setSup((s) => ({ ...s, name: e.target.value }))} placeholder="např. Harotas s.r.o." className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="sup_dic">DIČ (pokud plátce)</label>
                    <input id="sup_dic" name="sup_dic" value={sup.dic} onChange={(e) => setSup((s) => ({ ...s, dic: e.target.value }))} placeholder="CZ…" className={inputClass} />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name="sup_vat_payer" checked={sup.vat_payer} onChange={(e) => setSup((s) => ({ ...s, vat_payer: e.target.checked }))} className="w-4 h-4 accent-caramel" />
                      <span className="text-sepia text-sm">Plátce DPH</span>
                    </label>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="sup_street">Ulice</label>
                    <input id="sup_street" name="sup_street" value={sup.street} onChange={(e) => setSup((s) => ({ ...s, street: e.target.value }))} placeholder="Školská 689/20" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="sup_city">Město + PSČ</label>
                    <input id="sup_city" name="sup_city" value={sup.city} onChange={(e) => setSup((s) => ({ ...s, city: e.target.value }))} placeholder="110 00 Praha" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="sup_bank_account">Číslo účtu</label>
                    <input id="sup_bank_account" name="sup_bank_account" placeholder="123456789/0100" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="sup_bank_name">Banka</label>
                    <input id="sup_bank_name" name="sup_bank_name" placeholder="Air Bank" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="sup_iban">IBAN (pro QR platbu)</label>
                    <input id="sup_iban" name="sup_iban" placeholder="CZ44 3030 0000 0031 4041 9018" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="sup_bic">BIC / SWIFT</label>
                    <input id="sup_bic" name="sup_bic" placeholder="AIRACZPP" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="sup_email">E-mail</label>
                    <input id="sup_email" name="sup_email" type="email" placeholder="info@firma.cz" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="sup_phone">Telefon</label>
                    <input id="sup_phone" name="sup_phone" placeholder="+420 …" className={inputClass} />
                  </div>
                </div>
                <p className="text-sandstone text-[10px] font-mono leading-relaxed">
                  Override platí jen pro tuhle fakturu. PDF + SPAYD QR vezme tyhle hodnoty místo výchozího dodavatele.
                  Pro permanentní změnu uprav <code>app_settings.dodavatel</code> v Supabase.
                </p>
              </div>
            )}
          </div>

          {error && <p className="text-rust text-xs font-mono">{error}</p>}
          <div className="flex items-center gap-3">
            <button type="submit" disabled={pending} className="bg-caramel text-espresso px-5 py-2.5 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all disabled:opacity-50">
              {pending ? 'Vytvářím + generuji PDF…' : 'Vytvořit fakturu'}
            </button>
            <button type="button" onClick={resetAll} className="text-sandstone hover:text-moonlight text-xs font-mono uppercase tracking-widest">Zrušit</button>
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
                <td className="px-4 py-3 text-sepia">
                  {inv.client?.full_name
                    ?? inv.customer_override?.company
                    ?? inv.customer_override?.full_name
                    ?? <span className="text-sandstone/50 italic">jednorázový</span>}
                </td>
                <td className="px-4 py-3 text-sepia max-w-xs truncate">{inv.description ?? '—'}</td>
                <td className="px-4 py-3 text-right text-moonlight">{formatMoney(inv.amount)}</td>
                <td className="px-4 py-3 text-sandstone whitespace-nowrap">{formatDate(inv.issued_at)}</td>
                <td className="px-4 py-3 text-sandstone whitespace-nowrap">{formatDate(inv.due_date)}</td>
                <td className="px-4 py-3"><StatusBadge kind="invoice" value={inv.status} /></td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {inv.pdf_url ? (
                    <>
                      <a
                        href={`/api/portal/invoices/${inv.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-caramel hover:text-caramel-light text-xs font-mono uppercase tracking-widest mr-2"
                        title="Otevřít PDF"
                      >
                        <FileText size={13} /> PDF
                      </a>
                      <button
                        onClick={() => handleRegen(inv.id)}
                        disabled={pending}
                        className="inline-flex items-center text-sandstone hover:text-caramel mr-3 disabled:opacity-50"
                        title="Přegenerovat PDF"
                      >
                        <RefreshCw size={11} className={pending ? 'animate-spin' : ''} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleRegen(inv.id)}
                      disabled={pending}
                      className="inline-flex items-center gap-1 text-rust hover:text-caramel-light text-xs font-mono uppercase tracking-widest mr-3 disabled:opacity-50"
                      title="PDF chybí — regenerovat"
                    >
                      <RefreshCw size={13} className={pending ? 'animate-spin' : ''} /> Regen PDF
                    </button>
                  )}
                  <button
                    onClick={() => handleSend(inv.id)}
                    disabled={pending}
                    className={`inline-flex items-center gap-1 text-xs font-mono uppercase tracking-widest mr-3 disabled:opacity-50 ${inv.shared_at ? 'text-olive hover:text-caramel-light' : 'text-caramel hover:text-caramel-light'}`}
                    title={inv.shared_at ? `Posláno ${formatDate(inv.shared_at)} — poslat znovu` : 'Poslat klientovi (PDF přílohou e-mailu)'}
                  >
                    <Send size={13} /> {inv.shared_at ? 'Posláno' : 'Poslat'}
                  </button>
                  {inv.status !== 'zaplaceno' && inv.status !== 'zruseno' && (
                    <button onClick={() => handlePaid(inv.id)} disabled={pending} className="text-olive hover:text-caramel mr-2 disabled:opacity-50" title="Označit jako zaplacené">
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
