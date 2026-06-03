'use client';

import { useState, useTransition } from 'react';
import { Plus, Repeat, Trash2, Play, Pause } from 'lucide-react';
import { formatMoney, formatDate } from '@/lib/formatters';
import { upsertRecurringInvoice, setRecurringActive, deleteRecurringInvoice } from '@/lib/actions/recurring';

export type RecurringRow = {
  id: string;
  amount: number;
  description: string;
  kind: string;
  due_days: number;
  payment_method: string;
  interval_months: number;
  day_of_month: number;
  auto_send: boolean;
  active: boolean;
  next_run: string;
  last_run: string | null;
};

const inputClass = 'w-full bg-espresso border border-tobacco px-3 py-2 text-moonlight text-sm focus:border-caramel focus:outline-none transition-colors';
const labelClass = 'font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-1.5';

const INTERVAL_LABEL: Record<number, string> = { 1: 'měsíčně', 3: 'čtvrtletně', 6: 'pololetně', 12: 'ročně' };

export default function RecurringInvoiceForm({ clientId, configs }: { clientId: string; configs: RecurringRow[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const res = await upsertRecurringInvoice(clientId, fd);
      if (res.ok) { setMsg({ ok: true, text: 'Pravidelná fakturace uložena.' }); form.reset(); setOpen(false); }
      else setMsg({ ok: false, text: res.error });
    });
  }

  function onToggle(id: string, active: boolean) {
    setMsg(null);
    startTransition(async () => {
      const res = await setRecurringActive(id, clientId, active);
      if (!res.ok) setMsg({ ok: false, text: res.error });
    });
  }

  function onDelete(id: string) {
    if (!confirm('Smazat tuto pravidelnou fakturaci?')) return;
    setMsg(null);
    startTransition(async () => {
      const res = await deleteRecurringInvoice(id, clientId);
      if (!res.ok) setMsg({ ok: false, text: res.error });
    });
  }

  return (
    <section className="bg-coffee p-6">
      <h2 className="font-display italic font-black text-xl text-moonlight mb-1 flex items-center gap-2">
        <Repeat size={18} className="text-caramel" /> Pravidelná fakturace
      </h2>
      <p className="text-sandstone text-xs mb-4">
        Automatické generování (a volitelně odeslání) faktur v zadaném intervalu. Běží denní cron.
      </p>

      {configs.length > 0 && (
        <ul className="space-y-2 mb-4">
          {configs.map((c) => (
            <li key={c.id} className="bg-espresso p-3 flex items-start justify-between gap-4 border-l-2 border-caramel/40">
              <div className="min-w-0">
                <div className="text-moonlight text-sm">
                  {formatMoney(c.amount)} · {INTERVAL_LABEL[c.interval_months] ?? `á ${c.interval_months} m.`} · {c.day_of_month}. den
                  {c.auto_send ? <span className="text-olive"> · auto-odeslání</span> : <span className="text-sandstone"> · jen vygenerovat</span>}
                </div>
                <div className="text-sandstone text-xs mt-0.5 truncate">{c.description}</div>
                <div className="font-mono text-[10px] text-sandstone/70 mt-1">
                  {c.active ? `Další: ${formatDate(c.next_run)}` : 'Pozastaveno'}
                  {c.last_run ? ` · naposledy ${formatDate(c.last_run)}` : ''}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => onToggle(c.id, !c.active)} disabled={pending} className="text-sandstone hover:text-caramel disabled:opacity-50" title={c.active ? 'Pozastavit' : 'Spustit'}>
                  {c.active ? <Pause size={15} /> : <Play size={15} />}
                </button>
                <button onClick={() => onDelete(c.id)} disabled={pending} className="text-sandstone hover:text-rust disabled:opacity-50" title="Smazat">
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!open ? (
        <button onClick={() => { setOpen(true); setMsg(null); }} className="inline-flex items-center gap-2 text-caramel hover:text-caramel-light font-mono text-xs uppercase tracking-widest">
          <Plus size={14} /> Přidat pravidelnou fakturu
        </button>
      ) : (
        <form onSubmit={onSubmit} className="bg-espresso p-4 space-y-3 border border-tobacco">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="r_amount">Částka (Kč)</label>
              <input id="r_amount" name="amount" required inputMode="numeric" placeholder="7500" className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="r_kind">Druh</label>
              <select id="r_kind" name="kind" defaultValue="paushal" className={inputClass}>
                <option value="paushal">Paušální faktura</option>
                <option value="konecna">Faktura</option>
                <option value="zaloha">Zálohová faktura</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass} htmlFor="r_description">Popis</label>
            <input id="r_description" name="description" required placeholder="Měsíční správa webu a marketingu" className={inputClass} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className={labelClass} htmlFor="r_interval">Interval</label>
              <select id="r_interval" name="interval_months" defaultValue="1" className={inputClass}>
                <option value="1">Měsíčně</option>
                <option value="3">Čtvrtletně</option>
                <option value="6">Pololetně</option>
                <option value="12">Ročně</option>
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="r_day">Den v měsíci</label>
              <input id="r_day" name="day_of_month" type="number" min={1} max={28} defaultValue={1} className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="r_due">Splatnost (dnů)</label>
              <input id="r_due" name="due_days" type="number" min={1} max={90} defaultValue={14} className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="r_pm">Úhrada</label>
              <select id="r_pm" name="payment_method" defaultValue="bank" className={inputClass}>
                <option value="bank">Převodem</option>
                <option value="card">Kartou</option>
                <option value="cash">Hotově</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="auto_send" defaultChecked className="w-4 h-4 accent-caramel" />
            <span className="text-sepia text-sm">Automaticky odeslat klientovi e-mailem (jinak jen vygenerovat k odeslání)</span>
          </label>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={pending} className="bg-caramel text-espresso px-4 py-2 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all disabled:opacity-50">
              {pending ? 'Ukládám…' : 'Uložit'}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-sandstone hover:text-moonlight text-xs font-mono uppercase tracking-widest">Zrušit</button>
          </div>
        </form>
      )}
      {msg && <p className={`text-xs font-mono mt-2 ${msg.ok ? 'text-olive' : 'text-rust'}`}>{msg.text}</p>}
    </section>
  );
}
