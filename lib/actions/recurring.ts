'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { untyped } from '@/lib/supabase/untyped';
import { checkRealViewer, getViewerRole } from '@/lib/supabase/viewer';
import { clientAssignedTo } from '@/lib/actions/ownership';
import { logAdminAction } from '@/lib/audit';

const RecurringSchema = z.object({
  amount: z.number().positive('Částka musí být kladná.'),
  description: z.string().trim().min(1, 'Vyplň popis.').max(500),
  kind: z.enum(['zaloha', 'konecna', 'dobropis', 'paushal']).default('paushal'),
  due_days: z.coerce.number().int().min(1).max(90).default(14),
  payment_method: z.enum(['bank', 'card', 'cash']).default('bank'),
  interval_months: z.coerce.number().int().refine((v) => [1, 3, 6, 12].includes(v), 'Interval 1/3/6/12 měsíců.').default(1),
  day_of_month: z.coerce.number().int().min(1).max(28).default(1),
  auto_send: z.boolean().default(true),
});

type Result = { ok: true } | { ok: false; error: string };

function firstNextRun(day: number, today: string): string {
  const t = new Date(`${today}T00:00:00`);
  const safeDay = Math.min(day, 28);
  let d = new Date(t.getFullYear(), t.getMonth(), safeDay);
  if (d.toISOString().slice(0, 10) <= today) d = new Date(t.getFullYear(), t.getMonth() + 1, safeDay);
  return d.toISOString().slice(0, 10);
}

async function guard(clientId: string): Promise<{ ok: true; viewerId: string } | { ok: false; error: string }> {
  const check = await checkRealViewer();
  if (!check.ok) return { ok: false, error: check.error };
  const role = await getViewerRole();
  if (role !== 'admin' && role !== 'obchodnik') return { ok: false, error: 'Nemáte oprávnění.' };
  if (role !== 'admin' && !(await clientAssignedTo(clientId, check.viewer.id))) {
    return { ok: false, error: 'Tento klient vám není přiřazen.' };
  }
  return { ok: true, viewerId: check.viewer.id };
}

/** Vytvoří nebo upraví pravidelnou fakturaci klienta. */
export async function upsertRecurringInvoice(clientId: string, formData: FormData): Promise<Result> {
  const g = await guard(clientId);
  if (!g.ok) return g;

  const id = String(formData.get('id') ?? '') || null;
  let parsed: z.infer<typeof RecurringSchema>;
  try {
    parsed = RecurringSchema.parse({
      amount: Number(String(formData.get('amount') ?? '').replace(/\s/g, '').replace(',', '.')),
      description: String(formData.get('description') ?? ''),
      kind: String(formData.get('kind') ?? 'paushal'),
      due_days: formData.get('due_days') ?? 14,
      payment_method: String(formData.get('payment_method') ?? 'bank'),
      interval_months: formData.get('interval_months') ?? 1,
      day_of_month: formData.get('day_of_month') ?? 1,
      auto_send: formData.get('auto_send') === 'on' || formData.get('auto_send') === 'true',
    });
  } catch (err) {
    return { ok: false, error: err instanceof z.ZodError ? err.issues.map((i) => i.message).join(', ') : 'Neplatná data.' };
  }

  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const row = {
    client_id: clientId,
    amount: parsed.amount,
    description: parsed.description,
    kind: parsed.kind,
    due_days: parsed.due_days,
    payment_method: parsed.payment_method,
    interval_months: parsed.interval_months,
    day_of_month: parsed.day_of_month,
    auto_send: parsed.auto_send,
  };

  if (id) {
    const { error } = await untyped(admin).from('recurring_invoices').update(row).eq('id', id).eq('client_id', clientId);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await untyped(admin).from('recurring_invoices').insert({
      ...row,
      next_run: firstNextRun(parsed.day_of_month, today),
      created_by: g.viewerId,
    });
    if (error) return { ok: false, error: error.message };
  }

  await logAdminAction({ actorId: g.viewerId, action: id ? 'recurring.update' : 'recurring.create', targetId: clientId, targetType: 'profile' });
  revalidatePath(`/portal/crm/klient/${clientId}`);
  return { ok: true };
}

export async function setRecurringActive(id: string, clientId: string, active: boolean): Promise<Result> {
  const g = await guard(clientId);
  if (!g.ok) return g;
  const admin = createAdminClient();
  const { error } = await untyped(admin).from('recurring_invoices').update({ active }).eq('id', id).eq('client_id', clientId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/portal/crm/klient/${clientId}`);
  return { ok: true };
}

export async function deleteRecurringInvoice(id: string, clientId: string): Promise<Result> {
  const g = await guard(clientId);
  if (!g.ok) return g;
  const admin = createAdminClient();
  const { error } = await untyped(admin).from('recurring_invoices').delete().eq('id', id).eq('client_id', clientId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/portal/crm/klient/${clientId}`);
  return { ok: true };
}
