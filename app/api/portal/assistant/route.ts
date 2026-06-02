import { NextResponse } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';
import { checkRealViewer, getViewerRole } from '@/lib/supabase/viewer';
import { ASSISTANT_TOOLS, executeAssistantTool } from '@/lib/assistant/tools';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const BodySchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(8000),
  })).min(1).max(40),
});

const MODEL = 'gpt-4o';
const MAX_STEPS = 6;

function systemPrompt(): string {
  const today = new Date().toISOString().slice(0, 10);
  return `Jsi interní AI asistent agentury ARBIQ pro administrátory/obchodníky. Pomáháš spravovat CRM: klienty, nabídky, faktury, smlouvy, úkoly a pravidelnou fakturaci — pomocí dostupných NÁSTROJŮ, které provádějí REÁLNÉ akce v systému.

PRAVIDLA:
1. Když chybí povinná informace (který klient, částka, splatnost, položky…), ZEPTEJ SE uživatele. Nikdy si nevymýšlej údaje (e-maily, IČO, ceny).
2. Pro práci s klientem nejdřív zavolej search_clients a získej client_id. Když je víc shod, nech uživatele vybrat.
3. Vytváření konceptů (nabídka, faktura, klient, smlouva, úkol, recurring) proveď rovnou a stručně shrň výsledek včetně čísla/ID dokladu.
4. PŘED odesláním dokladu klientovi (send_invoice, send_contract) nebo jakoukoli nevratnou akcí si vyžádej VÝSLOVNÉ potvrzení uživatele v chatu. Bez potvrzení neodesílej.
5. Datumy ve formátu YYYY-MM-DD. Měna CZK. Dnešní datum je ${today}.
6. Odpovídej česky, stručně a věcně. Po akci řekni co se stalo a navrhni další krok.`;
}

export async function POST(request: Request) {
  const check = await checkRealViewer();
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: 401 });
  const role = await getViewerRole();
  if (role !== 'admin' && role !== 'obchodnik') {
    return NextResponse.json({ error: 'Asistent je jen pro tým.' }, { status: 403 });
  }
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'Asistent není nakonfigurován (OPENAI_API_KEY).' }, { status: 503 });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: 'Neplatný požadavek.' }, { status: 400 });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt() },
    ...body.messages.map((m) => ({ role: m.role, content: m.content }) as OpenAI.Chat.Completions.ChatCompletionMessageParam),
  ];
  const actions: Array<{ name: string; ok: boolean }> = [];

  try {
    for (let step = 0; step < MAX_STEPS; step++) {
      const completion = await openai.chat.completions.create({
        model: MODEL,
        messages,
        tools: ASSISTANT_TOOLS,
        tool_choice: 'auto',
        temperature: 0.2,
        max_tokens: 1200,
      });
      const m = completion.choices[0]?.message;
      if (!m) break;
      messages.push(m);

      if (m.tool_calls && m.tool_calls.length > 0) {
        for (const tc of m.tool_calls) {
          if (tc.type !== 'function') continue;
          let parsedArgs: Record<string, unknown> = {};
          try {
            parsedArgs = JSON.parse(tc.function.arguments || '{}');
          } catch {
            parsedArgs = {};
          }
          const result = await executeAssistantTool(tc.function.name, parsedArgs);
          let ok = true;
          try {
            const r = JSON.parse(result) as { ok?: boolean };
            ok = r.ok !== false;
          } catch {
            ok = true;
          }
          actions.push({ name: tc.function.name, ok });
          messages.push({ role: 'tool', tool_call_id: tc.id, content: result });
        }
        continue;
      }

      return NextResponse.json({ reply: m.content ?? '', actions });
    }
    return NextResponse.json({ reply: 'Dosáhl jsem limitu kroků. Zkuste prosím upřesnit zadání.', actions });
  } catch (err) {
    console.error('[ASSISTANT]', err);
    return NextResponse.json({ error: 'Asistent je dočasně nedostupný.' }, { status: 502 });
  }
}
