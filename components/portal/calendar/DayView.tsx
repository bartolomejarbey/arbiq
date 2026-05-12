'use client';

import { format, isToday, startOfDay } from 'date-fns';
import { cs } from 'date-fns/locale';
import EventBlock from './EventBlock';

const HOUR_HEIGHT = 60;
const START_HOUR = 6;
const END_HOUR = 23;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

type EventLike = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_at: string;
  end_at: string;
  visibility: 'private' | 'shared';
  meet_link: string | null;
  sync_status: 'pending' | 'synced' | 'error';
  lead_id: string | null;
  client_id: string | null;
  project_id: string | null;
};

export default function DayView({
  anchorDate,
  events,
  selectedEventId,
  onSelectEvent,
  viewerId,
  onMoveEvent,
}: {
  anchorDate: Date;
  events: unknown[];
  selectedEventId: string | null;
  onSelectEvent: (id: string | null) => void;
  viewerId: string;
  onMoveEvent?: (id: string, newStart: Date, newEnd: Date) => void;
}) {
  const typedEvents = events as EventLike[];
  const dayEvents = typedEvents.filter(
    e => startOfDay(new Date(e.start_at)).getTime() === startOfDay(anchorDate).getTime(),
  );

  return (
    <div className="grid h-full" style={{ gridTemplateColumns: '72px 1fr' }}>
      <div className="border-r border-tobacco" />
      <div
        className={`border-b border-tobacco text-center py-3 ${
          isToday(anchorDate) ? 'bg-caramel/8' : ''
        }`}
      >
        <div className="font-mono text-[9px] uppercase tracking-widest text-sandstone">
          {format(anchorDate, 'EEEE', { locale: cs })}
        </div>
        <div
          className={`font-display font-black text-3xl mt-1 ${
            isToday(anchorDate) ? 'text-caramel' : 'text-moonlight'
          }`}
        >
          {format(anchorDate, 'd. LLLL', { locale: cs })}
        </div>
      </div>

      <div className="border-r border-tobacco">
        {HOURS.map(h => (
          <div
            key={h}
            className="text-right pr-3 pt-1 font-mono text-[10px] text-sandstone"
            style={{ height: HOUR_HEIGHT }}
          >
            {String(h).padStart(2, '0')}:00
          </div>
        ))}
      </div>

      <div className="relative" style={{ height: HOURS.length * HOUR_HEIGHT }}>
        {HOURS.map(h => (
          <div
            key={h}
            className="border-b border-tobacco/40"
            style={{ height: HOUR_HEIGHT }}
          />
        ))}
        {isToday(anchorDate) && (
          <div
            className="absolute left-0 right-0 border-t-2 border-rust pointer-events-none z-10"
            style={{
              top:
                ((new Date().getHours() - START_HOUR) * 60 + new Date().getMinutes()) /
                60 *
                HOUR_HEIGHT,
            }}
          >
            <div className="w-2 h-2 bg-rust -ml-1 -mt-1" />
          </div>
        )}
        {dayEvents.map(e => (
          <EventBlock
            key={e.id}
            event={e}
            hourHeight={HOUR_HEIGHT}
            startHour={START_HOUR}
            viewerId={viewerId}
            selected={e.id === selectedEventId}
            onClick={() => onSelectEvent(e.id)}
            onMove={onMoveEvent}
          />
        ))}
      </div>
    </div>
  );
}
