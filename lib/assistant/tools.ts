import 'server-only';

import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { untyped } from '@/lib/supabase/untyped';
import { createQuote } from '@/lib/actions/quotes';
import { createInvoice, sendInvoiceToClient } from '@/lib/actions/invoices';
import { createContract, sendContractToClient } from '@/lib/actions/contracts';
import { createPortalUser } from '@/lib/actions/users';
import { createTask } from '@/lib/actions/tasks';
import { upsertRecurringInvoice } from '@/lib/actions/recurring';

/** FormData z prostého objektu (vynechá undefined/null). */
function fd(obj: Record<string, unknown>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    f.set(k, typeof v === 'string' ? v : String(v));
  }
  return f;
}

export const ASSISTANT_TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'search_clients',
      description: 'Najde klienty podle jména, firmy nebo e-mailu. Vrať max 10. Použij vždy, než pracuješ s konkrétním klientem, abys získal jeho client_id.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string', description: 'jméno, firma nebo e-mail (část)' } },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_client_overview',
      description: 'Vrátí přehled klienta: kontakt, projekty, nabídky, smlouvy, faktury (souhrn).',
      parameters: { type: 'object', properties: { client_id: { type: 'string' } }, required: ['client_id'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_client',
      description: 'Vytvoří nového klienta (role klient). Pošle uvítací e-mail jen pokud send_invite=true.',
      parameters: {
        type: 'object',
        properties: {
          full_name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          company: { type: 'string' },
          ico: { type: 'string' },
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
      description: 'Vytvoří cenovou nabídku pro klienta (vygeneruje PDF). Položky jsou pole {label, quantity, unit, unit_price}.',
      parameters: {
        type: 'object',
        properties: {
          client_id: { type: 'string' },
          title: { type: 'string' },
          intro_text: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string' },
                description: { type: 'string' },
                quantity: { type: 'number' },
                unit: { type: 'string' },
                unit_price: { type: 'number' },
              },
              required: ['label', 'quantity', 'unit_price'],
            },
          },
          valid_days: { type: 'number', description: 'platnost ve dnech (default 30)' },
          deadline_days: { type: 'number' },
        },
        required: ['client_id', 'title', 'items'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_invoice',
      description: 'Vystaví fakturu klientovi (vygeneruje PDF). NEODesílá ji — to udělej send_invoice po potvrzení.',
      parameters: {
        type: 'object',
        properties: {
          client_id: { type: 'string' },
          amount: { type: 'number', description: 'částka v Kč' },
          description: { type: 'string' },
          due_date: { type: 'string', description: 'splatnost YYYY-MM-DD' },
          kind: { type: 'string', enum: ['zaloha', 'konecna', 'dobropis', 'paushal'] },
        },
        required: ['client_id', 'amount', 'due_date', 'description'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_contract',
      description: 'Vytvoří smlouvu o dílo pro klienta (PDF + DOCX). scope_bullets = pole bodů specifikace.',
      parameters: {
        type: 'object',
        properties: {
          client_id: { type: 'string' },
          title: { type: 'string' },
          subject: { type: 'string', description: 'předmět díla (min 5 znaků)' },
          total_price: { type: 'number' },
          scope_bullets: { type: 'array', items: { type: 'string' } },
          deposit_percent: { type: 'number' },
          deadline_days: { type: 'number' },
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
          client_id: { type: 'string' },
          amount: { type: 'number' },
          description: { type: 'string' },
          interval_months: { type: 'number', enum: [1, 3, 6, 12] },
          day_of_month: { type: 'number', description: '1-28' },
          due_days: { type: 'number' },
          auto_send: { type: 'boolean', description: 'automaticky odesílat e-mailem' },
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
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          client_id: { type: 'string' },
          due_date: { type: 'string', description: 'YYYY-MM-DD' },
          priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'] },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_invoice',
      description: 'ODEŠLE fakturu klientovi e-mailem jako PDF. NEVRATNÉ — volej jen po výslovném potvrzení uživatele.',
      parameters: { type: 'object', properties: { invoice_id: { type: 'string' } }, required: ['invoice_id'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_contract',
      description: 'ODEŠLE smlouvu klientovi e-mailem jako PDF. NEVRATNÉ — volej jen po výslovném potvrzení uživatele.',
      parameters: { type: 'object', properties: { contract_id: { type: 'string' } }, required: ['contract_id'] },
    },
  },
];

/** Vykoná nástroj a vrátí JSON string výsledku pro LLM. */
export async function executeAssistantTool(name: string, args: Record<string, unknown>): Promise<string> {
  const out = (v: unknown) => JSON.stringify(v);
  try {
    switch (name) {
      case 'search_clients': {
        const supabase = await createClient();
        const q = String(args.query ?? '').trim();
        const { data } = await untyped(supabase)
          .from('profiles')
          .select('id, full_name, company, email')
          .eq('role', 'klient')
          .or(`full_name.ilike.%${q}%,company.ilike.%${q}%,email.ilike.%${q}%`)
          .limit(10);
        return out({ clients: data ?? [] });
      }
      case 'get_client_overview': {
        const supabase = await createClient();
        const cid = String(args.client_id);
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
        const res = await createPortalUser(fd({
          full_name: args.full_name, email: args.email, role: 'klient',
          phone: args.phone, company: args.company, ico: args.ico,
          send_invite: args.send_invite ? 'on' : undefined,
        }));
        return out(res);
      }
      case 'create_quote': {
        const f = fd({ client_id: args.client_id, title: args.title, intro_text: args.intro_text, valid_days: args.valid_days, deadline_days: args.deadline_days });
        f.set('items', JSON.stringify(args.items ?? []));
        return out(await createQuote(f));
      }
      case 'create_invoice':
        return out(await createInvoice(fd({
          client_id: args.client_id, amount: args.amount, description: args.description,
          due_date: args.due_date, kind: args.kind ?? 'konecna',
        })));
      case 'create_contract': {
        const f = fd({ client_id: args.client_id, title: args.title, subject: args.subject, total_price: args.total_price, deposit_percent: args.deposit_percent, deadline_days: args.deadline_days });
        if (Array.isArray(args.scope_bullets)) f.set('scope_bullets', (args.scope_bullets as string[]).join('\n'));
        return out(await createContract(f));
      }
      case 'setup_recurring_invoice':
        return out(await upsertRecurringInvoice(String(args.client_id), fd({
          amount: args.amount, description: args.description, interval_months: args.interval_months ?? 1,
          day_of_month: args.day_of_month ?? 1, due_days: args.due_days ?? 14, auto_send: args.auto_send === false ? undefined : 'on',
        })));
      case 'create_task':
        return out(await createTask(fd({
          title: args.title, description: args.description, client_id: args.client_id,
          due_date: args.due_date, priority: args.priority ?? 'normal',
        })));
      case 'send_invoice':
        return out(await sendInvoiceToClient(String(args.invoice_id)));
      case 'send_contract':
        return out(await sendContractToClient(String(args.contract_id)));
      default:
        return out({ ok: false, error: `Neznámý nástroj: ${name}` });
    }
  } catch (err) {
    return out({ ok: false, error: err instanceof Error ? err.message : 'Chyba nástroje.' });
  }
}
