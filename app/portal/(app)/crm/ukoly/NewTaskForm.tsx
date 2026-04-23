'use client';

import { useState, useTransition } from 'react';
import { Plus } from 'lucide-react';
import { createTask } from '@/lib/actions/tasks';

const inputClass =
  'w-full bg-espresso border border-tobacco px-3 py-2 text-moonlight placeholder:text-sandstone/50 focus:border-caramel focus:outline-none transition-colors';
const labelClass = 'font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-1.5';

export default function NewTaskForm() {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setError(null);
    startTransition(async () => {
      const res = await createTask(fd);
      if (!res.ok) setError(res.error);
      else { form.reset(); setOpen(false); }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 text-caramel hover:text-caramel-light font-mono text-xs uppercase tracking-widest"
      >
        <Plus size={14} /> Přidat úkol
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <h3 className="font-display italic text-lg text-moonlight">Nový úkol</h3>
      <div>
        <label className={labelClass} htmlFor="title">Název</label>
        <input id="title" name="title" required minLength={2} className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="description">Popis</label>
        <textarea id="description" name="description" rows={2} className={`${inputClass} resize-none`} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="priority">Priorita</label>
          <select id="priority" name="priority" defaultValue="normal" className={inputClass}>
            <option value="low">Nízká</option>
            <option value="normal">Normální</option>
            <option value="high">Vysoká</option>
            <option value="urgent">Naléhavá</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="due_date">Termín</label>
          <input id="due_date" name="due_date" type="date" className={inputClass} />
        </div>
      </div>
      {error && <p className="text-rust text-xs font-mono">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="bg-caramel text-espresso px-4 py-2 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all disabled:opacity-50"
        >
          {pending ? 'Ukládám…' : 'Přidat'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sandstone hover:text-moonlight text-xs font-mono uppercase tracking-widest"
        >
          Zrušit
        </button>
      </div>
    </form>
  );
}
