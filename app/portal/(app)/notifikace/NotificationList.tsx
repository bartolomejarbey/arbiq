'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Check, CheckCheck } from 'lucide-react';
import { formatDateTime } from '@/lib/formatters';
import { markNotificationRead, markAllNotificationsRead } from '@/lib/actions/notifications';

export type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export default function NotificationList({ initial }: { initial: NotificationRow[] }) {
  const [items, setItems] = useState(initial);
  const [pending, startTransition] = useTransition();
  const hasUnread = items.some((n) => !n.read_at);

  function onRead(id: string) {
    setItems((xs) => xs.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
    startTransition(() => { void markNotificationRead(id); });
  }
  function onReadAll() {
    setItems((xs) => xs.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    startTransition(() => { void markAllNotificationsRead(); });
  }

  if (items.length === 0) {
    return <p className="text-sandstone text-sm bg-coffee p-8">Žádná oznámení.</p>;
  }

  return (
    <div className="space-y-3">
      {hasUnread && (
        <button
          onClick={onReadAll}
          disabled={pending}
          className="inline-flex items-center gap-2 text-sandstone hover:text-caramel font-mono text-[10px] uppercase tracking-widest disabled:opacity-50"
        >
          <CheckCheck size={14} /> Označit vše jako přečtené
        </button>
      )}
      <ul className="space-y-2">
        {items.map((n) => {
          const unread = !n.read_at;
          const inner = (
            <div className={`flex items-start justify-between gap-4 p-4 ${unread ? 'bg-coffee border-l-2 border-caramel' : 'bg-coffee/40 border-l-2 border-transparent'}`}>
              <div className="min-w-0">
                <div className={`text-sm ${unread ? 'text-moonlight font-medium' : 'text-sepia'}`}>{n.title}</div>
                {n.body && <div className="text-sandstone text-xs mt-0.5">{n.body}</div>}
                <div className="text-sandstone/60 font-mono text-[10px] mt-1">{formatDateTime(n.created_at)}</div>
              </div>
              {unread && (
                <button
                  onClick={(e) => { e.preventDefault(); onRead(n.id); }}
                  className="shrink-0 text-sandstone hover:text-olive"
                  title="Označit jako přečtené"
                >
                  <Check size={16} />
                </button>
              )}
            </div>
          );
          return (
            <li key={n.id}>
              {n.link ? <Link href={n.link} onClick={() => unread && onRead(n.id)}>{inner}</Link> : inner}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
