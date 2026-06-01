'use client';

import { useState, useTransition } from 'react';
import { Mail } from 'lucide-react';
import { updateClientEmails } from '@/lib/actions/users';

const inputClass =
  'w-full bg-espresso border border-tobacco px-3 py-2 text-moonlight text-sm focus:border-caramel focus:outline-none transition-colors';
const labelClass = 'font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-1.5';

/**
 * Admin/obchodník nastaví oddělený fakturační a smluvní e-mail klienta.
 * Použijí se jako default při odeslání faktury/smlouvy (fallback hlavní e-mail).
 */
export default function ClientEmailsForm({
  clientId,
  mainEmail,
  billingEmail,
  contractEmail,
}: {
  clientId: string;
  mainEmail: string;
  billingEmail: string | null;
  contractEmail: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateClientEmails(clientId, fd);
      if (res.ok) setMsg({ ok: true, text: 'Uloženo.' });
      else setMsg({ ok: false, text: res.error });
    });
  }

  return (
    <section className="bg-coffee p-6">
      <h2 className="font-display italic font-black text-xl text-moonlight mb-1 flex items-center gap-2">
        <Mail size={18} className="text-caramel" /> Fakturační a smluvní e-mail
      </h2>
      <p className="text-sandstone text-xs mb-4">
        Nepovinné. Když je vyplníš, faktura/smlouva se pošle sem místo hlavního e-mailu
        (<span className="text-sepia">{mainEmail}</span>). Při odeslání jde adresa ještě jednorázově změnit.
      </p>
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="billing_email">Fakturační e-mail</label>
          <input
            id="billing_email"
            name="billing_email"
            type="email"
            defaultValue={billingEmail ?? ''}
            placeholder={mainEmail}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="contract_email">Smluvní e-mail</label>
          <input
            id="contract_email"
            name="contract_email"
            type="email"
            defaultValue={contractEmail ?? ''}
            placeholder={mainEmail}
            className={inputClass}
          />
        </div>
        <div className="md:col-span-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="bg-caramel text-espresso px-4 py-2 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all disabled:opacity-50"
          >
            {pending ? 'Ukládám…' : 'Uložit e-maily'}
          </button>
          {msg && (
            <span className={`text-xs font-mono ${msg.ok ? 'text-olive' : 'text-rust'}`}>{msg.text}</span>
          )}
        </div>
      </form>
    </section>
  );
}
