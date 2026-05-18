import { NextResponse } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { createHash } from 'crypto';
import { ARBIQ_SYSTEM_PROMPT } from '@/lib/chat/system-prompt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ChatSchema = z.object({
  session_id: z.string().min(4).max(64).nullable().optional(),
  visitor_id: z.string().min(4).max(64),
  page_path: z.string().max(200).nullable().optional(),
  message: z.string().min(1).max(2000),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(4000),
  })).max(20).optional().default([]),
});

const MAX_TOKENS = 600;
const MODEL = 'gpt-4o-mini';

function hashIp(req: Request): string | null {
  const xff = req.headers.get('x-forwarded-for');
  const ip = xff?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? null;
  if (!ip) return null;
  const day = new Date().toISOString().slice(0, 10);
  return createHash('sha256').update(`${ip}|${day}|arbiq-chat`).digest('hex').slice(0, 16);
}

// Per-IP rate limit: 30 messages / hour
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(key: string): { ok: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return { ok: true, remaining: 29 };
  }
  if (entry.count >= 30) return { ok: false, remaining: 0 };
  entry.count += 1;
  return { ok: true, remaining: 30 - entry.count };
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'Chatbot není nakonfigurován.' }, { status: 503 });
  }

  let parsed: z.infer<typeof ChatSchema>;
  try {
    parsed = ChatSchema.parse(await request.json());
  } catch (err) {
    const issues = err instanceof z.ZodError ? err.issues.map((i) => i.message).join(', ') : 'invalid';
    return NextResponse.json({ error: issues }, { status: 400 });
  }

  const ipHash = hashIp(request) ?? 'unknown';
  const rate = checkRateLimit(ipHash);
  if (!rate.ok) {
    return NextResponse.json(
      { error: 'Překročili jste limit zpráv (30/hod). Zkuste za hodinu, nebo nám napište na info@arbiq.cz.' },
      { status: 429 }
    );
  }

  const supabase = await createClient();

  // Resolve / create session (sessionId may be undefined or null on first message)
  let sessionId: string | null = parsed.session_id ?? null;
  if (!sessionId) {
    const { data: created, error: sessErr } = await supabase
      .from('chat_sessions')
      .insert({
        visitor_id: parsed.visitor_id,
        page_path: parsed.page_path ?? null,
        user_agent: request.headers.get('user-agent')?.slice(0, 400) ?? null,
        ip_hash: ipHash,
      })
      .select('id')
      .single();
    if (sessErr || !created) {
      console.error('chat session create failed', sessErr?.message);
    } else {
      sessionId = (created as { id: string }).id;
    }
  }

  // Log user message
  if (sessionId) {
    await supabase.from('chat_messages').insert({
      session_id: sessionId,
      role: 'user',
      content: parsed.message,
    });
  }

  // Build OpenAI messages
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: ARBIQ_SYSTEM_PROMPT },
    ...parsed.history.map((h) => ({ role: h.role, content: h.content }) as const),
    { role: 'user', content: parsed.message },
  ];

  let assistantText = '';
  let tokensIn = 0;
  let tokensOut = 0;

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages,
      max_tokens: MAX_TOKENS,
      temperature: 0.5,
    });
    assistantText = completion.choices[0]?.message?.content?.trim() ?? '';
    tokensIn = completion.usage?.prompt_tokens ?? 0;
    tokensOut = completion.usage?.completion_tokens ?? 0;
  } catch (err) {
    // Detailní logging do Vercel logs pro diagnostiku — typování přes APIError z OpenAI SDK.
    const e = err as { status?: number; code?: string; type?: string; message?: string };
    console.error('OpenAI error', {
      status: e?.status,
      code: e?.code,
      type: e?.type,
      message: e?.message?.slice(0, 500),
      hasKey: Boolean(process.env.OPENAI_API_KEY),
      keyPrefix: process.env.OPENAI_API_KEY?.slice(0, 10) ?? null,
      model: MODEL,
    });
    return NextResponse.json(
      { error: 'Chatbot je dočasně nedostupný. Napište nám na info@arbiq.cz.' },
      { status: 502 }
    );
  }

  if (!assistantText) {
    return NextResponse.json({ error: 'Prázdná odpověď.' }, { status: 502 });
  }

  if (sessionId) {
    await supabase.from('chat_messages').insert({
      session_id: sessionId,
      role: 'assistant',
      content: assistantText,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      model: MODEL,
    });
    // bump_chat_session RPC exists in DB (migration 0002) but isn't in generated types.
    await (supabase.rpc as unknown as (name: string, args: Record<string, unknown>) => Promise<unknown>)(
      'bump_chat_session',
      { p_session_id: sessionId }
    );
  }

  return NextResponse.json({
    session_id: sessionId,
    reply: assistantText,
    remaining: rate.remaining,
  });
}
