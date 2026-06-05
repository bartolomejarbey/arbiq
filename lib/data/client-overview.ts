import { createClient } from '@/lib/supabase/server';
import { untyped } from '@/lib/supabase/untyped';

/**
 * Agregace „nadcházejících termínů" klienta na jednu časovou osu pro 360°
 * operační centrum: splatnosti faktur, platnost nabídek, deadliny projektů,
 * úkoly a schůzky. Vše best-effort (chybějící tabulka / RLS → prostě vynecháno).
 */
export type DeadlineItem = {
  kind: 'invoice' | 'quote' | 'project' | 'task' | 'meeting';
  label: string;
  date: string; // YYYY-MM-DD nebo ISO datetime
  href?: string;
  overdue: boolean;
};

const todayStr = () => new Date().toISOString().slice(0, 10);

export async function getClientDeadlines(clientId: string): Promise<DeadlineItem[]> {
  const supabase = await createClient();
  const today = todayStr();
  const items: DeadlineItem[] = [];

  const [inv, quo, prj, tsk, evt] = await Promise.all([
    untyped(supabase).from('invoices').select('invoice_number, due_date, status').eq('client_id', clientId).in('status', ['ceka', 'po_splatnosti']),
    untyped(supabase).from('quotes').select('quote_number, valid_until, status').eq('client_id', clientId).in('status', ['koncept', 'poslano']),
    untyped(supabase).from('projects').select('id, name, estimated_end_date, status').eq('client_id', clientId),
    untyped(supabase).from('crm_tasks').select('title, due_date, status').eq('client_id', clientId).in('status', ['todo', 'in_progress']),
    untyped(supabase).from('events').select('title, start_at').eq('client_id', clientId).gte('start_at', new Date(Date.now() - 86_400_000).toISOString()).order('start_at', { ascending: true }).limit(20),
  ]);

  if (!inv.error) {
    for (const r of (inv.data ?? []) as Array<{ invoice_number: string; due_date: string }>) {
      items.push({ kind: 'invoice', label: `Faktura ${r.invoice_number}`, date: r.due_date, href: '/portal/admin/faktury', overdue: r.due_date < today });
    }
  }
  if (!quo.error) {
    for (const r of (quo.data ?? []) as Array<{ quote_number: string; valid_until: string }>) {
      items.push({ kind: 'quote', label: `Nabídka ${r.quote_number} — platnost`, date: r.valid_until, overdue: r.valid_until < today });
    }
  }
  if (!prj.error) {
    for (const r of (prj.data ?? []) as Array<{ id: string; name: string; estimated_end_date: string | null; status: string }>) {
      if (!r.estimated_end_date || r.status === 'dokoncen' || r.status === 'zruseny') continue;
      items.push({ kind: 'project', label: `Projekt ${r.name}`, date: r.estimated_end_date, href: `/portal/projekt/${r.id}`, overdue: r.estimated_end_date < today });
    }
  }
  if (!tsk.error) {
    for (const r of (tsk.data ?? []) as Array<{ title: string; due_date: string | null }>) {
      if (!r.due_date) continue;
      items.push({ kind: 'task', label: `Úkol: ${r.title}`, date: r.due_date, href: '/portal/crm/ukoly', overdue: r.due_date < today });
    }
  }
  if (!evt.error) {
    for (const r of (evt.data ?? []) as Array<{ title: string; start_at: string }>) {
      items.push({ kind: 'meeting', label: `Schůzka: ${r.title}`, date: r.start_at, href: '/portal/crm/kalendar', overdue: false });
    }
  }

  // Po splatnosti / prošlé první, pak podle data vzestupně.
  items.sort((a, b) => {
    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
    return a.date.localeCompare(b.date);
  });
  return items;
}
