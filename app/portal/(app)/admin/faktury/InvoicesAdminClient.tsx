'use client';

import { useState, useTransition, useMemo } from 'react';
import { Plus, Check, Ban, FileText, FileMinus, RefreshCw, ChevronDown, ChevronRight, Send, Download, Loader2, CheckSquare, Square, MinusSquare } from 'lucide-react';
import StatusBadge from '@/components/portal/StatusBadge';
import { formatDate, formatMoney } from '@/lib/formatters';
import { createInvoice, markInvoicePaid, cancelInvoice, regenerateInvoicePdf, sendInvoiceToClient, bulkSendInvoices, createCreditNote } from '@/lib/actions/invoices';
import IcoLookup from '@/components/portal/IcoLookup';

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

type Firma = { firmaId: string; label: string; subLabel: string | null; invoices: Row[]; total: number };
type PersonGroup = { personId: string; personName: string; firmy: Firma[]; total: number; count: number };

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

  function handleCreditNote(id: string, number: string) {
    const reason = window.prompt(`Vystavit dobropis k faktuře ${number}?\nDůvod (volitelné — objeví se na dokladu):`, '');
    if (reason === null) return; // zrušeno
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const res = await createCreditNote(id, reason.trim() || undefined);
      if (!res.ok) setError(`Dobropis se nepodařilo vystavit: ${res.error}`);
      else setNotice(`Dobropis k faktuře ${number} vystaven.`);
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

  function handleSend(id: string, defaultEmail: string) {
    const to = window.prompt('Komu poslat fakturu (PDF přílohou)? Adresu můžeš pro toto odeslání změnit:', defaultEmail);
    if (to === null) return; // zrušeno
    const trimmed = to.trim();
    if (!trimmed) { setError('Zadej e-mailovou adresu příjemce.'); return; }
    setError(null);
    setNotice(null);
    setSendingId(id);
    startTransition(async () => {
      const res = await sendInvoiceToClient(id, trimmed);
      if (!res.ok) setError(res.error);
      else setNotice(`Faktura odeslána na ${res.sentTo}.`);
      setSendingId(null);
    });
  }

  // ── Výběr + seskupení + hromadné akce ──────────────────────────────────
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState<null | 'zip' | 'send'>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const clientName = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of clients) m.set(c.id, c.full_name);
    return m;
  }, [clients]);

  // person (osoba) → firma → faktury
  const groups = useMemo<PersonGroup[]>(() => {
    const persons = new Map<string, { name: string; firmy: Map<string, Firma> }>();
    for (const inv of invoices) {
      let personId: string, personName: string, firmaId: string, label: string, subLabel: string | null;
      if (!inv.client_id) {
        personId = '__oneoff__';
        personName = 'Jednorázové faktury';
        const c = inv.customer_override;
        label = c?.company || c?.full_name || 'Bez odběratele';
        subLabel = c?.company && c?.full_name ? c.full_name : null;
        firmaId = `oneoff:${label}`;
      } else {
        const cl = inv.client;
        const firmaName = cl?.full_name ?? 'Klient';
        label = cl?.company || firmaName;
        subLabel = cl?.company ? firmaName : null;
        firmaId = inv.client_id;
        if (cl?.parent_client_id) {
          personId = cl.parent_client_id;
          personName = clientName.get(cl.parent_client_id) || firmaName;
        } else {
          personId = inv.client_id;
          personName = firmaName;
        }
      }
      let p = persons.get(personId);
      if (!p) { p = { name: personName, firmy: new Map() }; persons.set(personId, p); }
      let f = p.firmy.get(firmaId);
      if (!f) { f = { firmaId, label, subLabel, invoices: [], total: 0 }; p.firmy.set(firmaId, f); }
      f.invoices.push(inv);
      f.total += Number(inv.amount);
    }
    const arr: PersonGroup[] = [];
    for (const [personId, p] of persons) {
      const firmy = [...p.firmy.values()].sort((a, b) => a.label.localeCompare(b.label, 'cs'));
      arr.push({
        personId,
        personName: p.name,
        firmy,
        total: firmy.reduce((s, f) => s + f.total, 0),
        count: firmy.reduce((s, f) => s + f.invoices.length, 0),
      });
    }
    return arr.sort((a, b) =>
      a.personId === '__oneoff__' ? 1 : b.personId === '__oneoff__' ? -1 : a.personName.localeCompare(b.personName, 'cs'));
  }, [invoices, clientName]);

  const allIds = useMemo(() => invoices.map((i) => i.id), [invoices]);
  const selectedTotal = useMemo(
    () => invoices.filter((i) => selected.has(i.id)).reduce((s, i) => s + Number(i.amount), 0),
    [invoices, selected],
  );

  function toggleOne(id: string) {
    setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }
  function setMany(ids: string[], on: boolean) {
    setSelected((s) => { const n = new Set(s); for (const id of ids) { if (on) n.add(id); else n.delete(id); } return n; });
  }
  function checkState(ids: string[]): 'all' | 'some' | 'none' {
    const sel = ids.reduce((c, id) => c + (selected.has(id) ? 1 : 0), 0);
    return sel === 0 ? 'none' : sel === ids.length ? 'all' : 'some';
  }
  function toggleCollapse(id: string) {
    setCollapsed((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }

  async function handleBulkDownload() {
    const ids = [...selected];
    if (ids.length === 0) return;
    setBulkBusy('zip'); setError(null); setNotice(null);
    try {
      const res = await fetch('/api/portal/invoices/bulk-zip', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }),
      });
      if (!res.ok) { const j = await res.json().catch(() => ({})); setError(j.error || 'Stažení ZIP selhalo.'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `faktury-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      setNotice(`Staženo ${ids.length} faktur jako ZIP.`);
    } catch { setError('Stažení ZIP selhalo.'); }
    finally { setBulkBusy(null); }
  }

  function handleBulkSend() {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (!confirm(`Odeslat ${ids.length} faktur klientům (PDF přílohou na jejich fakturační e-mail)?`)) return;
    setBulkBusy('send'); setError(null); setNotice(null);
    startTransition(async () => {
      const res = await bulkSendInvoices(ids);
      if (!res.ok) { setError(res.error); setBulkBusy(null); return; }
      const okN = res.results.filter((r) => r.ok).length;
      const failN = res.results.length - okN;
      setNotice(`Odesláno ${okN}${failN ? `, ${failN} selhalo` : ''}.`);
      if (failN) { const fe = res.results.find((r) => !r.ok); if (fe) setError(`Příklad chyby: ${fe.error}`); }
      setSelected(new Set());
      setBulkBusy(null);
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
                    <input id="sup_ico" name="sup_ico" value={sup.ico} onChange={(e) => setSup((s) => ({ ...s, ico: e.target.value }))} placeholder="12345678" className={inputClass} />
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
                    <input id="sup_name" name="sup_name" value={sup.name} onChange={(e) => setSup((s) => ({ ...s, name: e.target.value }))} placeholder="např. Jan Novák / Firma s.r.o." className={inputClass} />
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
                    <input id="sup_street" name="sup_street" value={sup.street} onChange={(e) => setSup((s) => ({ ...s, street: e.target.value }))} placeholder="Ulice 123" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="sup_city">Město + PSČ</label>
                    <input id="sup_city" name="sup_city" value={sup.city} onChange={(e) => setSup((s) => ({ ...s, city: e.target.value }))} placeholder="100 00 Praha" className={inputClass} />
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

      {/* Hromadné akce — lišta se zobrazí, jakmile něco zaškrtneš */}
      {selected.size > 0 && (
        <div className="sticky top-0 z-20 flex flex-wrap items-center gap-3 bg-tobacco border border-caramel/40 px-4 py-3">
          <span className="font-mono text-xs text-moonlight">{selected.size} vybráno · {formatMoney(selectedTotal)}</span>
          <div className="flex-1" />
          <button
            onClick={handleBulkDownload}
            disabled={bulkBusy !== null}
            className="inline-flex items-center gap-2 bg-caramel text-espresso px-3 py-2 font-mono text-[11px] uppercase tracking-widest font-bold hover:bg-caramel-light transition-all disabled:opacity-50"
          >
            {bulkBusy === 'zip' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Stáhnout ZIP
          </button>
          <button
            onClick={handleBulkSend}
            disabled={bulkBusy !== null}
            className="inline-flex items-center gap-2 border border-caramel text-caramel px-3 py-2 font-mono text-[11px] uppercase tracking-widest font-bold hover:bg-caramel hover:text-espresso transition-all disabled:opacity-50"
          >
            {bulkBusy === 'send' ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Poslat vybrané
          </button>
          <button onClick={() => setSelected(new Set())} className="text-sandstone hover:text-moonlight font-mono text-[11px] uppercase tracking-widest">
            Zrušit
          </button>
        </div>
      )}

      {invoices.length > 0 && (
        <div className="flex items-center justify-between px-1 text-[10px] font-mono uppercase tracking-widest">
          <button onClick={() => setMany(allIds, checkState(allIds) !== 'all')} className="text-sandstone hover:text-caramel">
            {checkState(allIds) === 'all' ? 'Zrušit výběr' : 'Vybrat vše'}
          </button>
          <div className="flex gap-4">
            <button onClick={() => setCollapsed(new Set(groups.map((g) => g.personId)))} className="text-sandstone hover:text-caramel">Sbalit vše</button>
            <button onClick={() => setCollapsed(new Set())} className="text-sandstone hover:text-caramel">Rozbalit vše</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {invoices.length === 0 && (
          <p className="bg-coffee p-6 text-center text-sandstone text-sm">Zatím žádné faktury.</p>
        )}
        {groups.map((g) => {
          const gids = g.firmy.flatMap((f) => f.invoices.map((i) => i.id));
          const gstate = checkState(gids);
          const isCollapsed = collapsed.has(g.personId);
          return (
            <div key={g.personId} className="bg-coffee border border-tobacco">
              {/* Hlavička osoby/klienta */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-tobacco/60">
                <GroupCheck state={gstate} onClick={() => setMany(gids, gstate !== 'all')} />
                <button onClick={() => toggleCollapse(g.personId)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                  {isCollapsed ? <ChevronRight size={14} className="text-sandstone shrink-0" /> : <ChevronDown size={14} className="text-sandstone shrink-0" />}
                  <span className="text-moonlight font-medium truncate">{g.personName}</span>
                  <span className="font-mono text-[10px] text-sandstone shrink-0">{g.count} ks</span>
                </button>
                <span className="text-sepia text-sm whitespace-nowrap shrink-0">{formatMoney(g.total)}</span>
              </div>

              {!isCollapsed && g.firmy.map((f) => {
                const fids = f.invoices.map((i) => i.id);
                const fstate = checkState(fids);
                return (
                  <div key={f.firmaId} className="border-b border-tobacco/40 last:border-b-0">
                    {/* Podskupina = firma */}
                    <div className="flex items-center gap-3 px-4 py-2 pl-8 bg-espresso/30">
                      <GroupCheck state={fstate} small onClick={() => setMany(fids, fstate !== 'all')} />
                      <span className="font-mono text-[10px] uppercase tracking-widest text-caramel truncate flex-1 min-w-0">
                        {f.label}{f.subLabel ? ` · ${f.subLabel}` : ''}
                      </span>
                      <span className="text-sandstone text-xs whitespace-nowrap shrink-0">{f.invoices.length} ks · {formatMoney(f.total)}</span>
                    </div>

                    {f.invoices.map((inv) => (
                      <div key={inv.id} className="flex items-center gap-3 px-4 py-2.5 pl-12 border-t border-tobacco/20 hover:bg-tobacco/20">
                        <input
                          type="checkbox"
                          checked={selected.has(inv.id)}
                          onChange={() => toggleOne(inv.id)}
                          className="w-4 h-4 accent-caramel shrink-0"
                          aria-label={`Vybrat fakturu ${inv.invoice_number}`}
                        />
                        <span className="font-mono text-caramel text-xs w-24 md:w-28 shrink-0 truncate">{inv.invoice_number}</span>
                        <span className="text-sepia text-sm flex-1 min-w-0 truncate hidden sm:block">{inv.description ?? '—'}</span>
                        <span className="text-moonlight text-sm w-20 md:w-24 text-right shrink-0">{formatMoney(inv.amount)}</span>
                        <span className="hidden lg:block text-sandstone text-xs w-24 shrink-0">{formatDate(inv.due_date)}</span>
                        <span className="shrink-0"><StatusBadge kind="invoice" value={inv.status} /></span>
                        <div className="flex items-center gap-2.5 shrink-0 ml-auto sm:ml-0">
                          {inv.pdf_url ? (
                            <a href={`/api/portal/invoices/${inv.id}/pdf`} target="_blank" rel="noopener noreferrer" className="text-caramel hover:text-caramel-light" title="Otevřít PDF"><FileText size={14} /></a>
                          ) : (
                            <button onClick={() => handleRegen(inv.id)} disabled={pending} className="text-rust hover:text-caramel-light disabled:opacity-50" title="PDF chybí — regenerovat"><RefreshCw size={13} className={pending ? 'animate-spin' : ''} /></button>
                          )}
                          <button
                            onClick={() => handleSend(inv.id, inv.client?.billing_email || inv.client?.email || inv.customer_override?.email || '')}
                            disabled={pending}
                            className={`disabled:opacity-50 ${inv.shared_at ? 'text-olive hover:text-caramel-light' : 'text-caramel hover:text-caramel-light'}`}
                            title={inv.shared_at ? `Posláno ${formatDate(inv.shared_at)} — poslat znovu` : 'Poslat klientovi (PDF přílohou)'}
                          >
                            {sendingId === inv.id ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                          </button>
                          {inv.status !== 'zaplaceno' && inv.status !== 'zruseno' && (
                            <button onClick={() => handlePaid(inv.id)} disabled={pending} className="text-olive hover:text-caramel disabled:opacity-50" title="Označit jako zaplacené"><Check size={15} /></button>
                          )}
                          {inv.status !== 'zaplaceno' && inv.status !== 'zruseno' && (
                            <button onClick={() => handleCancel(inv.id)} disabled={pending} className="text-sandstone hover:text-rust disabled:opacity-50" title="Stornovat"><Ban size={15} /></button>
                          )}
                          {inv.kind !== 'dobropis' && inv.status !== 'zruseno' && (
                            <button onClick={() => handleCreditNote(inv.id, inv.invoice_number)} disabled={pending} className="text-sandstone hover:text-caramel disabled:opacity-50" title="Vystavit dobropis"><FileMinus size={15} /></button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GroupCheck({ state, onClick, small }: { state: 'all' | 'some' | 'none'; onClick: () => void; small?: boolean }) {
  const Icon = state === 'all' ? CheckSquare : state === 'some' ? MinusSquare : Square;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Vybrat skupinu"
      className={`shrink-0 ${state === 'none' ? 'text-sandstone hover:text-caramel' : 'text-caramel hover:text-caramel-light'}`}
    >
      <Icon size={small ? 14 : 16} />
    </button>
  );
}
