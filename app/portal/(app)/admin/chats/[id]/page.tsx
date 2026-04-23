import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from "@/lib/supabase/server";
import { requireViewer } from "@/lib/supabase/viewer";
import PageHeader from '@/components/portal/PageHeader';
import { formatDate } from '@/lib/formatters';

export const dynamic = 'force-dynamic';

type Msg = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  tokens_in: number | null;
  tokens_out: number | null;
  model: string | null;
};

type Session = {
  id: string;
  visitor_id: string;
  page_path: string | null;
  user_agent: string | null;
  ip_hash: string | null;
  started_at: string;
  last_message_at: string | null;
  message_count: number;
};

export default async function ChatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireViewer();
  const { id } = await params;

  if (viewer.isPreview) {
    return (
      <div>
        <PageHeader eyebrow="Admin · DEMO" title="Chat detail" subtitle="V demo režimu nedostupné." />
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: session }, { data: msgs }] = await Promise.all([
    supabase.from('chat_sessions').select('*').eq('id', id).single(),
    supabase.from('chat_messages').select('id, role, content, created_at, tokens_in, tokens_out, model').eq('session_id', id).order('created_at', { ascending: true }),
  ]);

  const s = session as unknown as Session | null;
  const messages = ((msgs ?? []) as unknown as Msg[]);

  if (!s) {
    return (
      <div>
        <PageHeader eyebrow="Admin" title="Chat nenalezen" />
        <div className="px-8 py-8">
          <Link href="/portal/admin/chats" className="text-caramel">Zpět</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader eyebrow="Admin · Chat" title={`Konverzace ${s.id.slice(0, 8)}`} subtitle={`Začátek: ${formatDate(s.started_at)} · ${s.message_count} zpráv`} />
      <div className="px-8 py-8 space-y-6">
        <Link href="/portal/admin/chats" className="inline-flex items-center gap-2 text-sandstone hover:text-caramel text-sm">
          <ArrowLeft size={14} /> Zpět na seznam
        </Link>

        <section className="bg-coffee p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-sandstone mb-1">Visitor ID</div>
            <div className="font-mono text-xs text-sepia">{s.visitor_id}</div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-sandstone mb-1">Stránka</div>
            <div className="font-mono text-xs text-sepia">{s.page_path ?? '—'}</div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-sandstone mb-1">IP (hash)</div>
            <div className="font-mono text-xs text-sepia">{s.ip_hash ?? '—'}</div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-sandstone mb-1">User Agent</div>
            <div className="font-mono text-[10px] text-sepia truncate">{s.user_agent ?? '—'}</div>
          </div>
        </section>

        <section className="space-y-3">
          {messages.length === 0 && (
            <p className="text-sandstone text-sm bg-coffee p-6">Konverzace je prázdná.</p>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${m.role === 'user' ? 'bg-caramel text-espresso' : 'bg-coffee text-sepia'} px-4 py-3`}>
                <div className="font-mono text-[9px] uppercase tracking-widest opacity-70 mb-1">
                  {m.role === 'user' ? 'Návštěvník' : `Asistent · ${m.model ?? 'gpt'}`} · {formatDate(m.created_at)}
                </div>
                <div className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</div>
                {m.role === 'assistant' && (m.tokens_in || m.tokens_out) && (
                  <div className="font-mono text-[9px] opacity-50 mt-2">in:{m.tokens_in} out:{m.tokens_out}</div>
                )}
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
