'use client';

import CalendarToolbar from './CalendarToolbar';
import SyncStatusBar from './SyncStatusBar';
import WeekView from './WeekView';
import type { CalendarView } from '@/app/portal/(app)/crm/kalendar/CalendarClient';

export default function CalendarShell({
  view,
  onViewChange,
  anchorDate,
  onAnchorChange,
  events,
  selectedEventId,
  onSelectEvent,
  viewerId,
  connection,
}: {
  view: CalendarView;
  onViewChange: (v: CalendarView) => void;
  anchorDate: Date;
  onAnchorChange: (d: Date) => void;
  events: unknown[];
  selectedEventId: string | null;
  onSelectEvent: (id: string | null) => void;
  viewerId: string;
  connection: unknown | null;
  onRefresh: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <CalendarToolbar
        view={view}
        onViewChange={onViewChange}
        anchorDate={anchorDate}
        onAnchorChange={onAnchorChange}
        onCreateNew={() => onSelectEvent('new')}
      />
      <div className="flex-1 overflow-auto bg-coffee">
        {view === 'week' && (
          <WeekView
            anchorDate={anchorDate}
            events={events}
            selectedEventId={selectedEventId}
            onSelectEvent={onSelectEvent}
            viewerId={viewerId}
          />
        )}
        {view === 'day' && (
          <div className="p-8 text-center text-sepia/60 font-mono text-xs uppercase tracking-widest">
            Day view — implementuje se v další fázi
          </div>
        )}
        {view === 'month' && (
          <div className="p-8 text-center text-sepia/60 font-mono text-xs uppercase tracking-widest">
            Month view — implementuje se v další fázi
          </div>
        )}
        {view === 'agenda' && (
          <div className="p-8 text-center text-sepia/60 font-mono text-xs uppercase tracking-widest">
            Agenda — implementuje se v další fázi
          </div>
        )}
      </div>
      <SyncStatusBar connection={connection} eventCount={events.length} />
    </div>
  );
}
