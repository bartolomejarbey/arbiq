'use client';

import {
  startOfMonth,
  startOfWeek,
  addDays,
  isSameMonth,
  isToday,
  format,
} from 'date-fns';

const DAYS_OF_WEEK = ['PO', 'ÚT', 'ST', 'ČT', 'PÁ', 'SO', 'NE'];

type EventLike = {
  id: string;
  owner_id: string;
  title: string;
  start_at: string;
  visibility: 'private' | 'shared';
};

export default function MonthView({
  anchorDate,
  events,
  onSelectEvent,
  viewerId,
}: {
  anchorDate: Date;
  events: unknown[];
  selectedEventId: string | null;
  onSelectEvent: (id: string | null) => void;
  viewerId: string;
}) {
  const monthStart = startOfMonth(anchorDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const typedEvents = events as EventLike[];

  return (
    <div className="grid h-full" style={{ gridTemplateRows: 'auto repeat(6, 1fr)' }}>
      <div className="grid grid-cols-7 border-b border-tobacco">
        {DAYS_OF_WEEK.map(d => (
          <div
            key={d}
            className="text-center py-2 font-mono text-[9px] uppercase tracking-widest text-sandstone"
          >
            {d}
          </div>
        ))}
      </div>
      {Array.from({ length: 6 }, (_, row) => (
        <div key={row} className="grid grid-cols-7 border-b border-tobacco">
          {cells.slice(row * 7, row * 7 + 7).map(d => {
            const dayEvents = typedEvents.filter(e => isSameDay(new Date(e.start_at), d));
            const inMonth = isSameMonth(d, anchorDate);
            return (
              <div
                key={d.toISOString()}
                className={`border-r border-tobacco p-1 overflow-hidden ${
                  isToday(d) ? 'bg-caramel/8' : ''
                } ${inMonth ? '' : 'opacity-40'}`}
              >
                <div
                  className={`font-mono text-xs ${
                    isToday(d) ? 'text-caramel font-bold' : 'text-sandstone'
                  }`}
                >
                  {format(d, 'd')}
                </div>
                <div className="space-y-0.5 mt-1">
                  {dayEvents.slice(0, 3).map(e => {
                    const isOwn = e.owner_id === viewerId;
                    const isShared = e.visibility === 'shared';
                    const cls = isShared
                      ? 'border-parchment-gold bg-parchment-gold/15 text-parchment-gold'
                      : isOwn
                        ? 'border-caramel bg-caramel/15 text-parchment-gold'
                        : 'border-sandstone bg-sandstone/10 text-sandstone';
                    return (
                      <button
                        key={e.id}
                        onClick={() => onSelectEvent(e.id)}
                        className={`block w-full text-left text-[10px] truncate border-l-2 px-1 py-0.5 ${cls}`}
                      >
                        {format(new Date(e.start_at), 'HH:mm')} {e.title}
                      </button>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <div className="text-[9px] text-sandstone font-mono pl-1">
                      +{dayEvents.length - 3} dalších
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
