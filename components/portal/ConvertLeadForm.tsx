'use client';

import { useState, useTransition } from 'react';
import { convertLeadToClient } from '@/lib/actions/leads';
import type { LeadRow } from './LeadTable';

const labelClass = 'font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-2';
const inputClass =
  'w-full bg-espresso border border-tobacco px-4 py-2.5 text-moonlight placeholder:text-sandstone/50 focus:border-caramel focus:outline-none transition-colors';

export default function ConvertLeadForm({
  lead,
  onSuccess,
}: {
  lead: LeadRow;
  onSuccess: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set('leadId', lead.id);
    startTransition(async () => {
      const result = await convertLeadToClient(fd);
      if (!result.ok) {
        setError(result.error);
      } else {
        onSuccess();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <h3 className="font-display italic text-xl text-moonlight">Konverze na klienta</h3>
      <p className="text-sandstone text-sm">
        Vytvoří se účet do klientské zóny + nový projekt. Klient dostane e-mailem přihlašovací údaje.
      </p>

      <div>
        <label className={labelClass} htmlFor="fullName">Plné jméno klienta</label>
        <input id="fullName" name="fullName" required minLength={2} defaultValue={lead.name} className={inputClass} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="email">E-mail</label>
          <input id="email" name="email" type="email" required defaultValue={lead.email} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="phone">Telefon</label>
          <input id="phone" name="phone" defaultValue={lead.phone ?? ''} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="company">Firma</label>
          <input id="company" name="company" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="ico">IČO</label>
          <input id="ico" name="ico" className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="websiteUrl">Web</label>
        <input id="websiteUrl" name="websiteUrl" defaultValue={lead.website_url ?? ''} className={inputClass} />
      </div>

      <div className="border-t border-tobacco pt-5 mt-5">
        <h4 className="font-mono text-[10px] uppercase tracking-widest text-caramel mb-4">První projekt</h4>
        <div>
          <label className={labelClass} htmlFor="projectName">Název projektu</label>
          <input id="projectName" name="projectName" required minLength={2} placeholder={`${lead.kampan} pro ${lead.name}`} className={inputClass} />
        </div>
        <div className="mt-4">
          <label className={labelClass} htmlFor="projectDescription">Popis projektu</label>
          <textarea id="projectDescription" name="projectDescription" rows={3} defaultValue={lead.popis ?? ''} className={`${inputClass} resize-none`} />
        </div>
        <div className="mt-4">
          <label className={labelClass} htmlFor="projectValue">Hodnota (Kč)</label>
          <input id="projectValue" name="projectValue" inputMode="numeric" placeholder="50000" className={inputClass} />
        </div>
      </div>

      {error && <p className="text-rust text-sm font-mono">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-caramel text-espresso px-6 py-3.5 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all disabled:opacity-50"
      >
        {pending ? 'Konvertuji…' : 'Vytvořit klienta a projekt'}
      </button>
    </form>
  );
}
