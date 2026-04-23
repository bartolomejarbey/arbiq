'use client';

import { useState, useTransition } from 'react';
import { Send } from 'lucide-react';
import { formatDate } from '@/lib/formatters';

export type ThreadMessage = {
  id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
  author: {
    id: string;
    full_name: string;
    role: 'klient' | 'obchodnik' | 'admin';
  } | null;
};

export default function MessageThread({
  messages,
  currentUserId,
  postAction,
}: {
  messages: ThreadMessage[];
  currentUserId: string;
  postAction: (formData: FormData) => Promise<void>;
}) {
  const [text, setText] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setError(null);
    const fd = new FormData();
    fd.set('content', text.trim());
    startTransition(async () => {
      try {
        await postAction(fd);
        setText('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Nepodařilo se odeslat.');
      }
    });
  }

  return (
    <div className="flex flex-col">
      <ul className="space-y-4 mb-6">
        {messages.length === 0 && (
          <li className="text-sandstone text-sm">Zatím žádné zprávy. Začněte konverzaci níže.</li>
        )}
        {messages.map((m) => {
          const mine = m.author?.id === currentUserId;
          const isTeam = m.author?.role === 'obchodnik' || m.author?.role === 'admin';
          return (
            <li
              key={m.id}
              className={`p-4 max-w-[85%] ${
                mine
                  ? 'ml-auto bg-tobacco/60 border-l-2 border-caramel'
                  : isTeam
                    ? 'bg-coffee border-l-2 border-olive/60'
                    : 'bg-coffee'
              } ${m.is_internal ? 'ring-1 ring-rust/30' : ''}`}
            >
              <div className="flex items-baseline justify-between gap-3 mb-2">
                <span className="text-sepia text-sm font-medium">
                  {m.author?.full_name ?? 'Neznámý'}
                  {m.is_internal && (
                    <span className="ml-2 text-[9px] font-mono uppercase tracking-widest text-rust">
                      Interní
                    </span>
                  )}
                </span>
                <span className="text-sandstone text-xs font-mono">{formatDate(m.created_at)}</span>
              </div>
              <p className="text-moonlight text-sm whitespace-pre-wrap">{m.content}</p>
            </li>
          );
        })}
      </ul>

      <form onSubmit={submit} className="bg-coffee p-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Napište zprávu týmu…"
          rows={3}
          className="w-full bg-espresso border border-tobacco px-4 py-3 text-moonlight placeholder:text-sandstone/50 focus:border-caramel focus:outline-none transition-colors resize-none"
        />
        {error && <p className="text-rust text-xs font-mono mt-2">{error}</p>}
        <div className="flex justify-end mt-3">
          <button
            type="submit"
            disabled={pending || !text.trim()}
            className="inline-flex items-center gap-2 bg-caramel text-espresso px-5 py-2.5 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all disabled:opacity-50 disabled:cursor-wait"
          >
            <Send size={12} />
            {pending ? 'Odesílám…' : 'Odeslat'}
          </button>
        </div>
      </form>
    </div>
  );
}
