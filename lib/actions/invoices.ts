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
import { logAdminAction } from '@/lib/audit';
import { InvoiceDeliveryEmail } from '@/lib/email/templates/invoice-delivery';
import { getDodavatel } from '@/lib/config/dodavatel';
import { uploadDocument, downloadDocument } from '@/lib/storage/documents';
import { renderInvoicePdf, type InvoiceDoc, type InvoiceCustomer, type InvoiceItem } from '@/lib/pdf/invoice';
import { buildSpaydPayload, spaydQrDataUrlFromPayload } from '@/lib/payments/spayd';
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
  corrected_invoice_id: z.string().uuid().optional(),
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
      corrected_invoice_id: String(formData.get('corrected_invoice_id') ?? '') || undefined,
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

  // Spočítej částku z items, fallback na pole amount. Bereme absolutní hodnotu;
  // znaménko řeší typ dokladu níže (dobropis = záporné).
  const itemsTotal = parsed.items?.reduce((s, it) => s + it.quantity * it.unit_price, 0) ?? 0;
  const amountFromString = parsed.amount
    ? Number(parsed.amount.replace(/\s/g, '').replace(',', '.'))
    : 0;
  const absAmount = Math.abs(itemsTotal !== 0 ? itemsTotal : amountFromString);
  if (!Number.isFinite(absAmount) || absAmount <= 0) {
    return { ok: false, error: 'Neplatná částka.' };
  }
  const isDobropis = parsed.kind === 'dobropis';
  // Dobropis = ZÁPORNÁ částka (vrácení/oprava), bez QR a bez výzvy k úhradě.
  const amount = isDobropis ? -absAmount : absAmount;

  // Pokud nebyly položky zadány, vytvoříme jednu z description + částky.
  const baseItems: InvoiceItem[] = parsed.items && parsed.items.length > 0
    ? parsed.items
    : [{
        label: parsed.description || (parsed.kind === 'zaloha' ? 'Záloha dle smlouvy' : isDobropis ? 'Dobropis' : 'Vystavení faktury'),
        description: null,
        quantity: 1,
        unit: 'ks',
        unit_price: absAmount,
      }];
  // U dobropisu otoč znaménko položek, ať řádky i součet sedí se zápornou částkou.
  const finalItems: InvoiceItem[] = isDobropis
    ? baseItems.map((it) => ({ ...it, unit_price: -Math.abs(it.unit_price) }))
    : baseItems;

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
      // Dobropis se neinkasuje → rovnou vyrovnaný, ať nesedí v „čeká"/po splatnosti.
      status: isDobropis ? 'zaplaceno' : 'ceka',
      paid_at: isDobropis ? (parsed.issued_at ?? new Date().toISOString().slice(0, 10)) : null,
      corrected_invoice_id: parsed.corrected_invoice_id ?? null,
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
    qrPayload = (parsed.payment_method === 'cash' || isDobropis) ? null : buildSpaydPayload({
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
    .select('id, invoice_number, kind, amount, due_date, pdf_url, client_id, customer_override, qr_payload, variable_symbol, payment_method')
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
    qr_payload: string | null;
    variable_symbol: string | null;
    payment_method: string | null;
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

  // QR platba přímo do e-mailu (nejen v PDF). Dobropis/hotovost → bez QR.
  let qrDataUrl: string | null = null;
  let qrIban: string | null = null;
  if (inv.qr_payload && inv.payment_method !== 'cash' && inv.kind !== 'dobropis') {
    try {
      qrDataUrl = await spaydQrDataUrlFromPayload(inv.qr_payload);
      qrIban = inv.qr_payload.match(/ACC:([^*+]+)/)?.[1] ?? null;
    } catch (err) {
      console.error('[INVOICE SEND] QR render failed', err);
    }
  }

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
        qrDataUrl,
        iban: qrIban,
        variableSymbol: inv.variable_symbol,
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

/**
 * Hromadné odeslání faktur klientům (PDF přílohou). Volá sendInvoiceToClient
 * pro každou — ta si sama hlídá oprávnění i ownership, takže je to bezpečné.
 */
export async function bulkSendInvoices(
  ids: string[],
): Promise<{ ok: true; results: Array<{ id: string; ok: boolean; sentTo?: string; error?: string }> } | { ok: false; error: string }> {
  if (!Array.isArray(ids) || ids.length === 0) return { ok: false, error: 'Nic nevybráno.' };
  if (ids.length > 100) return { ok: false, error: 'Max 100 faktur najednou.' };
  const results: Array<{ id: string; ok: boolean; sentTo?: string; error?: string }> = [];
  for (const id of ids) {
    const r = await sendInvoiceToClient(id);
    results.push(r.ok ? { id, ok: true, sentTo: r.sentTo } : { id, ok: false, error: r.error });
  }
  return { ok: true, results };
}

/**
 * Vystaví dobropis (opravný daňový doklad) k existující faktuře — pro špatně
 * poslanou fakturu nebo nedodanou službu. Vytvoří NOVÝ doklad kind='dobropis'
 * se zápornou částkou, navázaný na původní fakturu. Původní fakturu needituje
 * (na to je samostatné storno). Admin only.
 */
export async function createCreditNote(
  invoiceId: string,
  reason?: string,
): Promise<InvoiceActionResult> {
  const check = await checkRealViewer();
  if (!check.ok) return { ok: false, error: check.error };
  const role = await getViewerRole();
  if (role !== 'admin') return { ok: false, error: 'Dobropis smí vystavit jen administrátor.' };

  const admin = createAdminClient();
  const { data: origRow } = await untyped(admin)
    .from('invoices')
    .select('id, invoice_number, kind, status, client_id, project_id, customer_override, items, amount, description, payment_method')
    .eq('id', invoiceId)
    .single();
  if (!origRow) return { ok: false, error: 'Faktura nenalezena.' };
  const o = origRow as {
    invoice_number: string; kind: string; status: string; client_id: string | null; project_id: string | null;
    customer_override: Record<string, string | null> | null;
    items: unknown; amount: number; description: string | null; payment_method: string | null;
  };
  if (o.kind === 'dobropis') return { ok: false, error: 'Na dobropis nelze vystavit další dobropis.' };

  const f = new FormData();
  f.set('kind', 'dobropis');
  f.set('due_date', new Date().toISOString().slice(0, 10));
  f.set('payment_method', o.payment_method || 'bank');
  f.set('corrected_invoice_id', invoiceId);
  f.set('description', `Dobropis k faktuře ${o.invoice_number}${reason ? ` — ${reason}` : ''}`);

  // Položky z původní faktury (createInvoice u dobropisu otočí znaménko na záporné).
  const items = Array.isArray(o.items) ? (o.items as Array<{ unit_price?: number }>) : [];
  if (items.length > 0) {
    f.set('items', JSON.stringify(items.map((it) => ({ ...it, unit_price: Math.abs(Number(it.unit_price ?? 0)) }))));
  } else {
    f.set('amount', String(Math.abs(Number(o.amount ?? 0))));
  }

  if (o.client_id) {
    f.set('client_id', o.client_id);
    if (o.project_id) f.set('project_id', o.project_id);
  } else if (o.customer_override) {
    f.set('no_client', 'on');
    const co = o.customer_override;
    for (const k of ['full_name', 'company', 'email', 'phone', 'ico', 'dic', 'street', 'city'] as const) {
      const v = co[k];
      if (typeof v === 'string' && v) f.set(`cust_${k}`, v);
    }
  } else {
    return { ok: false, error: 'Faktura nemá odběratele.' };
  }

  const result = await createInvoice(f);

  // Variant 1: dobropis = původní faktura padá. Stornuj ji. Výjimka: už zaplacená
  // faktura zůstává 'zaplaceno' (peníze reálně přišly) — dobropis ji vynuluje
  // záporným dokladem, storno paid faktury by zkreslilo účetnictví.
  if (result.ok && o.status !== 'zaplaceno' && o.status !== 'zruseno') {
    await untyped(admin).from('invoices').update({ status: 'zruseno' }).eq('id', invoiceId);
    await logAdminAction({ actorId: check.viewer.id, action: 'invoice.cancel_via_credit_note', targetId: invoiceId, targetType: 'invoice' });
    revalidatePath('/portal/admin/faktury');
  }

  return result;
}

// markOverdueInvoices přesunuto do lib/jobs/invoice-jobs.ts (NE 'use server'),
// aby ho Next.js nevystavoval jako Server Action callable z prohlížeče.
// Cron route /api/cron/overdue-invoices ho importuje z toho nového umístění.
