'use client';

import { useState, useTransition } from 'react';
import { Plus } from 'lucide-react';
import { createRecommendation } from '@/lib/actions/admin-recommendations';

const inputClass =
  'w-full bg-espresso border border-tobacco px-3 py-2 text-moonlight focus:border-caramel focus:outline-none transition-colors';
const labelClass = 'font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-1.5';

export default function RecommendationsAdminClient({
  clients,
}: {
  clients: { id: string; full_name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const res = await createRecommendation(fd);
      if (!res.ok) setError(res.error);
      else { form.reset(); setOpen(false); }
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 bg-caramel text-espresso px-4 py-2.5 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all">
        <Plus size={14} /> Nové doporučení
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="bg-coffee p-6 space-y-4">
      <h3 className="font-display italic text-xl text-moonlight">Nové doporučení</h3>
      <div>
        <label className={labelClass} htmlFor="r_client">Klient</label>
        <select id="r_client" name="client_id" required className={inputClass} defaultValue="">
          <option value="" disabled>— vyberte —</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
        </select>
      </div>
      <div>
        <label className={labelClass} htmlFor="r_service">Služba</label>
        <input id="r_service" name="service_name" required minLength={2} placeholder="SEO optimalizace" className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="r_description">Proč to doporučujeme</label>
        <textarea id="r_description" name="description" required minLength={5} rows={3} className={`${inputClass} resize-none`} />
      </div>
      <div>
        <label className={labelClass} htmlFor="r_price">Orientační cena</label>
        <input id="r_price" name="estimated_price" placeholder="od 12 000 Kč / měsíc" className={inputClass} />
      </div>
      {error && <p className="text-rust text-xs font-mono">{error}</p>}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="bg-caramel text-espresso px-5 py-2.5 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all disabled:opacity-50">
          {pending ? 'Ukládám…' : 'Vytvořit'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sandstone hover:text-moonlight text-xs font-mono uppercase tracking-widest">Zrušit</button>
      </div>
    </form>
  );
}
