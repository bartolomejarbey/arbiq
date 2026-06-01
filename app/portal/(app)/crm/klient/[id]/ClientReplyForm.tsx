'use client';

import { useState, useTransition } from 'react';
import { Send } from 'lucide-react';
import { sendClientReply } from '@/lib/actions/correspondence';

const inputClass =
  'w-full bg-espresso border border-tobacco px-3 py-2 text-moonlight text-sm focus:border-caramel focus:outline-none transition-colors';

export default function ClientReplyForm({ clientId, clientEmail }: { clientId: string; clientEmail: string }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const res = await sendClientReply(clientId, fd);
      if (res.ok) { setMsg({ ok: true, text: 'Odesláno a zalogováno do korespondence.' }); form.reset(); }
      else setMsg({ ok: false, text: res.error });
    });
  }

  return (
    <form onSubmit={onSubmit} className="bg-coffee p-5 space-y-3">
      <p className="text-sandstone text-xs">Odpověď půjde klientovi na <span className="text-sepia">{clientEmail}</span> a uloží se do korespondence v zóně.</p>
      <input name="subject" placeholder="Předmět (volitelné)" className={inputClass} />
      <textarea name="body" required rows={4} placeholder="Text zprávy klientovi…" className={`${inputClass} resize-y`} />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="inline-flex items-center gap-2 bg-caramel text-espresso px-4 py-2 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all disabled:opacity-50">
          <Send size={14} /> {pending ? 'Odesílám…' : 'Odeslat klientovi'}
        </button>
        {msg && <span className={`text-xs font-mono ${msg.ok ? 'text-olive' : 'text-rust'}`}>{msg.text}</span>}
      </div>
    </form>
  );
}
