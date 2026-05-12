'use client';

import { differenceInMinutes, format } from 'date-fns';
import { useRef, useState } from 'react';

type EventForBlock = {
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
  lead?: { case_number?: string | null } | null;
  client?: { full_name?: string | null } | null;
  project?: { name?: string | null } | null;
};

const SNAP_MIN = 15;

export default function EventBlock({
  event,
  hourHeight,
  startHour,
  viewerId,
  selected,
  onClick,
  onMove,
}: {
  event: EventForBlock;
  hourHeight: number;
  startHour: number;
  viewerId: string;
  selected: boolean;
  onClick: () => void;
  onMove?: (id: string, newStart: Date, newEnd: Date) => void;
}) {
  const start = new Date(event.start_at);
  const end = new Date(event.end_at);
  const startMin = start.getHours() * 60 + start.getMinutes() - startHour * 60;
  const durationMin = differenceInMinutes(end, start);
  const baseTop = (startMin / 60) * hourHeight;
  const baseHeight = Math.max(22, (durationMin / 60) * hourHeight);

  const isOwn = event.owner_id === viewerId;
  const isShared = event.visibility === 'shared';
  const canDrag = !!onMove && isOwn;

  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [dragMode, setDragMode] = useState<'move' | 'top' | 'bottom' | null>(null);
  const [resizeDeltaTop, setResizeDeltaTop] = useState(0);
  const [resizeDeltaBottom, setResizeDeltaBottom] = useState(0);
  const movedRef = useRef(false);

  let cls = '';
  if (event.sync_status === 'error') {
    cls = 'bg-rust/15 border-l-[3px] border-rust text-rust';
  } else if (isShared) {
    cls = 'bg-parchment-gold/14 border-l-[3px] border-parchment-gold text-parchment-gold';
  } else if (isOwn) {
    cls = 'bg-caramel/18 border-l-[3px] border-caramel text-parchment-gold';
  } else {
    cls = 'bg-sandstone/12 border-l-[3px] border-sandstone text-sandstone italic';
  }
  if (selected) cls += ' ring-2 ring-caramel ring-offset-1 ring-offset-coffee';
  if (dragMode) cls += ' opacity-80 z-20';

  const crmBadge = event.lead?.case_number
    ? `→ LEAD ${event.lead.case_number}`
    : event.client?.full_name
      ? `→ KLIENT ${event.client.full_name}`
      : event.project?.name
        ? `→ PROJEKT ${event.project.name}`
        : null;

  function startDrag(mode: 'move' | 'top' | 'bottom', e: React.PointerEvent) {
    if (!canDrag) return;
    e.preventDefault();
    e.stopPropagation();
    const startClientY = e.clientY;
    movedRef.current = false;
    setDragMode(mode);

    function snapMin(dy: number): number {
      return Math.round((dy / hourHeight) * 60 / SNAP_MIN) * SNAP_MIN;
    }

    function onMoveDrag(ev: PointerEvent) {
      const dy = ev.clientY - startClientY;
      if (Math.abs(dy) > 3) movedRef.current = true;
      if (mode === 'move') {
        setDragOffsetY(dy);
      } else if (mode === 'top') {
        // Don't allow shrinking below 15 min
        const cap = baseHeight - (SNAP_MIN / 60) * hourHeight;
        setResizeDeltaTop(Math.min(cap, dy));
      } else if (mode === 'bottom') {
        const cap = -baseHeight + (SNAP_MIN / 60) * hourHeight;
        setResizeDeltaBottom(Math.max(cap, dy));
      }
    }

    function onUp(ev: PointerEvent) {
      window.removeEventListener('pointermove', onMoveDrag);
      window.removeEventListener('pointerup', onUp);

      const dy = ev.clientY - startClientY;
      const minutes = snapMin(dy);

      setDragMode(null);
      setDragOffsetY(0);
      setResizeDeltaTop(0);
      setResizeDeltaBottom(0);

      if (!movedRef.current || minutes === 0) {
        // Treat as click — but onClick already handles native; do nothing extra
        return;
      }

      if (mode === 'move') {
        const newStart = new Date(start.getTime() + minutes * 60_000);
        const newEnd = new Date(end.getTime() + minutes * 60_000);
        onMove?.(event.id, newStart, newEnd);
      } else if (mode === 'top') {
        const newStart = new Date(start.getTime() + minutes * 60_000);
        if (newStart >= end) return;
        onMove?.(event.id, newStart, end);
      } else if (mode === 'bottom') {
        const newEnd = new Date(end.getTime() + minutes * 60_000);
        if (newEnd <= start) return;
        onMove?.(event.id, start, newEnd);
      }
    }

    window.addEventListener('pointermove', onMoveDrag);
    window.addEventListener('pointerup', onUp);
  }

  // Visual position with drag delta applied
  const visualTop = baseTop + dragOffsetY + resizeDeltaTop;
  const visualHeight = baseHeight - resizeDeltaTop + resizeDeltaBottom;

  return (
    <div
      onClick={e => {
        if (movedRef.current) {
          e.stopPropagation();
          movedRef.current = false;
          return;
        }
        onClick();
      }}
      onPointerDown={canDrag ? e => startDrag('move', e) : undefined}
      className={`absolute left-1 right-1 px-2 py-1 text-left overflow-hidden cursor-pointer ${cls} ${
        canDrag ? 'select-none' : ''
      }`}
      style={{ top: visualTop, height: visualHeight }}
      role="button"
      tabIndex={0}
    >
      {canDrag && (
        <div
          onPointerDown={e => startDrag('top', e)}
          className="absolute top-0 left-0 right-0 h-1.5 cursor-ns-resize hover:bg-caramel/40"
        />
      )}
      {isShared && (
        <span className="block font-mono text-[8px] uppercase tracking-widest mb-0.5">
          ◈ TEAM
        </span>
      )}
      {!isOwn && !isShared && (
        <span className="block font-mono text-[8px] uppercase tracking-widest mb-0.5">
          🔒 soukromé · Google
        </span>
      )}
      <strong className="block text-xs leading-tight">{event.title}</strong>
      <span className="block font-mono text-[9px] uppercase tracking-wider opacity-80 mt-0.5">
        {format(start, 'HH:mm')}–{format(end, 'HH:mm')}
        {event.location && ` · ${event.location}`}
        {event.meet_link && ' · Meet'}
      </span>
      {crmBadge && (
        <span className="block font-mono text-[8px] uppercase tracking-wider mt-1 border-b border-dashed border-current pb-px inline-block">
          {crmBadge}
        </span>
      )}
      {canDrag && (
        <div
          onPointerDown={e => startDrag('bottom', e)}
          className="absolute bottom-0 left-0 right-0 h-1.5 cursor-ns-resize hover:bg-caramel/40"
        />
      )}
    </div>
  );
}
