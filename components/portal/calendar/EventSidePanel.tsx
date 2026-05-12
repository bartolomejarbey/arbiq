'use client';

import { useState, useTransition } from 'react';
import { X, Edit2, Trash2, Video, MapPin, Users, Link2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import Link from 'next/link';
import { deleteEvent } from '@/lib/actions/calendar';
import EventEditForm from './EventEditForm';

type Attendee = { email: string; responseStatus?: string };

type EventDetail = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_at: string;
  end_at: string;
  all_day: boolean;
  timezone: string;
  visibility: 'private' | 'shared';
  attendees: Attendee[];
  meet_link: string | null;
  sync_status: 'pending' | 'synced' | 'error';
  sync_error: string | null;
  lead_id: string | null;
  client_id: string | null;
  project_id: string | null;
  lead?: { id: string; name?: string; case_number?: string | null } | null;
  client?: { id: string; full_name?: string | null } | null;
  project?: { id: string; name?: string | null } | null;
};

export default function EventSidePanel({
  event,
  viewerId,
  onClose,
  onUpdated,
}: {
  event: unknown;
  viewerId: string;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const e = event as EventDetail;
  const isOwner = e.owner_id === viewerId;

  function handleDelete() {
    if (!confirm(`Smazat event "${e.title}"?`)) return;
    startTransition(async () => {
      const res = await deleteEvent(e.id);
      if (res.ok) {
        onClose();
        onUpdated();
      }
    });
  }

  if (editing) {
    return (
      <EventEditForm
        event={e}
        onCancel={() => setEditing(false)}
        onSaved={() => {
          setEditing(false);
          onUpdated();
        }}
      />
    );
  }

  const hasConflict = e.sync_status === 'error' && e.sync_error?.startsWith('CONFLICT:');

  return (
    <aside className="fixed inset-x-0 bottom-0 top-16 md:right-0 md:left-auto md:w-[420px] bg-coffee md:border-l border-tobacco overflow-y-auto z-30">
      <header className="flex items-start justify-between px-5 py-4 border-b border-tobacco sticky top-0 bg-coffee z-10">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-widest text-sandstone mb-1">
            Detail eventu
          </div>
          <h3 className="font-display italic text-xl text-moonlight leading-tight">
            {e.title}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-sandstone hover:text-moonlight"
          aria-label="Zavřít"
        >
          <X size={18} />
        </button>
      </header>

      <div className="px-5 py-4 space-y-5 text-sm">
        {e.sync_status === 'error' && (
          <div
            className={`border-l-4 ${
              hasConflict ? 'border-rust bg-rust/15' : 'border-rust bg-rust/10'
            } p-3 flex gap-2`}
          >
            <AlertTriangle size={14} className="text-rust shrink-0 mt-0.5" />
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-rust mb-1">
                {hasConflict ? 'Konflikt s Google' : 'Chyba synchronizace'}
              </p>
              <p className="text-xs text-sepia">
                {hasConflict
                  ? 'Tento event byl změněn jinde. Zobrazena je ARBIQ verze. Pro převzetí Google verze klikněte "Synchronizovat teď" v nastavení.'
                  : e.sync_error ?? 'neznámá chyba'}
              </p>
            </div>
          </div>
        )}

        <section>
          <p className="font-mono text-[10px] uppercase tracking-widest text-sandstone mb-1">
            Čas
          </p>
          <p className="text-moonlight">
            {format(new Date(e.start_at), 'd. LLLL yyyy', { locale: cs })}
            <br />
            <span className="font-mono">
              {format(new Date(e.start_at), 'HH:mm')}–
              {format(new Date(e.end_at), 'HH:mm')}
            </span>
          </p>
        </section>

        {e.location && (
          <section>
            <p className="font-mono text-[10px] uppercase tracking-widest text-sandstone mb-1 flex items-center gap-1">
              <MapPin size={11} /> Místo
            </p>
            <p className="text-moonlight">{e.location}</p>
          </section>
        )}

        {e.meet_link && (
          <section>
            <p className="font-mono text-[10px] uppercase tracking-widest text-sandstone mb-1 flex items-center gap-1">
              <Video size={11} /> Google Meet
            </p>
            <a
              href={e.meet_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-caramel hover:text-caramel-light break-all"
            >
              {e.meet_link}
            </a>
          </section>
        )}

        {e.description && (
          <section>
            <p className="font-mono text-[10px] uppercase tracking-widest text-sandstone mb-1">
              Popis
            </p>
            <p className="text-sepia whitespace-pre-wrap">{e.description}</p>
          </section>
        )}

        {Array.isArray(e.attendees) && e.attendees.length > 0 && (
          <section>
            <p className="font-mono text-[10px] uppercase tracking-widest text-sandstone mb-1 flex items-center gap-1">
              <Users size={11} /> Účastníci
            </p>
            <ul className="space-y-1">
              {e.attendees.map(a => (
                <li
                  key={a.email}
                  className="text-sepia text-xs flex items-center justify-between"
                >
                  <span>{a.email}</span>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-sandstone">
                    {a.responseStatus ?? 'needsAction'}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {(e.lead || e.client || e.project) && (
          <section>
            <p className="font-mono text-[10px] uppercase tracking-widest text-sandstone mb-1 flex items-center gap-1">
              <Link2 size={11} /> CRM
            </p>
            {e.lead && (
              <Link
                href={`/portal/crm/leady`}
                className="text-caramel hover:text-caramel-light text-sm"
              >
                → LEAD {e.lead.case_number} · {e.lead.name}
              </Link>
            )}
            {e.client && (
              <Link
                href={`/portal/crm/klient/${e.client.id}`}
                className="text-caramel hover:text-caramel-light text-sm"
              >
                → KLIENT · {e.client.full_name}
              </Link>
            )}
            {e.project && (
              <Link
                href={`/portal/admin/projekt/${e.project.id}`}
                className="text-caramel hover:text-caramel-light text-sm"
              >
                → PROJEKT · {e.project.name}
              </Link>
            )}
          </section>
        )}

        <section>
          <p className="font-mono text-[10px] uppercase tracking-widest text-sandstone mb-1">
            Viditelnost
          </p>
          <p className="text-moonlight">
            {e.visibility === 'shared' ? '◈ Sdíleno s týmem' : '🔒 Soukromé'}
          </p>
        </section>
      </div>

      {isOwner && (
        <footer className="px-5 py-4 border-t border-tobacco sticky bottom-0 bg-coffee flex items-center justify-between">
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 bg-caramel text-espresso px-4 py-2 font-mono text-[10px] uppercase tracking-widest font-bold hover:bg-caramel-light"
          >
            <Edit2 size={12} /> Upravit
          </button>
          <button
            onClick={handleDelete}
            disabled={pending}
            className="inline-flex items-center gap-2 text-rust hover:text-rust/80 font-mono text-[10px] uppercase tracking-widest disabled:opacity-50"
          >
            <Trash2 size={12} /> {pending ? 'Mažu…' : 'Smazat'}
          </button>
        </footer>
      )}
    </aside>
  );
}
