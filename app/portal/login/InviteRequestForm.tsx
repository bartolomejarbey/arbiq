'use client';

import { useState } from 'react';
import { Mail, ChevronDown, CheckCircle2 } from 'lucide-react';
import Honeypot from '@/components/shared/Honeypot';

const inputClass =
  'w-full bg-espresso border border-tobacco px-4 py-3 text-moonlight placeholder:text-sandstone/40 focus:border-caramel focus:outline-none transition-colors text-sm';
const labelClass =
  'font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-2';

export default function InviteRequestForm() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get('name') ?? ''),
      email: String(fd.get('email') ?? ''),
      company: String(fd.get('company') ?? ''),
      reason: String(fd.get('reason') ?? ''),
      website_url_hp: String(fd.get('website_url_hp') ?? ''),
    };
    try {
      const res = await fetch('/api/portal/invite-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? 'Něco se pokazilo.');
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Něco se pokazilo.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="bg-coffee p-6 border-l-2 border-olive flex items-start gap-4">
        <CheckCircle2 size={24} className="text-olive shrink-0 mt-0.5" />
        <div>
          <div className="font-display italic text-moonlight text-lg mb-1">
            Žádost přijata
          </div>
          <p className="text-sandstone text-sm leading-relaxed">
            Ozveme se Vám do 24 hodin. Pokud schválíme přístup, dostanete e-mailem přihlašovací údaje.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-coffee">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-6 py-4 text-left hover:bg-tobacco/30 transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-center gap-3">
          <Mail size={16} className="text-caramel" />
          <span className="font-mono text-xs uppercase tracking-widest text-sepia">
            Nemám přístup — požádat o invite
          </span>
        </span>
        <ChevronDown
          size={16}
          className={`text-sandstone transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <form onSubmit={onSubmit} className="px-6 pb-6 space-y-4 border-t border-tobacco">
          <Honeypot />
          <p className="text-sandstone text-xs leading-relaxed pt-4">
            Klientská zóna je jen pro klienty ARBIQ. Pokud Vás zajímá co tam je, napište nám —
            ozveme se a domluvíme se na dalším kroku.
          </p>

          <div>
            <label className={labelClass} htmlFor="invite-name">
              Jméno *
            </label>
            <input
              id="invite-name"
              name="name"
              required
              minLength={2}
              autoComplete="name"
              placeholder="Jan Novák"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="invite-email">
              E-mail *
            </label>
            <input
              id="invite-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="jan@firma.cz"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="invite-company">
              Firma
            </label>
            <input
              id="invite-company"
              name="company"
              autoComplete="organization"
              placeholder="(volitelné)"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="invite-reason">
              Co Vás přivádí?
            </label>
            <textarea
              id="invite-reason"
              name="reason"
              rows={3}
              placeholder="(volitelné — pomůže nám rychleji odpovědět)"
              className={`${inputClass} resize-none`}
            />
          </div>

          {error && (
            <p className="text-rust text-xs font-mono">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-caramel text-espresso px-6 py-3 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all disabled:opacity-50 disabled:cursor-wait"
          >
            {submitting ? 'Odesílám…' : 'Odeslat žádost'}
          </button>
        </form>
      )}
    </div>
  );
}
