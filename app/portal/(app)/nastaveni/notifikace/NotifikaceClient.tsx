'use client';

import { useState, useTransition } from 'react';
import { Mail, MessageSquare, Bell, Send, Loader2 } from 'lucide-react';
import {
  saveNotificationMaster,
  saveNotificationPref,
  sendTestSms,
  sendTestNotification,
} from '@/lib/actions/notification-prefs';

export type PrefRow = { email: boolean; sms: boolean; inapp: boolean };
export type PrefMap = Record<string, PrefRow>;
type TypeDef = { type: string; label: string; smsDefault: boolean };
type Flash = { kind: 'ok' | 'err'; msg: string } | null;

const labelClass = 'font-mono text-[10px] uppercase tracking-widest text-sandstone';
const btnPrimary =
  'inline-flex items-center gap-2 bg-caramel text-espresso px-5 py-2.5 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light disabled:opacity-50';
const btnGhost =
  'inline-flex items-center gap-2 border border-caramel text-caramel px-4 py-2 font-mono text-xs uppercase tracking-widest hover:bg-caramel/10 disabled:opacity-50';

export default function NotifikaceClient({
  master,
  prefs,
  types,
  isAdmin,
  smsConfigured,
}: {
  master: { email: boolean; sms: boolean; phone: string };
  prefs: PrefMap;
  types: TypeDef[];
  isAdmin: boolean;
  smsConfigured: boolean;
}) {
  const [emailEnabled, setEmailEnabled] = useState(master.email);
  const [smsEnabled, setSmsEnabled] = useState(master.sms);
  const [phone, setPhone] = useState(master.phone);
  const [pref, setPref] = useState<PrefMap>(() => {
    const init: PrefMap = {};
    for (const t of types) {
      init[t.type] = prefs[t.type] ?? { email: master.email, sms: master.sms, inapp: true };
    }
    return init;
  });
  const [testNumber, setTestNumber] = useState(master.phone);
  const [flash, setFlash] = useState<Flash>(null);
  const [pending, startTransition] = useTransition();

  function saveMaster() {
    setFlash(null);
    const fd = new FormData();
    fd.set('email_enabled', emailEnabled ? 'on' : 'off');
    fd.set('sms_enabled', smsEnabled ? 'on' : 'off');
    fd.set('phone', phone);
    startTransition(async () => {
      const res = await saveNotificationMaster(fd);
      setFlash(res.ok ? { kind: 'ok', msg: 'Nastavení uloženo.' } : { kind: 'err', msg: res.error });
    });
  }

  function togglePref(type: string, channel: keyof PrefRow) {
    const next: PrefRow = { ...pref[type], [channel]: !pref[type][channel] };
    setPref((p) => ({ ...p, [type]: next }));
    startTransition(async () => {
      const res = await saveNotificationPref({ type, ...next });
      if (!res.ok) setFlash({ kind: 'err', msg: res.error });
    });
  }

  function runTestSms() {
    setFlash(null);
    startTransition(async () => {
      const res = await sendTestSms(testNumber);
      setFlash(res.ok ? { kind: 'ok', msg: res.info } : { kind: 'err', msg: res.error });
    });
  }

  function runTestNotification() {
    setFlash(null);
    startTransition(async () => {
      const res = await sendTestNotification();
      setFlash(res.ok ? { kind: 'ok', msg: res.info } : { kind: 'err', msg: res.error });
    });
  }

  return (
    <div className="max-w-3xl space-y-8">
      {flash && (
        <div className={`border-l-4 p-4 ${flash.kind === 'ok' ? 'bg-olive/15 border-olive' : 'bg-rust/15 border-rust'}`}>
          <p className={`font-mono text-xs uppercase tracking-widest ${flash.kind === 'ok' ? 'text-olive' : 'text-rust'}`}>
            {flash.msg}
          </p>
        </div>
      )}

      {/* Master přepínače */}
      <section className="bg-coffee border border-tobacco p-6 space-y-5">
        <h3 className="font-display italic text-xl text-moonlight">Kam posílat upozornění</h3>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" className="accent-caramel w-4 h-4" checked={emailEnabled} onChange={(e) => setEmailEnabled(e.target.checked)} />
          <Mail size={16} className="text-caramel" />
          <span className="text-sepia text-sm">E-mailové notifikace</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" className="accent-caramel w-4 h-4" checked={smsEnabled} onChange={(e) => setSmsEnabled(e.target.checked)} />
          <MessageSquare size={16} className="text-caramel" />
          <span className="text-sepia text-sm">SMS notifikace</span>
          {!smsConfigured && (
            <span className="font-mono text-[10px] uppercase tracking-widest text-rust">SMS brána nenastavena</span>
          )}
        </label>

        <div className="space-y-1 max-w-sm">
          <label className={labelClass}>Telefon pro SMS</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+420 776 123 456"
            className="w-full bg-espresso border border-tobacco px-3 py-2 text-moonlight text-sm focus:border-caramel outline-none"
          />
        </div>

        <button onClick={saveMaster} disabled={pending} className={btnPrimary}>
          {pending ? <Loader2 size={14} className="animate-spin" /> : null} Uložit
        </button>
      </section>

      {/* Per-typ matice */}
      <section className="bg-coffee border border-tobacco p-6 space-y-4">
        <div>
          <h3 className="font-display italic text-xl text-moonlight">Podle typu události</h3>
          <p className="text-xs text-sandstone mt-1">Jemné doladění — přebíjí hlavní přepínače výše.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-tobacco">
                <th className={`text-left ${labelClass} py-2 pr-4`}>Událost</th>
                <th className={`${labelClass} py-2 px-3`}><Bell size={14} className="inline" /> Portál</th>
                <th className={`${labelClass} py-2 px-3`}><Mail size={14} className="inline" /> E-mail</th>
                <th className={`${labelClass} py-2 px-3`}><MessageSquare size={14} className="inline" /> SMS</th>
              </tr>
            </thead>
            <tbody>
              {types.map((t) => (
                <tr key={t.type} className="border-b border-tobacco/50">
                  <td className="py-3 pr-4 text-sepia">{t.label}</td>
                  {(['inapp', 'email', 'sms'] as const).map((ch) => (
                    <td key={ch} className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        className="accent-caramel w-4 h-4"
                        checked={pref[t.type]?.[ch] ?? false}
                        disabled={pending}
                        onChange={() => togglePref(t.type, ch)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Test */}
      {isAdmin && (
        <section className="bg-coffee border border-tobacco p-6 space-y-4">
          <h3 className="font-display italic text-xl text-moonlight">Test</h3>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className={labelClass}>Číslo pro test SMS</label>
              <input
                type="tel"
                value={testNumber}
                onChange={(e) => setTestNumber(e.target.value)}
                placeholder="+420 776 123 456"
                className="bg-espresso border border-tobacco px-3 py-2 text-moonlight text-sm focus:border-caramel outline-none"
              />
            </div>
            <button onClick={runTestSms} disabled={pending || !smsConfigured} className={btnGhost}>
              <Send size={14} /> Poslat test SMS
            </button>
            <button onClick={runTestNotification} disabled={pending} className={btnGhost}>
              <Bell size={14} /> Test všech kanálů
            </button>
          </div>
          {!smsConfigured && (
            <p className="text-xs text-rust">
              SMS brána není nakonfigurovaná — doplň SMSBRANA_LOGIN a SMSBRANA_PASSWORD do .env.local.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
