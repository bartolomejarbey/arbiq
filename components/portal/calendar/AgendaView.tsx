'use client';

import { format, addDays, isToday, startOfDay } from 'date-fns';
import { cs } from 'date-fns/locale';

type EventLike = {
  id: string;
  owner_id: string;
  title: string;
  location: string | null;
  start_at: string;
  end_at: string;
  visibility: 'private' | 'shared';
};

export default function AgendaView({
  anchorDate,
  events,
  onSelectEvent,
}: {
  anchorDate: Date;
  events: unknown[];
  selectedEventId: string | null;
  onSelectEvent: (id: string | null) => void;
  viewerId: string;
}) {
  const typedEvents = events as EventLike[];
  const days = Array.from({ length: 30 }, (_, i) => addDays(anchorDate, i));
  const dayBuckets = days
    .map(d => ({
      date: d,
      events: typedEvents.filter(
        e => startOfDay(new Date(e.start_at)).getTime() === startOfDay(d).getTime(),
      ),
    }))
    .filter(b => b.events.length > 0);

  if (dayBuckets.length === 0) {
    return (
      <div className="p-12 text-center text-sepia/60 font-mono text-xs uppercase tracking-widest">
        Žádné eventy v nejbližších 30 dnech.
      </div>
    );
  }

  return (
    <div className="divide-y divide-tobacco">
      {dayBuckets.map(b => (
        <div
          key={b.date.toISOString()}
          className="grid grid-cols-[120px_1fr] gap-6 p-4"
        >
          <div className="font-mono text-xs uppercase tracking-widest">
            <div
              className={isToday(b.date) ? 'text-caramel font-bold' : 'text-sandstone'}
            >
              {format(b.date, 'EEEE', { locale: cs })}
            </div>
            <div className="text-moonlight text-2xl font-display font-black mt-1">
              {format(b.date, 'd')}
            </div>
            <div className="text-sandstone">{format(b.date, 'LLLL', { locale: cs })}</div>
          </div>
          <div className="space-y-2">
            {b.events.map(e => {
              const isShared = e.visibility === 'shared';
              return (
                <button
                  key={e.id}
                  onClick={() => onSelectEvent(e.id)}
                  className={`block w-full text-left border-l-4 ${
                    isShared ? 'border-parchment-gold' : 'border-caramel'
                  } bg-coffee p-3 hover:bg-tobacco/30`}
                >
                  <div className="font-mono text-[10px] uppercase tracking-widest text-caramel">
                    {format(new Date(e.start_at), 'HH:mm')}–
                    {format(new Date(e.end_at), 'HH:mm')}
                    {isShared && (
                      <span className="ml-2 text-parchment-gold">◈ TEAM</span>
                    )}
                  </div>
                  <div className="text-moonlight text-sm mt-1">{e.title}</div>
                  {e.location && (
                    <div className="text-sepia/60 text-xs mt-1">{e.location}</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
