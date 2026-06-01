'use client';

import { useState, useTransition } from 'react';
import { Send } from 'lucide-react';
import { sendZoneMessage } from '@/lib/actions/correspondence';

const inputClass =
  'w-full bg-espresso border border-tobacco px-3 py-2 text-moonlight text-sm focus:border-caramel focus:outline-none transition-colors';

export default function ZoneMessageForm() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const res = await sendZoneMessage(fd);
      if (res.ok) { setMsg({ ok: true, text: 'Zpráva odeslána. Ozveme se Vám.' }); form.reset(); setOpen(false); }
      else setMsg({ ok: false, text: res.error });
    });
  }

  return (
    <div className="mb-4">
      {!open ? (
        <button
          onClick={() => { setOpen(true); setMsg(null); }}
          className="inline-flex items-center gap-2 bg-caramel text-espresso px-4 py-2 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all"
        >
          <Send size={14} /> Napsat zprávu
        </button>
      ) : (
        <form onSubmit={onSubmit} className="bg-coffee p-5 space-y-3">
          <input name="subject" placeholder="Předmět (volitelné)" className={inputClass} />
          <textarea name="body" required rows={4} placeholder="Vaše zpráva pro tým ARBIQ…" className={`${inputClass} resize-y`} />
          <div className="flex items-center gap-3">
            <button type="submit" disabled={pending} className="bg-caramel text-espresso px-4 py-2 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all disabled:opacity-50">
              {pending ? 'Odesílám…' : 'Odeslat'}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-sandstone hover:text-moonlight text-xs font-mono uppercase tracking-widest">Zrušit</button>
          </div>
        </form>
      )}
      {msg && <p className={`text-xs font-mono mt-2 ${msg.ok ? 'text-olive' : 'text-rust'}`}>{msg.text}</p>}
    </div>
  );
}
