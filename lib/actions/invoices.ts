'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { untyped } from '@/lib/supabase/untyped';
import { checkRealViewer, getViewerRole } from '@/lib/supabase/viewer';
import { formatMoney, formatDate } from '@/lib/formatters';
import { sendEmail } from '@/lib/email/send';
import { logClientEmail } from '@/lib/email/correspondence';
import { clientAssignedTo } from '@/lib/actions/ownership';
import { InvoiceDeliveryEmail } from '@/lib/email/templates/invoice-delivery';
import { getDodavatel } from '@/lib/config/dodavatel';
import { uploadDocument, downloadDocument } from '@/lib/storage/documents';
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

const CustomerOverrideSchema = z.object({
  full_name: z.string().trim().min(1).max(200),
  company: z.string().trim().max(200).optional().nullable(),
  email: z.string().trim().email().max(200).optional().nullable().or(z.literal('').transform(() => null)),
  phone: z.string().trim().max(40).optional().nullable(),
  ico: z.string().trim().max(20).optional().nullable(),
  dic: z.string().trim().max(20).optional().nullable(),
  street: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().max(200).optional().nullable(),
});

const CreateInvoiceSchema = z.object({
  client_id: z.string().uuid().optional(),
  customer_override: CustomerOverrideSchema.optional(),
  project_id: z.string().uuid().optional(),
  contract_id: z.string().uuid().optional(),
  invoice_number: z.string().trim().min(1).max(40).regex(/^[A-Za-z0-9._\/-]+$/, 'Číslo smí obsahovat jen písmena, číslice, ._-/').optional(),
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

function parseCustomerOverrideForm(formData: FormData): Record<string, string> | undefined {
  if (formData.get('no_client') !== 'on' && formData.get('no_client') !== 'true') return undefined;
  const fields = ['full_name', 'company', 'email', 'phone', 'ico', 'dic', 'street', 'city'] as const;
  const out: Record<string, string> = {};
  for (const f of fields) {
    const v = formData.get(`cust_${f}`);
    if (typeof v === 'string' && v.trim().length > 0) out[f] = v.trim();
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

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
  if (role !== 'admin') {
    return { ok: false, error: 'Faktury smí vystavovat jen administrátor.' };
  }

  const supabase = await createClient();

  const items = parseFormItems(formData);
  const customerOverrideRaw = parseCustomerOverrideForm(formData);
  let parsed: z.infer<typeof CreateInvoiceSchema>;
  try {
    parsed = CreateInvoiceSchema.parse({
      client_id: String(formData.get('client_id') ?? '') || undefined,
      customer_override: customerOverrideRaw,
      project_id: String(formData.get('project_id') ?? '') || undefined,
      contract_id: String(formData.get('contract_id') ?? '') || undefined,
      invoice_number: (String(formData.get('invoice_number') ?? '').trim()) || undefined,
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

  if (!parsed.client_id && !parsed.customer_override) {
    return { ok: false, error: 'Vyber klienta nebo vyplň údaje odběratele ručně.' };
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

  let invoiceNumber: string;
  if (parsed.invoice_number) {
    const { data: clash } = await untyped(supabase)
      .from('invoices')
      .select('id')
      .eq('invoice_number', parsed.invoice_number)
      .maybeSingle();
    if (clash) {
      return { ok: false, error: `Faktura s číslem "${parsed.invoice_number}" už existuje.` };
    }
    invoiceNumber = parsed.invoice_number;
  } else {
    const { data: numData } = await supabase.rpc('next_invoice_number');
    invoiceNumber = typeof numData === 'string' ? numData : `F${Date.now()}`;
  }
  const variableSymbol = parsed.variable_symbol ?? invoiceNumber.replace(/\D/g, '');

  const supplierOverride = parseSupplierOverrideForm(formData);
  const isOneOff = !parsed.client_id;

  // 1) INSERT záznamu (zatím bez pdf_url)
  const { data: insRow, error: insErr } = await untyped(supabase)
    .from('invoices')
    .insert({
      client_id: parsed.client_id ?? null,
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
      customer_override: parsed.customer_override ?? null,
    })
    .select('id, issued_at')
    .single();

  if (insErr || !insRow) {
    return { ok: false, error: insErr?.message ?? 'Nepodařilo se vytvořit fakturu.' };
  }
  const invoiceId = (insRow as { id: string }).id;
  const issuedAt = (insRow as { issued_at: string }).issued_at;

  // 2) Načti odběratele (klient profil nebo customer_override) + dodavatele.
  const admin = createAdminClient();
  const baseDodavatel = await getDodavatel();
  const dodavatel = applySupplierOverride(baseDodavatel, supplierOverride);

  let customer: InvoiceCustomer;
  if (isOneOff) {
    const co = parsed.customer_override!;
    customer = {
      full_name: co.full_name,
      email: co.email ?? null,
      phone: co.phone ?? null,
      company: co.company ?? null,
      ico: co.ico ?? null,
      dic: co.dic ?? null,
      street: co.street ?? null,
      city: co.city ?? null,
    };
  } else {
    const { data: clientRow } = await untyped(admin)
      .from('profiles')
      .select('id, full_name, email, phone, company, ico, dic, street, city')
      .eq('id', parsed.client_id!)
      .single();
    customer = {
      full_name: (clientRow as { full_name?: string | null } | null)?.full_name ?? 'Klient',
      email: (clientRow as { email?: string | null } | null)?.email ?? null,
      phone: (clientRow as { phone?: string | null } | null)?.phone ?? null,
      company: (clientRow as { company?: string | null } | null)?.company ?? null,
      ico: (clientRow as { ico?: string | null } | null)?.ico ?? null,
      dic: (clientRow as { dic?: string | null } | null)?.dic ?? null,
      street: (clientRow as { street?: string | null } | null)?.street ?? null,
      city: (clientRow as { city?: string | null } | null)?.city ?? null,
    };
  }

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
    });

    const safeNum = invoiceNumber.replace(/[^A-Za-z0-9-]/g, '_');
    const filename = parsed.kind === 'zaloha' ? `Zalohova-faktura-${safeNum}.pdf` : `Faktura-${safeNum}.pdf`;
    if (isOneOff) {
      // Bez klienta nemáme kam navázat documents row — upload jen do storage.
      const path = `_oneoff/${invoiceId}/${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]+/g, '_')}`;
      const { error: upErr } = await admin.storage
        .from('documents')
        .upload(path, pdf, { contentType: 'application/pdf', upsert: false });
      if (upErr) throw new Error(`Storage upload failed: ${upErr.message}`);
      pdfStoragePath = path;
    } else {
      const up = await uploadDocument({
        clientId: parsed.client_id!,
        projectId: parsed.project_id ?? null,
        type: 'faktura',
        filename,
        contentType: 'application/pdf',
        body: pdf,
        invoiceId,
        title: filename,
      });
      pdfStoragePath = up.path;
    }
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

  // 4) ŽÁDNÝ auto-email. Dřív se tu posílal odkaz na /portal/faktury (gated
  //    zóna) → klient bez účtu skončil na loginu / 404. Fakturu teď admin
  //    posílá výslovně tlačítkem "Poslat klientovi" → PDF jako příloha
  //    (sendInvoiceToClient níže). Žádný skrytý reroute do zóny.

  revalidatePath('/portal/admin/faktury');
  revalidatePath('/portal/faktury');
  return { ok: true, invoiceId, pdfUrl: pdfStoragePath };
}

export async function markInvoicePaid(invoiceId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const check = await checkRealViewer();
  if (!check.ok) return { ok: false, error: check.error };
  const role = await getViewerRole();
  if (role !== 'admin') return { ok: false, error: 'Tuto akci smí provést jen administrátor.' };

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
  if (role !== 'admin') return { ok: false, error: 'Tuto akci smí provést jen administrátor.' };

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
    .select('id, invoice_number, kind, amount, description, issued_at, due_date, variable_symbol, constant_symbol, payment_method, items, client_id, project_id, currency, supplier_override, customer_override')
    .eq('id', invoiceId)
    .single();
  if (!invRow) return { ok: false, error: 'Faktura nenalezena.' };
  const inv = invRow as Record<string, unknown>;
  const clientId = (inv['client_id'] as string | null) ?? null;
  const customerOverride = inv['customer_override'] as Record<string, string | null> | null;

  // Obchodník smí regenerovat jen fakturu svého přiřazeného klienta; jednorázové jen admin.
  if (role !== 'admin') {
    if (!clientId) return { ok: false, error: 'Jednorázovou fakturu smí spravovat jen administrátor.' };
    if (!(await clientAssignedTo(clientId, check.viewer.id))) {
      return { ok: false, error: 'Tento klient vám není přiřazen.' };
    }
  }

  const baseDodavatel = await getDodavatel();
  const dodavatel = applySupplierOverride(baseDodavatel, inv['supplier_override']);

  let customer: InvoiceCustomer;
  if (clientId) {
    const { data: clientRow } = await untyped(admin)
      .from('profiles')
      .select('id, full_name, email, phone, company, ico, dic, street, city')
      .eq('id', clientId)
      .single();
    customer = {
      full_name: (clientRow as { full_name?: string | null } | null)?.full_name ?? 'Klient',
      email: (clientRow as { email?: string | null } | null)?.email ?? null,
      phone: (clientRow as { phone?: string | null } | null)?.phone ?? null,
      company: (clientRow as { company?: string | null } | null)?.company ?? null,
      ico: (clientRow as { ico?: string | null } | null)?.ico ?? null,
      dic: (clientRow as { dic?: string | null } | null)?.dic ?? null,
      street: (clientRow as { street?: string | null } | null)?.street ?? null,
      city: (clientRow as { city?: string | null } | null)?.city ?? null,
    };
  } else if (customerOverride) {
    customer = {
      full_name: customerOverride.full_name ?? 'Odběratel',
      email: customerOverride.email ?? null,
      phone: customerOverride.phone ?? null,
      company: customerOverride.company ?? null,
      ico: customerOverride.ico ?? null,
      dic: customerOverride.dic ?? null,
      street: customerOverride.street ?? null,
      city: customerOverride.city ?? null,
    };
  } else {
    return { ok: false, error: 'Faktura nemá klienta ani vyplněného odběratele.' };
  }

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
    let path: string;
    if (clientId) {
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
      path = up.path;
    } else {
      path = `_oneoff/${invoiceId}/${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]+/g, '_')}`;
      const { error: upErr } = await admin.storage
        .from('documents')
        .upload(path, pdf, { contentType: 'application/pdf', upsert: false });
      if (upErr) throw new Error(`Storage upload failed: ${upErr.message}`);
    }
    await untyped(admin).from('invoices').update({ pdf_url: path }).eq('id', invoiceId);
    revalidatePath('/portal/admin/faktury');
    revalidatePath('/portal/faktury');
    return { ok: true, path };
  } catch (err) {
    console.error('[INVOICE PDF] regenerate failed', err);
    return { ok: false, error: err instanceof Error ? err.message : 'PDF generation failed' };
  }
}

const INVOICE_KIND_LABEL: Record<string, string> = {
  zaloha: 'Zálohová faktura',
  konecna: 'Faktura',
  dobropis: 'Dobropis',
  paushal: 'Paušální faktura',
};

/**
 * Pošle klientovi fakturu jako PDF PŘÍLOHU e-mailu (žádný odkaz do portálu).
 * Zároveň nastaví shared_at → faktura se zpřístupní v klientské zóně.
 * Funguje i pro jednorázové faktury (pošle na customer_override.email).
 */
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function sendInvoiceToClient(
  invoiceId: string,
  overrideEmail?: string,
): Promise<{ ok: true; sentTo: string } | { ok: false; error: string }> {
  const check = await checkRealViewer();
  if (!check.ok) return { ok: false, error: check.error };
  const role = await getViewerRole();
  if (role !== 'admin' && role !== 'obchodnik') {
    return { ok: false, error: 'Nemáte oprávnění posílat faktury.' };
  }
  if (!process.env.RESEND_API_KEY) {
    return { ok: false, error: 'E-mailová služba není nakonfigurovaná (RESEND_API_KEY).' };
  }
  const override = overrideEmail?.trim();
  if (override && !EMAIL_RE.test(override)) {
    return { ok: false, error: 'Neplatná e-mailová adresa příjemce.' };
  }

  const admin = createAdminClient();
  const { data: invRow } = await untyped(admin)
    .from('invoices')
    .select('id, invoice_number, kind, amount, due_date, pdf_url, client_id, customer_override')
    .eq('id', invoiceId)
    .single();
  if (!invRow) return { ok: false, error: 'Faktura nenalezena.' };
  const inv = invRow as unknown as {
    invoice_number: string;
    kind: string;
    amount: number;
    due_date: string;
    pdf_url: string | null;
    client_id: string | null;
    customer_override: { full_name?: string | null; email?: string | null } | null;
  };

  // Jednorázová faktura (bez klienta) = jen admin (obchodník k ní nemá vztah).
  if (!inv.client_id && role !== 'admin') {
    return { ok: false, error: 'Jednorázovou fakturu smí odeslat jen administrátor.' };
  }
  // Ownership: obchodník smí poslat jen fakturu svého přiřazeného klienta
  // (akce běží přes service-role admin client, RLS by ji nezachytila).
  if (role !== 'admin' && inv.client_id) {
    const { data: own } = await untyped(admin).from('profiles').select('assigned_obchodnik').eq('id', inv.client_id).single();
    if ((own as { assigned_obchodnik?: string | null } | null)?.assigned_obchodnik !== check.viewer.id) {
      return { ok: false, error: 'Tento klient vám není přiřazen.' };
    }
  }

  // Zajisti existující PDF (případně dogeneruj).
  let pdfPath = inv.pdf_url;
  if (!pdfPath) {
    const regen = await regenerateInvoicePdf(invoiceId);
    if (!regen.ok) return { ok: false, error: `PDF se nepodařilo připravit: ${regen.error}` };
    pdfPath = regen.path;
  }

  // Najdi příjemce + jméno. Priorita: override > fakturační e-mail klienta > hlavní e-mail.
  let recipientEmail: string | null = null;
  let recipientName = 'kliente';
  if (inv.client_id) {
    const { data: prof } = await untyped(admin)
      .from('profiles')
      .select('email, full_name, billing_email')
      .eq('id', inv.client_id)
      .single();
    const p = prof as { email?: string | null; full_name?: string | null; billing_email?: string | null } | null;
    recipientEmail = p?.billing_email || p?.email || null;
    recipientName = p?.full_name?.split(' ')[0] || recipientName;
  } else if (inv.customer_override) {
    recipientEmail = inv.customer_override.email ?? null;
    recipientName = inv.customer_override.full_name?.split(' ')[0] || recipientName;
  }
  if (override) recipientEmail = override;
  if (!recipientEmail) {
    return { ok: false, error: 'Klient/odběratel nemá vyplněný e-mail — fakturu nelze odeslat.' };
  }

  // Stáhni PDF a pošli jako přílohu.
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await downloadDocument(pdfPath);
  } catch (err) {
    console.error('[INVOICE SEND] download failed', err);
    return { ok: false, error: 'PDF se nepodařilo stáhnout ze storage.' };
  }

  const kindLabel = INVOICE_KIND_LABEL[inv.kind] ?? 'Faktura';
  const safeNum = inv.invoice_number.replace(/[^A-Za-z0-9-]/g, '_');
  const filename = inv.kind === 'zaloha' ? `Zalohova-faktura-${safeNum}.pdf` : `Faktura-${safeNum}.pdf`;

  try {
    await sendEmail({
      to: recipientEmail,
      subject: `${kindLabel} ${inv.invoice_number} (${formatMoney(Number(inv.amount))})`,
      replyTo: process.env.RESEND_REPLY_TO,
      body: InvoiceDeliveryEmail({
        name: recipientName,
        invoiceNumber: inv.invoice_number,
        amount: formatMoney(Number(inv.amount)),
        dueDate: formatDate(inv.due_date),
        kindLabel,
      }),
      attachments: [{ filename, content: pdfBuffer }],
    });
  } catch (err) {
    console.error('[INVOICE SEND] email failed', err);
    return { ok: false, error: 'E-mail se nepodařilo odeslat.' };
  }

  // Označení odeslání (shared_at = kdy byl PDF odeslán e-mailem).
  await untyped(admin)
    .from('invoices')
    .update({ shared_at: new Date().toISOString() })
    .eq('id', invoiceId);

  // Zaloguj do korespondence klienta (jen faktury napojené na klienta).
  if (inv.client_id) {
    void logClientEmail({
      clientId: inv.client_id,
      direction: 'outbound',
      fromEmail: process.env.RESEND_FROM ?? 'noreply@arbiq.cz',
      toEmail: recipientEmail,
      subject: `${kindLabel} ${inv.invoice_number} (${formatMoney(Number(inv.amount))})`,
      body: `${kindLabel} ${inv.invoice_number} na ${formatMoney(Number(inv.amount))} byla odeslána jako PDF příloha. Splatnost ${formatDate(inv.due_date)}.`,
    });
  }

  revalidatePath('/portal/admin/faktury');
  revalidatePath('/portal/faktury');
  return { ok: true, sentTo: recipientEmail };
}

// markOverdueInvoices přesunuto do lib/jobs/invoice-jobs.ts (NE 'use server'),
// aby ho Next.js nevystavoval jako Server Action callable z prohlížeče.
// Cron route /api/cron/overdue-invoices ho importuje z toho nového umístění.
