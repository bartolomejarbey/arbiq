import { CheckCircle2, Circle, CircleDashed, MinusCircle } from 'lucide-react';
import { formatDate, statusLabel } from '@/lib/formatters';

export type Milestone = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  due_date: string | null;
  completed_at: string | null;
};

const iconFor = (status: string) => {
  switch (status) {
    case 'dokoncen': return CheckCircle2;
    case 'aktivni':  return Circle;
    case 'preskocen':return MinusCircle;
    default:         return CircleDashed;
  }
};

const colorFor = (status: string) => {
  switch (status) {
    case 'dokoncen': return 'text-olive';
    case 'aktivni':  return 'text-caramel';
    case 'preskocen':return 'text-sandstone';
    default:         return 'text-sandstone/60';
  }
};

export default function Timeline({ milestones }: { milestones: Milestone[] }) {
  if (milestones.length === 0) {
    return (
      <p className="text-sandstone text-sm">Pro tento projekt zatím nejsou definované milníky.</p>
    );
  }

  return (
    <ol className="relative">
      <span aria-hidden className="absolute left-[11px] top-1 bottom-1 w-px bg-tobacco" />
      {milestones.map((m) => {
        const Icon = iconFor(m.status);
        const color = colorFor(m.status);
        const active = m.status === 'aktivni';
        return (
          <li key={m.id} className="relative pl-10 pb-8 last:pb-0">
            <span className={`absolute left-0 top-0 ${color} ${active ? 'drop-shadow-[0_0_6px_rgba(201,152,106,0.6)]' : ''}`}>
              <Icon size={24} />
            </span>
            <div className="flex items-baseline justify-between gap-4 flex-wrap">
              <h4 className={`font-medium ${active ? 'text-moonlight' : 'text-sepia'}`}>{m.name}</h4>
              <span className="font-mono text-[10px] uppercase tracking-widest text-sandstone">
                {statusLabel('milestone', m.status)}
              </span>
            </div>
            <div className="text-xs text-sandstone mt-1">
              {m.completed_at
                ? `Dokončeno ${formatDate(m.completed_at)}`
                : m.due_date
                  ? `Termín ${formatDate(m.due_date)}`
                  : null}
            </div>
            {m.description && (
              <p className="text-sepia text-sm mt-2 max-w-2xl">{m.description}</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
