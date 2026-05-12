'use client';

import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import {
  format,
  addDays,
  addWeeks,
  addMonths,
  startOfWeek,
  startOfMonth,
  startOfDay,
} from 'date-fns';
import { cs } from 'date-fns/locale';
import type { CalendarView } from '@/app/portal/(app)/crm/kalendar/CalendarClient';

const VIEWS: { id: CalendarView; label: string }[] = [
  { id: 'day', label: 'Den' },
  { id: 'week', label: 'Týden' },
  { id: 'month', label: 'Měsíc' },
  { id: 'agenda', label: 'Agenda' },
];

export default function CalendarToolbar({
  view,
  onViewChange,
  anchorDate,
  onAnchorChange,
  onCreateNew,
}: {
  view: CalendarView;
  onViewChange: (v: CalendarView) => void;
  anchorDate: Date;
  onAnchorChange: (d: Date) => void;
  onCreateNew: () => void;
}) {
  function prev() {
    if (view === 'day') onAnchorChange(addDays(anchorDate, -1));
    if (view === 'week') onAnchorChange(addWeeks(anchorDate, -1));
    if (view === 'month') onAnchorChange(addMonths(anchorDate, -1));
    if (view === 'agenda') onAnchorChange(addDays(anchorDate, -7));
  }
  function next() {
    if (view === 'day') onAnchorChange(addDays(anchorDate, 1));
    if (view === 'week') onAnchorChange(addWeeks(anchorDate, 1));
    if (view === 'month') onAnchorChange(addMonths(anchorDate, 1));
    if (view === 'agenda') onAnchorChange(addDays(anchorDate, 7));
  }
  function today() {
    const now = new Date();
    if (view === 'week') onAnchorChange(startOfWeek(now, { weekStartsOn: 1 }));
    else if (view === 'month') onAnchorChange(startOfMonth(now));
    else onAnchorChange(startOfDay(now));
  }

  const title = format(anchorDate, view === 'day' ? 'd. MMMM yyyy' : 'LLLL yyyy', {
    locale: cs,
  });

  return (
    <div className="bg-coffee border-b border-tobacco px-6 py-3 flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-4">
        <h2 className="font-display italic font-black text-xl text-moonlight capitalize">
          {title}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={prev}
            className="border border-tobacco px-2 py-1.5 text-sandstone hover:text-moonlight hover:border-caramel/50"
            aria-label="Předchozí"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={today}
            className="border border-tobacco px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-sandstone hover:text-moonlight hover:border-caramel/50"
          >
            Dnes
          </button>
          <button
            onClick={next}
            className="border border-tobacco px-2 py-1.5 text-sandstone hover:text-moonlight hover:border-caramel/50"
            aria-label="Další"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex">
          {VIEWS.map((v, i) => (
            <button
              key={v.id}
              onClick={() => onViewChange(v.id)}
              className={`border border-tobacco px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest ${
                view === v.id
                  ? 'bg-caramel text-espresso border-caramel'
                  : 'text-sandstone hover:text-moonlight hover:border-caramel/50'
              } ${i > 0 ? '-ml-px' : ''}`}
            >
              {v.label}
            </button>
          ))}
        </div>
        <button
          onClick={onCreateNew}
          className="inline-flex items-center gap-2 bg-caramel text-espresso px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest font-bold hover:bg-caramel-light"
        >
          <Plus size={12} /> Nová schůzka
        </button>
      </div>
    </div>
  );
}
