'use client';

import { differenceInMinutes, format } from 'date-fns';

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

export default function EventBlock({
  event,
  hourHeight,
  startHour,
  viewerId,
  selected,
  onClick,
}: {
  event: EventForBlock;
  hourHeight: number;
  startHour: number;
  viewerId: string;
  selected: boolean;
  onClick: () => void;
}) {
  const start = new Date(event.start_at);
  const end = new Date(event.end_at);
  const startMin = start.getHours() * 60 + start.getMinutes() - startHour * 60;
  const durationMin = differenceInMinutes(end, start);
  const top = (startMin / 60) * hourHeight;
  const height = Math.max(22, (durationMin / 60) * hourHeight);

  const isOwn = event.owner_id === viewerId;
  const isShared = event.visibility === 'shared';
  const hasCrmLink = !!(event.lead_id || event.client_id || event.project_id);

  let cls = '';
  if (event.sync_status === 'error') {
    cls = 'bg-rust/15 border-l-[3px] border-rust text-rust';
  } else if (isShared) {
    cls =
      'bg-parchment-gold/14 border-l-[3px] border-parchment-gold text-parchment-gold';
  } else if (isOwn) {
    cls = 'bg-caramel/18 border-l-[3px] border-caramel text-parchment-gold';
  } else {
    cls = 'bg-sandstone/12 border-l-[3px] border-sandstone text-sandstone italic';
  }
  if (selected) cls += ' ring-2 ring-caramel ring-offset-1 ring-offset-coffee';

  const crmBadge = event.lead?.case_number
    ? `→ LEAD ${event.lead.case_number}`
    : event.client?.full_name
      ? `→ KLIENT ${event.client.full_name}`
      : event.project?.name
        ? `→ PROJEKT ${event.project.name}`
        : null;

  return (
    <button
      onClick={onClick}
      className={`absolute left-1 right-1 px-2 py-1 text-left overflow-hidden ${cls}`}
      style={{ top, height }}
    >
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
    </button>
  );
}
