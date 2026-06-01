'use client';

import { useState, useTransition } from 'react';
import { Download, ShieldAlert } from 'lucide-react';
import { anonymizeClient } from '@/lib/actions/gdpr';

export default function GdprActions({ clientId }: { clientId: string }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function onAnonymize() {
    if (!confirm(
      'GDPR výmaz: nevratně anonymizovat tohoto klienta? Osobní údaje, korespondence a poznámky se vymažou. Faktury a smlouvy zůstanou (zákonná archivace) s anonymizovaným jménem. Účet bude deaktivován.',
    )) return;
    setMsg(null);
    startTransition(async () => {
      const res = await anonymizeClient(clientId);
      if (res.ok) setMsg({ ok: true, text: 'Klient anonymizován.' });
      else setMsg({ ok: false, text: res.error });
    });
  }

  return (
    <section className="bg-coffee p-6 border-l-2 border-rust/40">
      <h2 className="font-display italic font-black text-xl text-moonlight mb-1 flex items-center gap-2">
        <ShieldAlert size={18} className="text-rust" /> GDPR
      </h2>
      <p className="text-sandstone text-xs mb-4">Export osobních údajů (čl. 15) a výmaz/anonymizace (čl. 17).</p>
      <div className="flex flex-wrap items-center gap-3">
        <a
          href={`/api/portal/clients/${clientId}/export`}
          className="inline-flex items-center gap-2 bg-espresso border border-tobacco hover:border-caramel text-sepia px-4 py-2 font-mono text-xs uppercase tracking-widest transition-all"
        >
          <Download size={14} /> Export dat (JSON)
        </a>
        <button
          onClick={onAnonymize}
          disabled={pending}
          className="inline-flex items-center gap-2 border border-rust/50 text-rust hover:bg-rust/10 px-4 py-2 font-mono text-xs uppercase tracking-widest transition-all disabled:opacity-50"
        >
          <ShieldAlert size={14} /> {pending ? 'Anonymizuji…' : 'Anonymizovat (výmaz)'}
        </button>
        {msg && <span className={`text-xs font-mono ${msg.ok ? 'text-olive' : 'text-rust'}`}>{msg.text}</span>}
      </div>
    </section>
  );
}
