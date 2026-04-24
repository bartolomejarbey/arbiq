'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';
import { track } from '@/lib/track';

const VISITOR_KEY = 'arbiq_anon_id';
const SESSION_KEY = 'arbiq_chat_session';

type Msg = { role: 'user' | 'assistant'; content: string };

function getVisitorId(): string {
  if (typeof window === 'undefined') return 'srv';
  let id = window.localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = 'a-' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
    window.localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

const GREETING: Msg = {
  role: 'assistant',
  content: 'Dobrý den, jsem Pomocník Watson. Pomáhám návštěvníkům arbiq.cz odpovídat na otázky — co Vás zajímá? (Cena? Reference? Jak začít?)',
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.sessionStorage.getItem(SESSION_KEY);
    if (stored) setSessionId(stored);
  }, []);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [open, messages]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;

    setError(null);
    setInput('');
    const userMsg: Msg = { role: 'user', content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setSending(true);

    track('chat_message', { length: text.length });

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          visitor_id: getVisitorId(),
          page_path: window.location.pathname,
          message: text,
          history: next.slice(-10).filter((m) => m !== GREETING).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        session_id?: string;
        reply?: string;
        error?: string;
        remaining?: number;
      };

      if (!res.ok || !data.reply) {
        throw new Error(data.error ?? 'Chyba při odesílání zprávy.');
      }

      if (data.session_id && data.session_id !== sessionId) {
        setSessionId(data.session_id);
        window.sessionStorage.setItem(SESSION_KEY, data.session_id);
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply! }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při odesílání.');
      setMessages((prev) => prev.slice(0, -1));
      setInput(text);
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => { setOpen(true); track('chat_open'); }}
          className="group fixed bottom-6 right-6 z-[60] bg-caramel hover:bg-caramel-light text-espresso flex items-center gap-2 pl-3 pr-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.4)] transition-all hover:scale-105 font-mono text-xs uppercase tracking-widest font-bold"
          aria-label="Otevřít chat s Watsonem"
        >
          <MessageSquare size={18} />
          <span>Pomocník Watson</span>
          <span className="hidden sm:inline-block w-2 h-2 bg-olive rounded-full animate-pulse ml-1" aria-hidden="true" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[60] w-[calc(100vw-2rem)] md:w-[380px] h-[80vh] md:h-[560px] bg-coffee border border-tobacco shadow-2xl flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-tobacco bg-espresso">
            <div>
              <div className="font-display italic font-black text-moonlight text-base leading-tight">Pomocník Watson</div>
              <div className="font-mono text-[9px] uppercase tracking-widest text-sandstone mt-0.5">AI · 24/7 · zdarma</div>
            </div>
            <button
              onClick={() => { setOpen(false); track('chat_close'); }}
              className="text-sandstone hover:text-caramel p-1"
              aria-label="Zavřít chat"
            >
              <X size={20} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-caramel text-espresso'
                      : 'bg-tobacco/40 text-sepia'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-tobacco/40 text-sandstone px-3 py-2 text-sm flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  <span>Píše…</span>
                </div>
              </div>
            )}
            {error && (
              <div className="bg-rust/20 text-rust border border-rust/40 px-3 py-2 text-xs">
                {error}
              </div>
            )}
          </div>

          <div className="border-t border-tobacco p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Napište zprávu… (Enter odešle)"
                rows={2}
                maxLength={2000}
                disabled={sending}
                className="flex-1 bg-espresso border border-tobacco text-moonlight px-3 py-2 text-sm focus:border-caramel outline-none resize-none"
              />
              <button
                onClick={() => void send()}
                disabled={sending || !input.trim()}
                className="bg-caramel hover:bg-caramel-light disabled:bg-tobacco disabled:text-sandstone text-espresso p-2 transition-colors"
                aria-label="Odeslat"
              >
                <Send size={16} />
              </button>
            </div>
            <div className="mt-2 text-[10px] text-sandstone/70 font-mono">
              Odpovídá AI. Pro závazné nabídky napište na <span className="text-caramel">info@arbiq.cz</span>.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
