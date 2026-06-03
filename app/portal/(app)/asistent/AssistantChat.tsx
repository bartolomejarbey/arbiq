'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, Wrench } from 'lucide-react';

type Pending = { tool: string; id: string; summary: string };
type Msg = { role: 'user' | 'assistant'; content: string; actions?: Array<{ name: string; ok: boolean }>; pending?: Pending[] };

const SUGGESTIONS = [
  'Udělej nabídku pro klienta …',
  'Vystav fakturu na 7 500 Kč za správu webu klientovi …',
  'Nastav měsíční paušál 5 000 Kč klientovi …',
  'Založ nového klienta a pošli mu přístup',
];

const ACTION_LABEL: Record<string, string> = {
  search_clients: 'vyhledání klienta',
  get_client_overview: 'přehled klienta',
  create_client: 'vytvoření klienta',
  create_quote: 'vytvoření nabídky',
  create_invoice: 'vystavení faktury',
  create_contract: 'vytvoření smlouvy',
  setup_recurring_invoice: 'pravidelná fakturace',
  create_task: 'vytvoření úkolu',
  send_invoice: 'odeslání faktury',
  send_contract: 'odeslání smlouvy',
};

export default function AssistantChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    setError(null);
    const next = [...messages, { role: 'user' as const, content }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/portal/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.map((m) => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Chyba asistenta.');
      } else {
        setMessages((xs) => [...xs, { role: 'assistant', content: data.reply || '(bez odpovědi)', actions: data.actions, pending: data.pendingConfirmations }]);
      }
    } catch {
      setError('Síťová chyba.');
    } finally {
      setLoading(false);
    }
  }

  async function confirmSend(p: Pending) {
    if (loading) return;
    setError(null);
    setLoading(true);
    // Odeber pending (zabraň dvojímu kliknutí).
    setMessages((xs) => xs.map((m) => (m.pending ? { ...m, pending: m.pending.filter((x) => !(x.tool === p.tool && x.id === p.id)) } : m)));
    try {
      const res = await fetch('/api/portal/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messages.map((m) => ({ role: m.role, content: m.content })), confirm: { tool: p.tool, id: p.id } }),
      });
      const data = await res.json();
      setMessages((xs) => [...xs, { role: 'assistant', content: data.reply || (res.ok ? 'Hotovo.' : (data.error ?? 'Chyba.')), actions: data.actions }]);
    } catch {
      setError('Síťová chyba.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.length === 0 && (
          <div className="bg-coffee p-6 border-l-2 border-caramel/40">
            <div className="flex items-center gap-2 text-caramel font-mono text-[10px] uppercase tracking-widest mb-3">
              <Sparkles size={14} /> Co umím
            </div>
            <p className="text-sepia text-sm mb-4">
              Napiš mi přirozeně, co potřebuješ — vytvořím nabídku, fakturu, smlouvu, klienta, úkol nebo nastavím pravidelnou fakturaci.
              Když mi něco chybí, zeptám se. Před odesláním dokladu klientovi si vyžádám potvrzení.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => setInput(s)} className="text-left bg-espresso border border-tobacco hover:border-caramel text-sandstone hover:text-sepia text-xs px-3 py-1.5 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : ''}>
            <div className={`max-w-[85%] px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${m.role === 'user' ? 'bg-tobacco text-moonlight' : 'bg-coffee text-sepia border-l-2 border-caramel/40'}`}>
              {m.content}
              {m.actions && m.actions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.actions.map((a, j) => (
                    <span key={j} className={`inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 ${a.ok ? 'text-olive bg-olive/10' : 'text-rust bg-rust/10'}`}>
                      <Wrench size={9} /> {ACTION_LABEL[a.name] ?? a.name}
                    </span>
                  ))}
                </div>
              )}
              {m.pending && m.pending.length > 0 && (
                <div className="mt-3 flex flex-col gap-2 border-t border-tobacco/50 pt-3">
                  {m.pending.map((p) => (
                    <div key={p.tool + p.id} className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-sandstone">Odeslat {p.summary}?</span>
                      <button
                        onClick={() => confirmSend(p)}
                        disabled={loading}
                        className="bg-caramel text-espresso px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest font-bold hover:bg-caramel-light transition-all disabled:opacity-50"
                      >
                        Potvrdit odeslání
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sandstone text-sm">
            <Loader2 size={14} className="animate-spin" /> Asistent přemýšlí…
          </div>
        )}
        {error && <p className="text-rust text-xs font-mono">{error}</p>}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); void send(input); }}
        className="mt-4 flex items-end gap-2 border-t border-tobacco pt-4"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(input); } }}
          rows={2}
          placeholder="Napiš co potřebuješ… (Enter odešle, Shift+Enter nový řádek)"
          className="flex-1 bg-espresso border border-tobacco px-3 py-2 text-moonlight text-sm focus:border-caramel focus:outline-none resize-none"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-caramel text-espresso px-4 py-3 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
