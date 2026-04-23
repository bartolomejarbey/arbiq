'use client';

import { useState, useTransition } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { updateProject, addMilestone, setMilestoneStatus, deleteMilestone } from '@/lib/actions/projects';
import { formatDate, statusLabel } from '@/lib/formatters';
import type { Milestone } from '@/components/portal/Timeline';

const inputClass =
  'w-full bg-espresso border border-tobacco px-3 py-2 text-moonlight focus:border-caramel focus:outline-none transition-colors';
const labelClass = 'font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-1.5';

type Project = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  estimated_end_date: string | null;
  total_value: number | null;
  client: { full_name: string; email: string } | null;
};

export default function ProjectEditClient({
  project,
  milestones,
}: {
  project: Project;
  milestones: Milestone[];
}) {
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onProjectSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateProject(project.id, fd);
        setSavedAt(new Date().toLocaleTimeString('cs-CZ'));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Nepodařilo se uložit.');
      }
    });
  }

  function onAddMilestone(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      try {
        await addMilestone(project.id, fd);
        form.reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Nepodařilo se přidat.');
      }
    });
  }

  function changeStatus(milestoneId: string, status: 'ceka' | 'aktivni' | 'dokoncen' | 'preskocen') {
    startTransition(() => {
      void setMilestoneStatus(milestoneId, project.id, status);
    });
  }

  function removeMilestone(milestoneId: string) {
    if (!confirm('Smazat milník?')) return;
    startTransition(() => {
      void deleteMilestone(milestoneId, project.id);
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <form onSubmit={onProjectSubmit} className="lg:col-span-1 bg-coffee p-6 space-y-4 self-start">
        <h2 className="font-display italic text-xl text-moonlight">Detail projektu</h2>

        <div>
          <div className={labelClass}>Klient</div>
          <div className="text-sepia">{project.client?.full_name ?? '—'}</div>
        </div>

        <div>
          <label className={labelClass} htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={project.status} className={inputClass}>
            {['novy','v_priprave','ve_vyvoji','k_revizi','dokoncen','pozastaven','zruseny'].map((s) => (
              <option key={s} value={s}>{statusLabel('project', s)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="progress">Postup (%)</label>
          <input id="progress" name="progress" type="number" min={0} max={100} defaultValue={project.progress} className={inputClass} />
        </div>

        <div>
          <label className={labelClass} htmlFor="estimated_end_date">Plánovaný konec</label>
          <input id="estimated_end_date" name="estimated_end_date" type="date" defaultValue={project.estimated_end_date ?? ''} className={inputClass} />
        </div>

        <div>
          <label className={labelClass} htmlFor="description">Popis</label>
          <textarea id="description" name="description" defaultValue={project.description ?? ''} rows={4} className={`${inputClass} resize-none`} />
        </div>

        {error && <p className="text-rust text-xs font-mono">{error}</p>}
        {savedAt && <p className="text-olive text-xs font-mono">Uloženo {savedAt}.</p>}

        <button type="submit" disabled={pending} className="bg-caramel text-espresso px-5 py-2.5 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all disabled:opacity-50">
          {pending ? 'Ukládám…' : 'Uložit změny'}
        </button>
      </form>

      <div className="lg:col-span-2 space-y-6">
        <h2 className="font-display italic text-xl text-moonlight">Milníky</h2>

        <form onSubmit={onAddMilestone} className="bg-coffee p-5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className={labelClass} htmlFor="m_name">Nový milník</label>
              <input id="m_name" name="name" required minLength={2} placeholder="např. Brief schválen" className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="m_due">Termín</label>
              <input id="m_due" name="due_date" type="date" className={inputClass} />
            </div>
          </div>
          <div>
            <textarea name="description" placeholder="Popis (volitelně)" rows={2} className={`${inputClass} resize-none`} />
          </div>
          <button type="submit" disabled={pending} className="inline-flex items-center gap-2 text-caramel hover:text-caramel-light font-mono text-xs uppercase tracking-widest disabled:opacity-50">
            <Plus size={14} /> Přidat milník
          </button>
        </form>

        <ul className="space-y-2">
          {milestones.length === 0 && (
            <li className="bg-coffee p-6 text-center text-sandstone text-sm">Žádné milníky.</li>
          )}
          {milestones.map((m) => (
            <li key={m.id} className="bg-coffee p-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-moonlight font-medium">{m.name}</div>
                <div className="text-sandstone text-xs mt-1">
                  {m.due_date ? `Termín ${formatDate(m.due_date)}` : 'Bez termínu'}
                  {m.completed_at && ` · Dokončeno ${formatDate(m.completed_at)}`}
                </div>
                {m.description && <p className="text-sepia text-sm mt-2">{m.description}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={m.status}
                  onChange={(e) => changeStatus(m.id, e.target.value as 'ceka' | 'aktivni' | 'dokoncen' | 'preskocen')}
                  disabled={pending}
                  className="bg-espresso border border-tobacco px-2 py-1 text-sepia text-xs"
                >
                  {['ceka','aktivni','dokoncen','preskocen'].map((s) => (
                    <option key={s} value={s}>{statusLabel('milestone', s)}</option>
                  ))}
                </select>
                <button onClick={() => removeMilestone(m.id)} disabled={pending} className="text-sandstone hover:text-rust disabled:opacity-30" aria-label="Smazat">
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
