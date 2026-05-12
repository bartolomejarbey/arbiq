'use client';

import CalendarToolbar from './CalendarToolbar';
import SyncStatusBar from './SyncStatusBar';
import WeekView from './WeekView';
import DayView from './DayView';
import MonthView from './MonthView';
import AgendaView from './AgendaView';
import EventBlock from './EventBlock';
import EventSidePanel from './EventSidePanel';
import EventEditForm from './EventEditForm';
import type { CalendarView } from '@/app/portal/(app)/crm/kalendar/CalendarClient';

type EventLike = { id: string; [key: string]: unknown };

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
  onRefresh,
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
  const selectedEvent =
    selectedEventId && selectedEventId !== 'new'
      ? (events as EventLike[]).find(e => e.id === selectedEventId)
      : null;

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
          <DayView
            anchorDate={anchorDate}
            events={events}
            selectedEventId={selectedEventId}
            onSelectEvent={onSelectEvent}
            viewerId={viewerId}
          />
        )}
        {view === 'month' && (
          <MonthView
            anchorDate={anchorDate}
            events={events}
            selectedEventId={selectedEventId}
            onSelectEvent={onSelectEvent}
            viewerId={viewerId}
          />
        )}
        {view === 'agenda' && (
          <AgendaView
            anchorDate={anchorDate}
            events={events}
            selectedEventId={selectedEventId}
            onSelectEvent={onSelectEvent}
            viewerId={viewerId}
          />
        )}
      </div>
      <SyncStatusBar connection={connection} eventCount={events.length} />

      {selectedEventId === 'new' && (
        <EventEditForm
          onCancel={() => onSelectEvent(null)}
          onSaved={() => {
            onSelectEvent(null);
            onRefresh();
          }}
        />
      )}
      {selectedEvent && (
        <EventSidePanel
          event={selectedEvent}
          viewerId={viewerId}
          onClose={() => onSelectEvent(null)}
          onUpdated={onRefresh}
        />
      )}
    </div>
  );
}
