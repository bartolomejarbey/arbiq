'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { notifyPortalUser } from '@/lib/email/notify';
import { formatMoney, formatDate } from '@/lib/formatters';

const CreateInvoiceSchema = z.object({
  client_id: z.string().uuid(),
  project_id: z.string().uuid().optional(),
  amount: z.string(),
  description: z.string().max(2000).optional().default(''),
  issued_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type InvoiceActionResult = { ok: true; invoiceId: string } | { ok: false; error: string };

export async function createInvoice(formData: FormData): Promise<InvoiceActionResult> {
  const supabase = await createClient();
  let parsed: z.infer<typeof CreateInvoiceSchema>;
  try {
    parsed = CreateInvoiceSchema.parse({
      client_id: String(formData.get('client_id') ?? ''),
      project_id: String(formData.get('project_id') ?? '') || undefined,
      amount: String(formData.get('amount') ?? ''),
      description: String(formData.get('description') ?? ''),
      issued_at: String(formData.get('issued_at') ?? '') || undefined,
      due_date: String(formData.get('due_date') ?? ''),
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof z.ZodError ? err.issues.map((i) => i.message).join(', ') : 'Neplatná data.',
    };
  }

  const amount = Number(parsed.amount.replace(/\s/g, '').replace(',', '.'));
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: 'Neplatná částka.' };
  }

  const { data: numData } = await supabase.rpc('next_invoice_number');
  const invoiceNumber = typeof numData === 'string' ? numData : `F${Date.now()}`;

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      client_id: parsed.client_id,
      project_id: parsed.project_id ?? null,
      invoice_number: invoiceNumber,
      amount,
      description: parsed.description || null,
      issued_at: parsed.issued_at ?? new Date().toISOString().slice(0, 10),
      due_date: parsed.due_date,
      status: 'ceka',
    })
    .select('id')
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? 'Nepodařilo se vytvořit fakturu.' };

  void notifyPortalUser({
    recipientId: parsed.client_id,
    subject: `Nová faktura ${invoiceNumber} (${formatMoney(amount)})`,
    heading: 'Vystavena nová faktura',
    intro: `Vystavili jsme Vám fakturu ${invoiceNumber} na ${formatMoney(amount)}, splatnou ${formatDate(parsed.due_date)}.`,
    ctaLabel: 'Zobrazit fakturu',
    ctaPath: '/portal/faktury',
  });

  revalidatePath('/portal/admin/faktury');
  return { ok: true, invoiceId: (data as { id: string }).id };
}

export async function markInvoicePaid(invoiceId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('invoices')
    .update({ status: 'zaplaceno', paid_at: new Date().toISOString().slice(0, 10) })
    .eq('id', invoiceId);
  if (error) throw new Error(error.message);
  revalidatePath('/portal/admin/faktury');
  revalidatePath('/portal/faktury');
}

export async function cancelInvoice(invoiceId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('invoices').update({ status: 'zruseno' }).eq('id', invoiceId);
  if (error) throw new Error(error.message);
  revalidatePath('/portal/admin/faktury');
}

/**
 * Mark all unpaid invoices past due_date as overdue. Called by cron.
 */
export async function markOverdueInvoices() {
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const { error } = await admin
    .from('invoices')
    .update({ status: 'po_splatnosti' })
    .eq('status', 'ceka')
    .lt('due_date', today);
  if (error) throw new Error(error.message);
  revalidatePath('/portal/admin/faktury');
  revalidatePath('/portal/faktury');
}
