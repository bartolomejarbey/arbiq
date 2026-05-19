'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { untyped } from '@/lib/supabase/untyped';
import { checkRealViewer, getViewerRole } from '@/lib/supabase/viewer';
import { notifyPortalUser } from '@/lib/email/notify';
import { formatMoney, formatDate } from '@/lib/formatters';
import { getDodavatel } from '@/lib/config/dodavatel';
import { uploadDocument } from '@/lib/storage/documents';
import { renderInvoicePdf, type InvoiceDoc, type InvoiceCustomer, type InvoiceItem } from '@/lib/pdf/invoice';
import { buildSpaydPayload } from '@/lib/payments/spayd';
import type { Dodavatel } from '@/lib/config/dodavatel';

/** Slije případný supplier_override JSON přes výchozí dodavatel hodnoty. */
function applySupplierOverride(base: Dodavatel, override: unknown): Dodavatel {
  if (!override || typeof override !== 'object') return base;
  const o = override as Partial<Dodavatel>;
  const cleaned: Partial<Dodavatel> = {};
  for (const [k, v] of Object.entries(o)) {
    if (v !== null && v !== undefined && v !== '') (cleaned as Record<string, unknown>)[k] = v;
  }
  return { ...base, ...cleaned };
}

function parseSupplierOverrideForm(formData: FormData): Record<string, string | boolean> | null {
  const useOverride = formData.get('use_supplier_override');
  if (useOverride !== 'on' && useOverride !== 'true' && useOverride !== '1') return null;
  const fields: Array<keyof Dodavatel> = [
    'name', 'street', 'city', 'ico', 'dic', 'iban', 'bank_account', 'bank_name', 'bic',
    'email', 'phone', 'website', 'brand', 'place', 'legal_form',
  ];
  const out: Record<string, string | boolean> = {};
  for (const f of fields) {
    const v = formData.get(`sup_${f}`);
    if (typeof v === 'string' && v.trim().length > 0) out[f] = v.trim();
  }
  const vat = formData.get('sup_vat_payer');
  if (vat === 'on' || vat === 'true' || vat === '1') out.vat_payer = true;
  return Object.keys(out).length > 0 ? out : null;
}

const ItemSchema = z.object({
  label: z.string().min(1).max(200),
  description: z.string().max(500).optional().nullable(),
  quantity: z.number().positive(),
  unit: z.string().max(20).optional().nullable(),
  unit_price: z.number().nonnegative(),
});

const CreateInvoiceSchema = z.object({
  client_id: z.string().uuid(),
  project_id: z.string().uuid().optional(),
  contract_id: z.string().uuid().optional(),
  kind: z.enum(['zaloha', 'konecna', 'dobropis', 'paushal']).default('konecna'),
  // Plain text popis (kompatibilita) nebo items pole
  amount: z.string().optional(),
  items: z.array(ItemSchema).optional(),
  description: z.string().max(2000).optional().default(''),
  issued_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  taxable_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  variable_symbol: z.string().max(20).optional().nullable(),
  constant_symbol: z.string().max(10).optional().nullable(),
  payment_method: z.enum(['bank', 'card', 'cash']).default('bank'),
});

export type InvoiceActionResult = { ok: true; invoiceId: string; pdfUrl?: string | null } | { ok: false; error: string };

function parseFormItems(formData: FormData): InvoiceItem[] | undefined {
  const raw = formData.get('items');
  if (typeof raw !== 'string' || raw.length === 0) return undefined;
  try {
    const parsed = JSON.parse(raw) as Array<{
      label?: string;
      description?: string | null;
      quantity?: number | string;
      unit?: string | null;
      unit_price?: number | string;
    }>;
    return parsed.map((p) => ({
      label: String(p.label ?? '').trim(),
      description: p.description ?? null,
      quantity: Number(p.quantity ?? 1),
      unit: p.unit ?? 'ks',
      unit_price: Number(p.unit_price ?? 0),
    }));
  } catch {
    return undefined;
  }
}

export async function createInvoice(formData: FormData): Promise<InvoiceActionResult> {
  const check = await checkRealViewer();
  if (!check.ok) return { ok: false, error: check.error };
  const role = await getViewerRole();
  if (role !== 'admin' && role !== 'obchodnik') {
    return { ok: false, error: 'Nemáte oprávnění vystavovat faktury.' };
  }

  const supabase = await createClient();

  const items = parseFormItems(formData);
  let parsed: z.infer<typeof CreateInvoiceSchema>;
  try {
    parsed = CreateInvoiceSchema.parse({
      client_id: String(formData.get('client_id') ?? ''),
      project_id: String(formData.get('project_id') ?? '') || undefined,
      contract_id: String(formData.get('contract_id') ?? '') || undefined,
      kind: String(formData.get('kind') ?? 'konecna') as 'zaloha' | 'konecna' | 'dobropis' | 'paushal',
      amount: String(formData.get('amount') ?? ''),
      items,
      description: String(formData.get('description') ?? ''),
      issued_at: String(formData.get('issued_at') ?? '') || undefined,
      due_date: String(formData.get('due_date') ?? ''),
      taxable_at: String(formData.get('taxable_at') ?? '') || undefined,
      variable_symbol: String(formData.get('variable_symbol') ?? '') || undefined,
      constant_symbol: String(formData.get('constant_symbol') ?? '') || undefined,
      payment_method: (String(formData.get('payment_method') ?? 'bank') as 'bank' | 'card' | 'cash'),
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof z.ZodError ? err.issues.map((i) => i.message).join(', ') : 'Neplatná data.',
    };
  }

  // Spočítej amount z items, fallback na pole amount.
  const itemsTotal = parsed.items?.reduce((s, it) => s + it.quantity * it.unit_price, 0) ?? 0;
  const amountFromString = parsed.amount
    ? Number(parsed.amount.replace(/\s/g, '').replace(',', '.'))
    : 0;
  const amount = itemsTotal > 0 ? itemsTotal : amountFromString;
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: 'Neplatná částka.' };
  }

  // Pokud nebyly položky zadány, vytvoříme jednu z description + amount.
  const finalItems: InvoiceItem[] = parsed.items && parsed.items.length > 0
    ? parsed.items
    : [{
        label: parsed.description || (parsed.kind === 'zaloha' ? 'Záloha dle smlouvy' : 'Vystavení faktury'),
        description: null,
        quantity: 1,
        unit: 'ks',
        unit_price: amount,
      }];

  const { data: numData } = await supabase.rpc('next_invoice_number');
  const invoiceNumber = typeof numData === 'string' ? numData : `F${Date.now()}`;
  const variableSymbol = parsed.variable_symbol ?? invoiceNumber.replace(/\D/g, '');

  const supplierOverride = parseSupplierOverrideForm(formData);

  // 1) INSERT záznamu (zatím bez pdf_url)
  const { data: insRow, error: insErr } = await untyped(supabase)
    .from('invoices')
    .insert({
      client_id: parsed.client_id,
      project_id: parsed.project_id ?? null,
      contract_id: parsed.contract_id ?? null,
      invoice_number: invoiceNumber,
      kind: parsed.kind,
      amount,
      description: parsed.description || null,
      issued_at: parsed.issued_at ?? new Date().toISOString().slice(0, 10),
      due_date: parsed.due_date,
      status: 'ceka',
      variable_symbol: variableSymbol,
      constant_symbol: parsed.constant_symbol ?? null,
      payment_method: parsed.payment_method,
      currency: 'CZK',
      items: finalItems as unknown as object,
      supplier_override: supplierOverride,
    })
    .select('id, issued_at')
    .single();

  if (insErr || !insRow) {
    return { ok: false, error: insErr?.message ?? 'Nepodařilo se vytvořit fakturu.' };
  }
  const invoiceId = (insRow as { id: string }).id;
  const issuedAt = (insRow as { issued_at: string }).issued_at;

  // 2) Načti klientův profil + dodavatele pro PDF.
  const admin = createAdminClient();
  const [{ data: clientRow }, baseDodavatel] = await Promise.all([
    untyped(admin)
      .from('profiles')
      .select('id, full_name, email, phone, company, ico, dic, street, city')
      .eq('id', parsed.client_id)
      .single(),
    getDodavatel(),
  ]);
  const dodavatel = applySupplierOverride(baseDodavatel, supplierOverride);

  const customer: InvoiceCustomer = {
    full_name: (clientRow as { full_name?: string | null } | null)?.full_name ?? 'Klient',
    email: (clientRow as { email?: string | null } | null)?.email ?? null,
    phone: (clientRow as { phone?: string | null } | null)?.phone ?? null,
    company: (clientRow as { company?: string | null } | null)?.company ?? null,
    ico: (clientRow as { ico?: string | null } | null)?.ico ?? null,
    dic: (clientRow as { dic?: string | null } | null)?.dic ?? null,
    street: (clientRow as { street?: string | null } | null)?.street ?? null,
    city: (clientRow as { city?: string | null } | null)?.city ?? null,
  };

  // 3) Vygeneruj PDF + SPAYD.
  let pdfStoragePath: string | null = null;
  let qrPayload: string | null = null;
  try {
    const doc: InvoiceDoc = {
      invoiceNumber,
      kind: parsed.kind,
      issuedAt,
      taxableAt: parsed.taxable_at ?? issuedAt,
      dueDate: parsed.due_date,
      variableSymbol,
      constantSymbol: parsed.constant_symbol ?? null,
      paymentMethod: parsed.payment_method,
      currency: 'CZK',
      items: finalItems,
      description: parsed.description || null,
    };
    const pdf = await renderInvoicePdf({ invoice: doc, customer, dodavatel });
    qrPayload = parsed.payment_method === 'cash' ? null : buildSpaydPayload({
      iban: dodavatel.iban,
      bic: dodavatel.bic,
      amount,
      currency: 'CZK',
      variableSymbol,
      constantSymbol: parsed.constant_symbol ?? undefined,
      message: `Faktura ${invoiceNumber}`,
      dueDate: parsed.due_date,
    });

    const safeNum = invoiceNumber.replace(/[^A-Za-z0-9-]/g, '_');
    const filename = parsed.kind === 'zaloha' ? `Zalohova-faktura-${safeNum}.pdf` : `Faktura-${safeNum}.pdf`;
    const up = await uploadDocument({
      clientId: parsed.client_id,
      projectId: parsed.project_id ?? null,
      type: 'faktura',
      filename,
      contentType: 'application/pdf',
      body: pdf,
      invoiceId,
      title: filename,
    });
    pdfStoragePath = up.path;
  } catch (err) {
    console.error('[INVOICE PDF] generation failed', err);
    // Faktura zůstane bez PDF — admin může regenerovat z API.
  }

  if (pdfStoragePath || qrPayload) {
    await untyped(admin)
      .from('invoices')
      .update({ pdf_url: pdfStoragePath, qr_payload: qrPayload })
      .eq('id', invoiceId);
  }

  // 4) Email klientovi (transactional).
  void notifyPortalUser({
    recipientId: parsed.client_id,
    subject: `Nová faktura ${invoiceNumber} (${formatMoney(amount)})`,
    heading: 'Vystavena nová faktura',
    intro: `Vystavili jsme Vám fakturu ${invoiceNumber} na ${formatMoney(amount)}, splatnou ${formatDate(parsed.due_date)}.`,
    ctaLabel: 'Zobrazit fakturu',
    ctaPath: '/portal/faktury',
  });

  revalidatePath('/portal/admin/faktury');
  revalidatePath('/portal/faktury');
  return { ok: true, invoiceId, pdfUrl: pdfStoragePath };
}

export async function markInvoicePaid(invoiceId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const check = await checkRealViewer();
  if (!check.ok) return { ok: false, error: check.error };
  const role = await getViewerRole();
  if (role !== 'admin' && role !== 'obchodnik') return { ok: false, error: 'Nemáte oprávnění.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('invoices')
    .update({ status: 'zaplaceno', paid_at: new Date().toISOString().slice(0, 10) })
    .eq('id', invoiceId);
  if (error) {
    console.error('[INVOICE] markPaid failed', error);
    return { ok: false, error: 'Nepodařilo se označit jako zaplaceno.' };
  }
  revalidatePath('/portal/admin/faktury');
  revalidatePath('/portal/faktury');
  return { ok: true };
}

export async function cancelInvoice(invoiceId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const check = await checkRealViewer();
  if (!check.ok) return { ok: false, error: check.error };
  const role = await getViewerRole();
  if (role !== 'admin' && role !== 'obchodnik') return { ok: false, error: 'Nemáte oprávnění.' };

  const supabase = await createClient();
  const { error } = await supabase.from('invoices').update({ status: 'zruseno' }).eq('id', invoiceId);
  if (error) {
    console.error('[INVOICE] cancel failed', error);
    return { ok: false, error: 'Storno selhalo.' };
  }
  revalidatePath('/portal/admin/faktury');
  return { ok: true };
}

/**
 * Regeneruje PDF existující faktury (např. po opravě dodavatel údajů).
 * Volá se z /api/portal/invoices/[id]/pdf?regenerate=1.
 */
export async function regenerateInvoicePdf(invoiceId: string): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  // KRITICKÉ: tato akce volá admin client (bypass RLS) — bez tohoto guardu by
  // preview/anon visitor mohl POSTem na Next.js server-action endpoint
  // přegenerovat libovolnou fakturu (extrahovat PDF) + spam upload do bucketu.
  const check = await checkRealViewer();
  if (!check.ok) return { ok: false, error: check.error };
  const role = await getViewerRole();
  if (role !== 'admin' && role !== 'obchodnik') {
    return { ok: false, error: 'Nemáte oprávnění regenerovat fakturu.' };
  }

  const admin = createAdminClient();
  const { data: invRow } = await untyped(admin)
    .from('invoices')
    .select('id, invoice_number, kind, amount, description, issued_at, due_date, variable_symbol, constant_symbol, payment_method, items, client_id, project_id, currency, supplier_override')
    .eq('id', invoiceId)
    .single();
  if (!invRow) return { ok: false, error: 'Faktura nenalezena.' };
  const inv = invRow as Record<string, unknown>;
  const clientId = inv['client_id'] as string;

  const [{ data: clientRow }, baseDodavatel] = await Promise.all([
    untyped(admin)
      .from('profiles')
      .select('id, full_name, email, phone, company, ico, dic, street, city')
      .eq('id', clientId)
      .single(),
    getDodavatel(),
  ]);
  const dodavatel = applySupplierOverride(baseDodavatel, inv['supplier_override']);

  const customer: InvoiceCustomer = {
    full_name: (clientRow as { full_name?: string | null } | null)?.full_name ?? 'Klient',
    email: (clientRow as { email?: string | null } | null)?.email ?? null,
    phone: (clientRow as { phone?: string | null } | null)?.phone ?? null,
    company: (clientRow as { company?: string | null } | null)?.company ?? null,
    ico: (clientRow as { ico?: string | null } | null)?.ico ?? null,
    dic: (clientRow as { dic?: string | null } | null)?.dic ?? null,
    street: (clientRow as { street?: string | null } | null)?.street ?? null,
    city: (clientRow as { city?: string | null } | null)?.city ?? null,
  };

  const items = (inv['items'] as InvoiceItem[] | null) ?? [{
    label: (inv['description'] as string | null) ?? 'Faktura',
    description: null,
    quantity: 1,
    unit: 'ks',
    unit_price: Number(inv['amount'] ?? 0),
  }];

  const doc: InvoiceDoc = {
    invoiceNumber: inv['invoice_number'] as string,
    kind: (inv['kind'] as 'zaloha' | 'konecna' | 'dobropis' | 'paushal') ?? 'konecna',
    issuedAt: inv['issued_at'] as string,
    taxableAt: inv['issued_at'] as string,
    dueDate: inv['due_date'] as string,
    variableSymbol: (inv['variable_symbol'] as string | null) ?? (inv['invoice_number'] as string).replace(/\D/g, ''),
    constantSymbol: (inv['constant_symbol'] as string | null) ?? null,
    paymentMethod: (inv['payment_method'] as 'bank' | 'card' | 'cash') ?? 'bank',
    currency: (inv['currency'] as string) ?? 'CZK',
    items,
    description: (inv['description'] as string | null) ?? null,
  };

  try {
    const pdf = await renderInvoicePdf({ invoice: doc, customer, dodavatel });
    const safeNum = doc.invoiceNumber.replace(/[^A-Za-z0-9-]/g, '_');
    const filename = doc.kind === 'zaloha' ? `Zalohova-faktura-${safeNum}.pdf` : `Faktura-${safeNum}.pdf`;
    const up = await uploadDocument({
      clientId,
      projectId: (inv['project_id'] as string | null) ?? null,
      type: 'faktura',
      filename,
      contentType: 'application/pdf',
      body: pdf,
      invoiceId,
      title: filename,
    });
    await untyped(admin).from('invoices').update({ pdf_url: up.path }).eq('id', invoiceId);
    revalidatePath('/portal/admin/faktury');
    revalidatePath('/portal/faktury');
    return { ok: true, path: up.path };
  } catch (err) {
    console.error('[INVOICE PDF] regenerate failed', err);
    return { ok: false, error: err instanceof Error ? err.message : 'PDF generation failed' };
  }
}

// markOverdueInvoices přesunuto do lib/jobs/invoice-jobs.ts (NE 'use server'),
// aby ho Next.js nevystavoval jako Server Action callable z prohlížeče.
// Cron route /api/cron/overdue-invoices ho importuje z toho nového umístění.
