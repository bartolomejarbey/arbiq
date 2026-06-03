import 'server-only';

import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { untyped } from '@/lib/supabase/untyped';
import { clientAssignedTo } from '@/lib/actions/ownership';
import { createQuote } from '@/lib/actions/quotes';
import { createInvoice, sendInvoiceToClient } from '@/lib/actions/invoices';
import { createContract, sendContractToClient } from '@/lib/actions/contracts';
import { createPortalUser } from '@/lib/actions/users';
import { createTask } from '@/lib/actions/tasks';
import { upsertRecurringInvoice } from '@/lib/actions/recurring';

export type AssistantRole = 'admin' | 'obchodnik';
export type ToolCtx = { role: AssistantRole; viewerId: string };

/** Nástroje vyhrazené jen adminovi (finanční doklady / správa účtů). */
const ADMIN_ONLY = new Set(['create_client', 'create_invoice']);

/** FormData z prostého objektu (vynechá undefined/null). */
function fd(obj: Record<string, unknown>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    f.set(k, typeof v === 'string' ? v : String(v));
  }
  return f;
}

/**
 * Očistí vstup pro PostgREST .or()/.ilike() filtr (anti filter-injection).
 * POZOR: zachovává `. @ - _ +` — jinak by se rozbilo hledání podle e-mailu
 * (dřív se tečka stripovala → e-mail nikdy nematchoval). Odstraní jen znaky,
 * které rozbíjejí .or() syntaxi (`% , ( ) *`).
 */
function sanitizeQuery(raw: unknown): string {
  return String(raw ?? '').replace(/[%,()*]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100);
}

export const ASSISTANT_TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'search_clients',
      description: 'Najde klienty podle jména, firmy, e-mailu NEBO IČO (max 10). Zvládá i celý e-mail nebo IČO s mezerami. Použij vždy nejdřív, abys získal client_id. Zkus víc variant (e-mail, IČO, název firmy), než řekneš že klient neexistuje.',
      parameters: { type: 'object', properties: { query: { type: 'string', description: 'jméno, firma, e-mail nebo IČO' } }, required: ['query'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_client_overview',
      description: 'Přehled klienta: kontakt, projekty, nabídky, smlouvy, faktury (souhrn).',
      parameters: { type: 'object', properties: { client_id: { type: 'string' } }, required: ['client_id'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_client',
      description: 'Vytvoří nového klienta (role klient). Jen admin. IDEMPOTENTNÍ: když klient s daným e-mailem už existuje, vrátí ho (existing:true, client_id) místo chyby — pak rovnou pokračuj s tímto client_id. Firma NENÍ povinná.',
      parameters: {
        type: 'object',
        properties: {
          full_name: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' },
          company: { type: 'string' }, ico: { type: 'string' }, dic: { type: 'string' },
          send_invite: { type: 'boolean', description: 'poslat přístupové údaje e-mailem' },
        },
        required: ['full_name', 'email'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_quote',
      description: 'Vytvoří cenovou nabídku pro klienta (PDF). items = [{label, quantity, unit, unit_price}].',
      parameters: {
        type: 'object',
        properties: {
          client_id: { type: 'string' }, title: { type: 'string' }, intro_text: { type: 'string' },
          items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, description: { type: 'string' }, quantity: { type: 'number' }, unit: { type: 'string' }, unit_price: { type: 'number' } }, required: ['label', 'quantity', 'unit_price'] } },
          valid_days: { type: 'number' }, deadline_days: { type: 'number' },
        },
        required: ['client_id', 'title', 'items'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_invoice',
      description: 'Vystaví fakturu klientovi (PDF). Jen admin. NEODesílá — to udělej send_invoice po potvrzení. Když uživatel uvede rozpis (např. web 6000, doména 1200, e-mail 800), zadej ho do items — částka se spočítá z položek. Jinak použij amount + description. Když due_date nezadá uživatel, použij dnešek + 14 dní.',
      parameters: {
        type: 'object',
        properties: {
          client_id: { type: 'string' }, amount: { type: 'number', description: 'celková částka, pokud nezadáváš items' },
          description: { type: 'string' },
          items: {
            type: 'array',
            description: 'rozpis položek; pokud je zadán, amount se ignoruje a spočítá z položek',
            items: { type: 'object', properties: { label: { type: 'string' }, quantity: { type: 'number' }, unit: { type: 'string' }, unit_price: { type: 'number' } }, required: ['label', 'unit_price'] },
          },
          due_date: { type: 'string', description: 'YYYY-MM-DD' }, kind: { type: 'string', enum: ['zaloha', 'konecna', 'dobropis', 'paushal'] },
        },
        required: ['client_id', 'due_date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_contract',
      description: 'Vytvoří smlouvu o dílo pro klienta (PDF+DOCX). scope_bullets = pole bodů.',
      parameters: {
        type: 'object',
        properties: {
          client_id: { type: 'string' }, title: { type: 'string' }, subject: { type: 'string', description: 'min 5 znaků' },
          total_price: { type: 'number' }, scope_bullets: { type: 'array', items: { type: 'string' } },
          deposit_percent: { type: 'number' }, deadline_days: { type: 'number' },
        },
        required: ['client_id', 'title', 'subject', 'total_price'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'setup_recurring_invoice',
      description: 'Nastaví pravidelnou (recurring) fakturaci klienta.',
      parameters: {
        type: 'object',
        properties: {
          client_id: { type: 'string' }, amount: { type: 'number' }, description: { type: 'string' },
          interval_months: { type: 'number', enum: [1, 3, 6, 12] }, day_of_month: { type: 'number' },
          due_days: { type: 'number' }, auto_send: { type: 'boolean' },
        },
        required: ['client_id', 'amount', 'description'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_task',
      description: 'Vytvoří interní úkol (volitelně k klientovi).',
      parameters: {
        type: 'object',
        properties: { title: { type: 'string' }, description: { type: 'string' }, client_id: { type: 'string' }, due_date: { type: 'string' }, priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'] } },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_invoice',
      description: 'Připraví ODESLÁNÍ faktury klientovi. NEODešle hned — vrátí shrnutí k potvrzení; skutečné odeslání proběhne až po výslovném potvrzení uživatele.',
      parameters: { type: 'object', properties: { invoice_id: { type: 'string' } }, required: ['invoice_id'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_contract',
      description: 'Připraví ODESLÁNÍ smlouvy klientovi. NEODešle hned — vrátí shrnutí k potvrzení.',
      parameters: { type: 'object', properties: { contract_id: { type: 'string' } }, required: ['contract_id'] },
    },
  },
];

/** Vrátí podmnožinu nástrojů povolenou pro danou roli (model nedovolené ani neuvidí). */
export function toolsForRole(role: AssistantRole): OpenAI.Chat.Completions.ChatCompletionTool[] {
  if (role === 'admin') return ASSISTANT_TOOLS;
  return ASSISTANT_TOOLS.filter((t) => t.type !== 'function' || !ADMIN_ONLY.has(t.function.name));
}

export type ToolResult = { content: string; pendingConfirm?: { tool: string; id: string; summary: string } };

/** Vykoná nástroj. Destruktivní (send_*) NEPROVEDE — vrátí pending_confirmation. */
export async function executeAssistantTool(name: string, args: Record<string, unknown>, ctx: ToolCtx): Promise<ToolResult> {
  const out = (v: unknown) => ({ content: JSON.stringify(v) });
  // Re-check role (belt-and-suspenders k filtrování v route).
  if (ADMIN_ONLY.has(name) && ctx.role !== 'admin') {
    return out({ ok: false, error: 'Tento nástroj smí použít jen admin.' });
  }
  try {
    switch (name) {
      case 'search_clients': {
        const supabase = await createClient();
        const q = sanitizeQuery(args.query);
        if (!q) return out({ clients: [] });
        // Hledá podle jména, firmy, e-mailu I IČO (číslice se normalizují bez mezer).
        const digits = q.replace(/\D/g, '');
        const orParts = [`full_name.ilike.%${q}%`, `company.ilike.%${q}%`, `email.ilike.%${q}%`];
        if (digits.length >= 6) orParts.push(`ico.ilike.%${digits}%`);
        let query = untyped(supabase)
          .from('profiles')
          .select('id, full_name, company, email, ico, phone, parent_client_id, is_active')
          .eq('role', 'klient');
        if (ctx.role === 'obchodnik') query = query.eq('assigned_obchodnik', ctx.viewerId);
        const { data } = await query.or(orParts.join(',')).limit(10);
        return out({ clients: data ?? [] });
      }
      case 'get_client_overview': {
        const cid = String(args.client_id);
        if (ctx.role === 'obchodnik' && !(await clientAssignedTo(cid, ctx.viewerId))) {
          return out({ ok: false, error: 'Tento klient vám není přiřazen.' });
        }
        const supabase = await createClient();
        const [prof, projects, quotes, contracts, invoices] = await Promise.all([
          untyped(supabase).from('profiles').select('id, full_name, company, email, phone, ico').eq('id', cid).single(),
          untyped(supabase).from('projects').select('id, name, status, total_value').eq('client_id', cid),
          untyped(supabase).from('quotes').select('id, quote_number, title, total_price, status').eq('client_id', cid),
          untyped(supabase).from('contracts').select('id, contract_number, title, total_price, status').eq('client_id', cid),
          untyped(supabase).from('invoices').select('id, invoice_number, amount, status, due_date').eq('client_id', cid),
        ]);
        return out({ profile: prof.data, projects: projects.data, quotes: quotes.data, contracts: contracts.data, invoices: invoices.data });
      }
      case 'create_client': {
        const supabase = await createClient();
        const email = String(args.email ?? '').trim();
        // Idempotence: když klient s tímto e-mailem už existuje, vrať ho (nezakládej
        // duplicitně a nepadej na „e-mail už registrován"). Tohle byl hlavní důvod,
        // proč se asistent zacyklil.
        if (email) {
          const { data: existRows } = await untyped(supabase)
            .from('profiles')
            .select('id, full_name, company, email')
            .ilike('email', email)
            .limit(1);
          const ex = (existRows?.[0]) as { id?: string; full_name?: string; company?: string; email?: string } | undefined;
          if (ex?.id) {
            return out({ ok: true, existing: true, client_id: ex.id, full_name: ex.full_name, company: ex.company, email: ex.email, note: 'Klient s tímto e-mailem už existuje — použij toto client_id a pokračuj.' });
          }
        }
        const res = await createPortalUser(fd({ full_name: args.full_name, email: args.email, role: 'klient', phone: args.phone, company: args.company, ico: args.ico, dic: args.dic, send_invite: args.send_invite ? 'on' : undefined }));
        const r = res as { ok?: boolean; userId?: string; error?: string };
        if (r.ok && r.userId) return out({ ok: true, existing: false, client_id: r.userId });
        return out(res);
      }
      case 'create_quote': {
        const f = fd({ client_id: args.client_id, title: args.title, intro_text: args.intro_text, valid_days: args.valid_days, deadline_days: args.deadline_days });
        f.set('items', JSON.stringify(args.items ?? []));
        return out(await createQuote(f));
      }
      case 'create_invoice': {
        const f = fd({ client_id: args.client_id, amount: args.amount, description: args.description, due_date: args.due_date, kind: args.kind ?? 'konecna' });
        // Rozpis na položky → faktura je má jako řádky a částku spočítá z nich.
        if (Array.isArray(args.items) && args.items.length > 0) f.set('items', JSON.stringify(args.items));
        return out(await createInvoice(f));
      }
      case 'create_contract': {
        const f = fd({ client_id: args.client_id, title: args.title, subject: args.subject, total_price: args.total_price, deposit_percent: args.deposit_percent, deadline_days: args.deadline_days });
        if (Array.isArray(args.scope_bullets)) f.set('scope_bullets', (args.scope_bullets as string[]).join('\n'));
        return out(await createContract(f));
      }
      case 'setup_recurring_invoice':
        return out(await upsertRecurringInvoice(String(args.client_id), fd({ amount: args.amount, description: args.description, interval_months: args.interval_months ?? 1, day_of_month: args.day_of_month ?? 1, due_days: args.due_days ?? 14, auto_send: args.auto_send === false ? undefined : 'on' })));
      case 'create_task':
        return out(await createTask(fd({ title: args.title, description: args.description, client_id: args.client_id, due_date: args.due_date, priority: args.priority ?? 'normal' })));
      case 'send_invoice':
      case 'send_contract': {
        // HARD-GATE: neprováděj odeslání zde. Vrať shrnutí k potvrzení uživatelem.
        const id = String(args.invoice_id ?? args.contract_id ?? '');
        if (!id) return out({ ok: false, error: 'Chybí ID dokladu.' });
        const summary = await confirmSummary(name, id, ctx);
        if (!summary) return out({ ok: false, error: 'Doklad nenalezen nebo k němu nemáte přístup.' });
        return {
          content: JSON.stringify({ status: 'pending_confirmation', message: `Připraveno k odeslání: ${summary}. Vyžaduje potvrzení uživatele (NEODESLÁNO).` }),
          pendingConfirm: { tool: name, id, summary },
        };
      }
      default:
        return out({ ok: false, error: `Neznámý nástroj: ${name}` });
    }
  } catch (err) {
    return out({ ok: false, error: err instanceof Error ? err.message : 'Chyba nástroje.' });
  }
}

/** Krátké lidské shrnutí dokladu pro potvrzovací dialog (a ownership pre-check). */
async function confirmSummary(tool: string, id: string, ctx: ToolCtx): Promise<string | null> {
  const supabase = await createClient();
  if (tool === 'send_invoice') {
    const { data } = await untyped(supabase).from('invoices').select('invoice_number, amount, client_id').eq('id', id).single();
    const r = data as { invoice_number?: string; amount?: number; client_id?: string | null } | null;
    if (!r) return null;
    if (ctx.role === 'obchodnik' && r.client_id && !(await clientAssignedTo(r.client_id, ctx.viewerId))) return null;
    return `faktura ${r.invoice_number} (${r.amount} Kč)`;
  }
  const { data } = await untyped(supabase).from('contracts').select('contract_number, title, client_id').eq('id', id).single();
  const r = data as { contract_number?: string; title?: string; client_id?: string } | null;
  if (!r) return null;
  if (ctx.role === 'obchodnik' && r.client_id && !(await clientAssignedTo(r.client_id, ctx.viewerId))) return null;
  return `smlouva ${r.contract_number} (${r.title})`;
}

/** Provede POTVRZENÉ odeslání (volá se z route po explicitním kliknutí uživatele). */
export async function executeConfirmedSend(tool: string, id: string): Promise<{ ok: true; sentTo: string } | { ok: false; error: string }> {
  if (tool === 'send_invoice') return sendInvoiceToClient(id);
  if (tool === 'send_contract') return sendContractToClient(id);
  return { ok: false, error: 'Neznámá akce.' };
}
