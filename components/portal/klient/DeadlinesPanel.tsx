import Link from 'next/link';
import { Receipt, FileSignature, FolderKanban, CheckSquare, CalendarDays, CalendarClock } from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import type { DeadlineItem } from '@/lib/data/client-overview';

const ICON = {
  invoice: Receipt,
  quote: FileSignature,
  project: FolderKanban,
  task: CheckSquare,
  meeting: CalendarDays,
} as const;

function dateLabel(item: DeadlineItem): string {
  // schůzky mají čas → ukaž i ten
  if (item.kind === 'meeting' && item.date.includes('T')) {
    const d = new Date(item.date);
    return `${formatDate(item.date)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  return formatDate(item.date);
}

export default function DeadlinesPanel({ items }: { items: DeadlineItem[] }) {
  return (
    <section>
      <h2 className="font-display italic font-black text-2xl text-moonlight mb-4 flex items-center gap-3">
        <CalendarClock size={20} className="text-caramel" />
        <span>Nadcházející termíny &amp; schůzky</span>
        {items.length > 0 && (
          <span className="font-mono text-[10px] uppercase tracking-widest text-sandstone ml-auto">{items.length}</span>
        )}
      </h2>
      {items.length === 0 ? (
        <p className="text-sandstone text-sm bg-coffee p-6">Žádné nadcházející termíny ani schůzky.</p>
      ) : (
        <ul className="bg-coffee divide-y divide-tobacco/40">
          {items.map((it, i) => {
            const Icon = ICON[it.kind];
            const row = (
              <div className={`flex items-center gap-3 px-5 py-3 ${it.overdue ? 'border-l-2 border-rust' : 'border-l-2 border-transparent'}`}>
                <Icon size={15} className={it.overdue ? 'text-rust shrink-0' : 'text-caramel shrink-0'} />
                <span className="text-sepia text-sm min-w-0 truncate">{it.label}</span>
                <span className={`ml-auto text-xs whitespace-nowrap font-mono ${it.overdue ? 'text-rust' : 'text-sandstone'}`}>
                  {it.overdue ? 'po termínu · ' : ''}{dateLabel(it)}
                </span>
              </div>
            );
            return (
              <li key={`${it.kind}-${i}`}>
                {it.href ? (
                  <Link href={it.href} className="block hover:bg-tobacco/30">{row}</Link>
                ) : (
                  row
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
