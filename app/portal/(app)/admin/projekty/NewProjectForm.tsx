'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { createProject } from '@/lib/actions/projects';

const inputClass =
  'w-full bg-espresso border border-tobacco px-3 py-2 text-moonlight placeholder:text-sandstone/50 focus:border-caramel focus:outline-none transition-colors';
const labelClass = 'font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-1.5';

export default function NewProjectForm({
  clients,
  obchodnici,
}: {
  clients: { id: string; full_name: string }[];
  obchodnici: { id: string; full_name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createProject(fd);
      if (!res.ok) setError(res.error);
      else {
        setOpen(false);
        router.push(`/portal/admin/projekt/${res.projectId}`);
      }
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 bg-caramel text-espresso px-4 py-2.5 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all">
        <Plus size={14} /> Nový projekt
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h3 className="font-display italic text-xl text-moonlight">Nový projekt</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="client_id">Klient</label>
          <select id="client_id" name="client_id" required className={inputClass} defaultValue="">
            <option value="" disabled>— vyberte —</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="obchodnik_id">Obchodník</label>
          <select id="obchodnik_id" name="obchodnik_id" className={inputClass} defaultValue="">
            <option value="">— bez —</option>
            {obchodnici.map((o) => <option key={o.id} value={o.id}>{o.full_name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className={labelClass} htmlFor="name">Název</label>
        <input id="name" name="name" required minLength={2} className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="description">Popis</label>
        <textarea id="description" name="description" rows={3} className={`${inputClass} resize-none`} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={labelClass} htmlFor="start_date">Začátek</label>
          <input id="start_date" name="start_date" type="date" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="estimated_end_date">Plánovaný konec</label>
          <input id="estimated_end_date" name="estimated_end_date" type="date" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="total_value">Hodnota (Kč)</label>
          <input id="total_value" name="total_value" inputMode="numeric" className={inputClass} />
        </div>
      </div>
      {error && <p className="text-rust text-xs font-mono">{error}</p>}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="bg-caramel text-espresso px-5 py-2.5 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all disabled:opacity-50">
          {pending ? 'Vytvářím…' : 'Vytvořit a otevřít'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sandstone hover:text-moonlight text-xs font-mono uppercase tracking-widest">Zrušit</button>
      </div>
    </form>
  );
}
