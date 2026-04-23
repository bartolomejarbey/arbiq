'use client';

import { useState, useTransition } from 'react';
import { addCrmContact } from '@/lib/actions/contacts';

const inputClass =
  'w-full bg-espresso border border-tobacco px-3 py-2 text-moonlight placeholder:text-sandstone/50 focus:border-caramel focus:outline-none transition-colors';
const labelClass = 'font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-1.5';

export default function ContactHistoryForm({ clientId }: { clientId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOk(false);
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set('client_id', clientId);
    startTransition(async () => {
      const result = await addCrmContact(fd);
      if (!result.ok) setError(result.error);
      else {
        form.reset();
        setOk(true);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <h3 className="font-display italic text-lg text-moonlight">Přidat záznam</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="type">Typ</label>
          <select id="type" name="type" className={inputClass} required defaultValue="telefon">
            <option value="telefon">Telefon</option>
            <option value="email">E-mail</option>
            <option value="schuzka">Schůzka</option>
            <option value="zprava">Zpráva</option>
            <option value="jine">Jiné</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="next_followup">Follow-up</label>
          <input id="next_followup" name="next_followup" type="date" className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass} htmlFor="note">Poznámka</label>
        <textarea id="note" name="note" rows={3} required minLength={1} className={`${inputClass} resize-none`} />
      </div>
      {error && <p className="text-rust text-xs font-mono">{error}</p>}
      {ok && <p className="text-olive text-xs font-mono">Záznam přidán.</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-caramel text-espresso px-4 py-2 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all disabled:opacity-50"
      >
        {pending ? 'Ukládám…' : 'Přidat'}
      </button>
    </form>
  );
}
