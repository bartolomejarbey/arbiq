'use client';

import { useState, useTransition } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { addLeadNote, addClientNote, deleteNote } from '@/lib/actions/notes';

export type NoteRow = {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  author_name: string | null;
};

type Props = {
  /** Buď `lead` nebo `client` — určuje cílovou tabulku a server action. */
  entity: { type: 'lead'; leadId: string } | { type: 'client'; clientId: string };
  initialNotes: NoteRow[];
  currentUserId: string;
};

export default function NotesTimeline({ entity, initialNotes, currentUserId }: Props) {
  const [notes, setNotes] = useState<NoteRow[]>(initialNotes);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    setError(null);

    const fd = new FormData();
    fd.set('content', content);
    if (entity.type === 'lead') fd.set('lead_id', entity.leadId);
    else fd.set('client_id', entity.clientId);

    startTransition(async () => {
      const action = entity.type === 'lead' ? addLeadNote : addClientNote;
      const res = await action(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      // Optimistic add — server revalidatePath také obnoví, ale klient hned vidí.
      setNotes((prev) => [
        {
          id: 'pending-' + Date.now(),
          content,
          created_at: new Date().toISOString(),
          author_id: currentUserId,
          author_name: 'Vy',
        },
        ...prev,
      ]);
      setText('');
    });
  }

  function handleDelete(id: string) {
    if (id.startsWith('pending-')) return;
    if (!confirm('Opravdu smazat poznámku?')) return;
    startTransition(async () => {
      const res = await deleteNote(id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setNotes((prev) => prev.filter((n) => n.id !== id));
    });
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Přidat poznámku… (Shift+Enter = nový řádek)"
          rows={3}
          maxLength={4000}
          disabled={pending}
          className="w-full bg-espresso border border-tobacco text-moonlight px-3 py-2 text-sm focus:border-caramel outline-none resize-none disabled:opacity-50"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit(e as unknown as React.FormEvent);
            }
          }}
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-sandstone/60 font-mono">
            {text.length} / 4000
          </span>
          <button
            type="submit"
            disabled={pending || !text.trim()}
            className="bg-caramel hover:bg-caramel-light disabled:bg-tobacco disabled:text-sandstone text-espresso px-4 py-2 font-mono text-[11px] uppercase tracking-widest font-bold transition-all inline-flex items-center gap-2"
          >
            <Send size={12} />
            {pending ? 'Ukládám…' : 'Přidat'}
          </button>
        </div>
        {error && (
          <p className="text-rust text-xs font-mono border border-rust/40 bg-rust/10 px-3 py-2">{error}</p>
        )}
      </form>

      {notes.length === 0 ? (
        <p className="text-sandstone/60 text-sm italic">Zatím žádné poznámky.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((n) => (
            <li key={n.id} className="bg-espresso/60 border border-tobacco px-4 py-3">
              <div className="flex items-start justify-between gap-3 mb-1">
                <div className="text-[10px] font-mono uppercase tracking-widest text-sandstone">
                  <span className="text-caramel">{n.author_name ?? 'Neznámý'}</span>
                  <span className="mx-2">·</span>
                  <span>{formatRelative(n.created_at)}</span>
                </div>
                {n.author_id === currentUserId && !n.id.startsWith('pending-') && (
                  <button
                    onClick={() => handleDelete(n.id)}
                    disabled={pending}
                    className="text-sandstone/50 hover:text-rust transition-colors disabled:opacity-30"
                    aria-label="Smazat poznámku"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
              <p className="text-sepia text-sm whitespace-pre-wrap leading-relaxed">{n.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'právě teď';
  if (min < 60) return `${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} d`;
  return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' });
}
