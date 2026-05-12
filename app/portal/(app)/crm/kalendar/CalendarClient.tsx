'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  addDays,
  subWeeks,
  addWeeks,
  addMonths,
} from 'date-fns';
import CalendarShell from '@/components/portal/calendar/CalendarShell';
import { moveEvent } from '@/lib/actions/calendar';

type EventLike = { id: string; start_at: string; end_at: string; [k: string]: unknown };

export type CalendarView = 'day' | 'week' | 'month' | 'agenda';

export default function CalendarClient({
  initialEvents,
  viewerId,
  connection,
}: {
  initialEvents: unknown[];
  viewerId: string;
  connection: unknown | null;
}) {
  const [view, setView] = useState<CalendarView>('week');
  const [anchorDate, setAnchorDate] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [events, setEvents] = useState<unknown[]>(initialEvents);
  const [refreshKey, setRefreshKey] = useState(0);
  const [, startTransition] = useTransition();

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  const handleMoveEvent = useCallback(
    (id: string, newStart: Date, newEnd: Date) => {
      // Optimistic update
      setEvents(prev =>
        (prev as EventLike[]).map(e =>
          e.id === id
            ? { ...e, start_at: newStart.toISOString(), end_at: newEnd.toISOString() }
            : e,
        ),
      );
      startTransition(async () => {
        const res = await moveEvent({
          id,
          start_at: newStart.toISOString(),
          end_at: newEnd.toISOString(),
        });
        if (!res.ok) {
          // Rollback by refetching
          refresh();
          if (typeof window !== 'undefined') alert('Přesun se nepodařil: ' + res.error);
        }
      });
    },
    [refresh],
  );

  const rangeForView = useCallback(
    (v: CalendarView, anchor: Date): { from: string; to: string } => {
      if (v === 'day')
        return { from: startOfDay(anchor).toISOString(), to: endOfDay(anchor).toISOString() };
      if (v === 'week')
        return {
          from: startOfWeek(anchor, { weekStartsOn: 1 }).toISOString(),
          to: endOfWeek(anchor, { weekStartsOn: 1 }).toISOString(),
        };
      if (v === 'month')
        return {
          from: startOfMonth(anchor).toISOString(),
          to: endOfMonth(anchor).toISOString(),
        };
      return { from: anchor.toISOString(), to: addDays(anchor, 30).toISOString() };
    },
    [],
  );

  useEffect(() => {
    const { from, to } = rangeForView(view, anchorDate);
    fetch(`/api/calendar/events?from=${from}&to=${to}`)
      .then(r => r.json())
      .then(d => setEvents(d.events ?? []))
      .catch(console.error);
  }, [view, anchorDate, refreshKey, rangeForView]);

  // Mobile default → agenda
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setView('agenda');
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navNext();
      } else if (e.key === 't' || e.key === 'T') goToday();
      else if (e.key === 'd' || e.key === 'D') setView('day');
      else if (e.key === 'w' || e.key === 'W') setView('week');
      else if (e.key === 'm' || e.key === 'M') setView('month');
      else if (e.key === 'a' || e.key === 'A') setView('agenda');
      else if (e.key === 'n' || e.key === 'N') setSelectedEventId('new');
      else if (e.key === 'Escape') setSelectedEventId(null);
    }
    function navPrev() {
      if (view === 'day') setAnchorDate(d => addDays(d, -1));
      else if (view === 'week') setAnchorDate(d => subWeeks(d, 1));
      else if (view === 'month') setAnchorDate(d => addMonths(d, -1));
      else setAnchorDate(d => addDays(d, -7));
    }
    function navNext() {
      if (view === 'day') setAnchorDate(d => addDays(d, 1));
      else if (view === 'week') setAnchorDate(d => addWeeks(d, 1));
      else if (view === 'month') setAnchorDate(d => addMonths(d, 1));
      else setAnchorDate(d => addDays(d, 7));
    }
    function goToday() {
      const now = new Date();
      if (view === 'week') setAnchorDate(startOfWeek(now, { weekStartsOn: 1 }));
      else if (view === 'month') setAnchorDate(startOfMonth(now));
      else setAnchorDate(startOfDay(now));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view]);

  return (
    <CalendarShell
      view={view}
      onViewChange={setView}
      anchorDate={anchorDate}
      onAnchorChange={setAnchorDate}
      events={events}
      selectedEventId={selectedEventId}
      onSelectEvent={setSelectedEventId}
      viewerId={viewerId}
      connection={connection}
      onRefresh={refresh}
      onMoveEvent={handleMoveEvent}
    />
  );
}
