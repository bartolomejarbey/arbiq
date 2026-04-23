'use client';

import { useState, useTransition, useMemo } from 'react';
import { Check, X, Trash2, Circle } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatDate, daysUntil } from '@/lib/formatters';
import { setTaskStatus, deleteTask } from '@/lib/actions/tasks';

export type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  client_id: string | null;
  lead_id: string | null;
  client?: { full_name: string } | null;
  lead?: { name: string; case_number: string | null } | null;
};

type Filter = 'today' | 'week' | 'overdue' | 'all' | 'done';

export default function TaskList({ tasks }: { tasks: TaskRow[] }) {
  const [filter, setFilter] = useState<Filter>('today');
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const days = t.due_date ? daysUntil(t.due_date) : null;
      switch (filter) {
        case 'today':
          return t.status !== 'done' && t.status !== 'cancelled' && days !== null && days <= 0;
        case 'week':
          return t.status !== 'done' && t.status !== 'cancelled' && (days === null || days <= 7);
        case 'overdue':
          return t.status !== 'done' && t.status !== 'cancelled' && days !== null && days < 0;
        case 'done':
          return t.status === 'done';
        case 'all':
        default:
          return t.status !== 'done' && t.status !== 'cancelled';
      }
    });
  }, [tasks, filter]);

  function handleComplete(id: string) {
    startTransition(() => { void setTaskStatus(id, 'done'); });
  }
  function handleCancel(id: string) {
    startTransition(() => { void setTaskStatus(id, 'cancelled'); });
  }
  function handleDelete(id: string) {
    if (!confirm('Smazat úkol?')) return;
    startTransition(() => { void deleteTask(id); });
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {([
          ['today', 'Dnes'],
          ['week', 'Tento týden'],
          ['overdue', 'Po termínu'],
          ['all', 'Vše otevřené'],
          ['done', 'Hotové'],
        ] as [Filter, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-widest border transition-colors ${
              filter === key
                ? 'bg-caramel text-espresso border-caramel'
                : 'bg-coffee text-sepia border-tobacco hover:text-moonlight'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <ul className="space-y-2">
        {filtered.length === 0 && (
          <li className="text-sandstone text-sm bg-coffee p-6 text-center">
            Žádné úkoly v této kategorii.
          </li>
        )}
        {filtered.map((t) => {
          const days = t.due_date ? daysUntil(t.due_date) : null;
          const overdue = days !== null && days < 0 && t.status !== 'done';
          return (
            <li
              key={t.id}
              className={`bg-coffee p-4 flex items-start gap-4 ${overdue ? 'border-l-2 border-rust' : ''}`}
            >
              <button
                onClick={() => handleComplete(t.id)}
                disabled={pending || t.status === 'done'}
                className="mt-0.5 shrink-0 text-sandstone hover:text-olive disabled:opacity-30"
                aria-label="Označit jako hotové"
              >
                {t.status === 'done' ? <Check size={20} className="text-olive" /> : <Circle size={20} />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <span className={`text-moonlight ${t.status === 'done' ? 'line-through opacity-60' : ''}`}>
                    {t.title}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge kind="taskPriority" value={t.priority} />
                    {t.due_date && (
                      <span className={`font-mono text-xs ${overdue ? 'text-rust' : 'text-sandstone'}`}>
                        {formatDate(t.due_date)}
                      </span>
                    )}
                  </div>
                </div>
                {t.description && (
                  <p className="text-sepia text-sm mt-1.5">{t.description}</p>
                )}
                {(t.client?.full_name || t.lead?.name) && (
                  <p className="text-sandstone text-xs mt-2">
                    {t.client?.full_name ?? t.lead?.name}
                    {t.lead?.case_number && ` · ${t.lead.case_number}`}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {t.status !== 'cancelled' && t.status !== 'done' && (
                  <button
                    onClick={() => handleCancel(t.id)}
                    disabled={pending}
                    className="text-sandstone hover:text-rust disabled:opacity-30"
                    aria-label="Zrušit"
                  >
                    <X size={16} />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(t.id)}
                  disabled={pending}
                  className="text-sandstone hover:text-rust disabled:opacity-30"
                  aria-label="Smazat"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
