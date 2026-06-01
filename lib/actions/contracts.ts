'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { untyped } from '@/lib/supabase/untyped';
import { checkRealViewer, getViewerRole } from '@/lib/supabase/viewer';
import { sendEmail } from '@/lib/email/send';
import { ContractDeliveryEmail } from '@/lib/email/templates/contract-delivery';
import { getDodavatel } from '@/lib/config/dodavatel';
import { uploadDocument, downloadDocument } from '@/lib/storage/documents';
import { renderContractPdf, type ContractDoc, type ContractCustomer } from '@/lib/pdf/contract';
import { renderContractDocx } from '@/lib/docx/contract';

const ContractSchema = z.object({
  client_id: z.string().uuid(),
  project_id: z.string().uuid().optional(),
  contract_number: z.string().trim().min(1).max(60).regex(/^[A-Za-z0-9._\/-]+$/, 'Číslo smí obsahovat jen písmena, číslice, ._-/').optional(),
  kind: z.enum(['smlouva_o_dilo', 'smlouva_paushal', 'nda', 'dodatek', 'jine']).default('smlouva_o_dilo'),
  title: z.string().min(3).max(200),
  subject: z.string().min(5).max(500),
  scope_bullets: z.array(z.string().min(2).max(500)).max(40).optional(),
  total_price: z.number().positive(),
  deposit_percent: z.number().min(0).max(100).default(50),
  hourly_rate: z.number().positive().default(900),
  monthly_fee: z.number().nonnegative().optional().nullable(),
  deadline_days: z.number().int().positive().max(365).default(14),
  warranty_months: z.number().int().min(0).max(36).default(3),
  late_fee_per_day: z.number().min(0).max(1).default(0.0005),
  penalty_max: z.number().nonnegative().optional().nullable(),
  place_of_signing: z.string().max(80).default('Bělči'),
  has_nda: z.boolean().default(true),
  nda_penalty: z.number().nonnegative().default(100000),
  has_exclusivity: z.boolean().default(false),
  exclusivity_clause: z.string().max(2000).optional().nullable(),
});

export type ContractActionResult = { ok: true; contractId: string; pdfPath?: string; docxPath?: string } | { ok: false; error: string };

function num(formData: FormData, key: string, fallback?: number): number {
  const v = formData.get(key);
  if (typeof v !== 'string' || v.trim() === '') return fallback ?? 0;
  const n = Number(v.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : (fallback ?? 0);
}

function bool(formData: FormData, key: string, fallback = false): boolean {
  const v = formData.get(key);
  if (v === null) return fallback;
  return v === 'on' || v === 'true' || v === '1';
}

function parseBullets(formData: FormData): string[] | undefined {
  const raw = formData.get('scope_bullets');
  if (typeof raw !== 'string' || !raw.trim()) return undefined;
  return raw.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
}

export async function createContract(formData: FormData): Promise<ContractActionResult> {
  const check = await checkRealViewer();
  if (!check.ok) return { ok: false, error: check.error };
  const role = await getViewerRole();
  if (role !== 'admin' && role !== 'obchodnik') {
    return { ok: false, error: 'Nemáte oprávnění vystavovat smlouvy.' };
  }
  const user = { id: check.viewer.id };
  const supabase = await createClient();

  let parsed: z.infer<typeof ContractSchema>;
  try {
    parsed = ContractSchema.parse({
      client_id: String(formData.get('client_id') ?? ''),
      project_id: String(formData.get('project_id') ?? '') || undefined,
      contract_number: (String(formData.get('contract_number') ?? '').trim()) || undefined,
      kind: String(formData.get('kind') ?? 'smlouva_o_dilo'),
      title: String(formData.get('title') ?? '').trim(),
      subject: String(formData.get('subject') ?? '').trim(),
      scope_bullets: parseBullets(formData),
      total_price: num(formData, 'total_price'),
      deposit_percent: num(formData, 'deposit_percent', 50),
      hourly_rate: num(formData, 'hourly_rate', 900),
      monthly_fee: formData.get('monthly_fee') ? num(formData, 'monthly_fee') : null,
      deadline_days: Math.round(num(formData, 'deadline_days', 14)),
      warranty_months: Math.round(num(formData, 'warranty_months', 3)),
      late_fee_per_day: num(formData, 'late_fee_per_day', 0.0005),
      penalty_max: formData.get('penalty_max') ? num(formData, 'penalty_max') : null,
      place_of_signing: String(formData.get('place_of_signing') ?? 'Bělči'),
      has_nda: bool(formData, 'has_nda', true),
      nda_penalty: num(formData, 'nda_penalty', 100000),
      has_exclusivity: bool(formData, 'has_exclusivity', false),
      exclusivity_clause: String(formData.get('exclusivity_clause') ?? '') || null,
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof z.ZodError ? err.issues.map((i) => i.message).join(', ') : 'Neplatná data.',
    };
  }

  // Číslo smlouvy: pokud admin zadal manuálně, použij + zkontroluj kolizi.
  let contractNumber: string;
  if (parsed.contract_number) {
    const { data: clash } = await untyped(supabase)
      .from('contracts')
      .select('id')
      .eq('contract_number', parsed.contract_number)
      .maybeSingle();
    if (clash) {
      return { ok: false, error: `Smlouva s číslem "${parsed.contract_number}" už existuje.` };
    }
    contractNumber = parsed.contract_number;
  } else {
    const { data: numData } = await untyped(supabase).rpc('next_contract_number');
    contractNumber = typeof numData === 'string' ? numData : `SMLA-${new Date().getFullYear()}-${Date.now() % 1000}`;
  }

  // INSERT
  const { data: row, error } = await untyped(supabase)
    .from('contracts')
    .insert({
      client_id: parsed.client_id,
      project_id: parsed.project_id ?? null,
      obchodnik_id: user.id,
      contract_number: contractNumber,
      kind: parsed.kind,
      title: parsed.title,
      subject: parsed.subject,
      scope_bullets: parsed.scope_bullets ?? null,
      total_price: parsed.total_price,
      currency: 'CZK',
      vat_note: 'Zhotovitel není plátcem DPH',
      deposit_percent: parsed.deposit_percent,
      hourly_rate: parsed.hourly_rate,
      monthly_fee: parsed.monthly_fee,
      deadline_days: parsed.deadline_days,
      warranty_months: parsed.warranty_months,
      late_fee_per_day: parsed.late_fee_per_day,
      penalty_max: parsed.penalty_max,
      place_of_signing: parsed.place_of_signing,
      has_nda: parsed.has_nda,
      nda_penalty: parsed.nda_penalty,
      has_exclusivity: parsed.has_exclusivity,
      exclusivity_clause: parsed.exclusivity_clause,
      status: 'koncept',
    })
    .select('id')
    .single();

  if (error || !row) {
    return { ok: false, error: error?.message ?? 'Nepodařilo se vytvořit smlouvu.' };
  }
  const contractId = (row as { id: string }).id;

  // Vygeneruj PDF + DOCX
  const admin = createAdminClient();
  const [{ data: clientRow }, dodavatel] = await Promise.all([
    admin
      .from('profiles')
      .select('id, full_name, email, phone, company, ico, dic, street, city, representative_name')
      .eq('id', parsed.client_id)
      .single(),
    getDodavatel(),
  ]);

  const customer: ContractCustomer = {
    full_name: (clientRow as { full_name?: string | null } | null)?.full_name ?? 'Klient',
    email: (clientRow as { email?: string | null } | null)?.email ?? null,
    phone: (clientRow as { phone?: string | null } | null)?.phone ?? null,
    company: (clientRow as { company?: string | null } | null)?.company ?? null,
    ico: (clientRow as { ico?: string | null } | null)?.ico ?? null,
    dic: (clientRow as { dic?: string | null } | null)?.dic ?? null,
    street: (clientRow as { street?: string | null } | null)?.street ?? null,
    city: (clientRow as { city?: string | null } | null)?.city ?? null,
    representative: (clientRow as { representative_name?: string | null } | null)?.representative_name ?? null,
  };

  const doc: ContractDoc = {
    contractNumber,
    title: parsed.title,
    subject: parsed.subject,
    scopeBullets: parsed.scope_bullets ?? [],
    totalPrice: parsed.total_price,
    currency: 'CZK',
    depositPercent: parsed.deposit_percent,
    hourlyRate: parsed.hourly_rate,
    monthlyFee: parsed.monthly_fee ?? null,
    deadlineDays: parsed.deadline_days,
    warrantyMonths: parsed.warranty_months,
    lateFeePerDay: parsed.late_fee_per_day,
    penaltyMax: parsed.penalty_max ?? null,
    placeOfSigning: parsed.place_of_signing,
    hasNda: parsed.has_nda,
    ndaPenalty: parsed.nda_penalty,
    hasExclusivity: parsed.has_exclusivity,
    exclusivityClause: parsed.exclusivity_clause ?? null,
  };

  let pdfPath: string | undefined;
  let docxPath: string | undefined;

  try {
    const pdf = await renderContractPdf({ doc, customer, dodavatel });
    const up = await uploadDocument({
      clientId: parsed.client_id,
      projectId: parsed.project_id ?? null,
      type: 'smlouva',
      filename: `${contractNumber}.pdf`,
      contentType: 'application/pdf',
      body: pdf,
      contractId,
      title: `${parsed.title} (PDF)`,
    });
    pdfPath = up.path;
  } catch (err) {
    console.error('[CONTRACT PDF] failed', err);
  }

  try {
    const docx = await renderContractDocx({ doc, customer, dodavatel });
    const up = await uploadDocument({
      clientId: parsed.client_id,
      projectId: parsed.project_id ?? null,
      type: 'smlouva',
      filename: `${contractNumber}.docx`,
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      body: docx,
      contractId,
      title: `${parsed.title} (DOCX)`,
    });
    docxPath = up.path;
  } catch (err) {
    console.error('[CONTRACT DOCX] failed', err);
  }

  if (pdfPath || docxPath) {
    await untyped(admin).from('contracts').update({ pdf_url: pdfPath ?? null, docx_url: docxPath ?? null }).eq('id', contractId);
  }

  // ŽÁDNÝ auto-email. Smlouva zůstává skrytá (shared_at=NULL), dokud ji admin
  // výslovně nepošle klientovi tlačítkem → PDF přílohou (sendContractToClient).

  revalidatePath('/portal/admin/smlouvy');
  revalidatePath(`/portal/admin/crm/klient/${parsed.client_id}`);
  return { ok: true, contractId, pdfPath, docxPath };
}

type ContractRow = {
  id: string;
  contract_number: string;
  title: string;
  subject: string;
  scope_bullets: string[] | null;
  total_price: number;
  currency: string;
  deposit_percent: number;
  hourly_rate: number;
  monthly_fee: number | null;
  deadline_days: number;
  warranty_months: number;
  late_fee_per_day: number;
  penalty_max: number | null;
  place_of_signing: string;
  has_nda: boolean;
  nda_penalty: number;
  has_exclusivity: boolean;
  exclusivity_clause: string | null;
  client_id: string;
  project_id: string | null;
};

/**
 * Přegeneruje PDF (a DOCX) existující smlouvy. Užitečné když původní render
 * selhal (např. font fetch z gstatic timeoutoval) a contract zůstal s pdf_url=null.
 */
export async function regenerateContractDocs(contractId: string): Promise<
  { ok: true; pdfPath?: string; docxPath?: string; warning?: string } | { ok: false; error: string }
> {
  // KRITICKÉ: bypassuje RLS přes admin client — bez tohoto guardu by preview/anon
  // visitor mohl POSTem na Next-Action endpoint vytáhnout libovolnou smlouvu
  // (extrakce PDF/DOCX, spam upload do storage).
  const check = await checkRealViewer();
  if (!check.ok) return { ok: false, error: check.error };
  const role = await getViewerRole();
  if (role !== 'admin' && role !== 'obchodnik') {
    return { ok: false, error: 'Nemáte oprávnění regenerovat smlouvu.' };
  }

  const admin = createAdminClient();

  const { data: ctrRow, error: ctrErr } = await untyped(admin)
    .from('contracts')
    .select(
      'id, contract_number, title, subject, scope_bullets, total_price, currency, deposit_percent, hourly_rate, monthly_fee, deadline_days, warranty_months, late_fee_per_day, penalty_max, place_of_signing, has_nda, nda_penalty, has_exclusivity, exclusivity_clause, client_id, project_id',
    )
    .eq('id', contractId)
    .single();
  if (ctrErr || !ctrRow) {
    return { ok: false, error: ctrErr?.message ?? 'Smlouva nenalezena.' };
  }
  const c = ctrRow as unknown as ContractRow;

  const [{ data: clientRow }, dodavatel] = await Promise.all([
    untyped(admin)
      .from('profiles')
      .select('id, full_name, email, phone, company, ico, dic, street, city, representative_name')
      .eq('id', c.client_id)
      .single(),
    getDodavatel(),
  ]);

  const customer: ContractCustomer = {
    full_name: (clientRow as { full_name?: string | null } | null)?.full_name ?? 'Klient',
    email: (clientRow as { email?: string | null } | null)?.email ?? null,
    phone: (clientRow as { phone?: string | null } | null)?.phone ?? null,
    company: (clientRow as { company?: string | null } | null)?.company ?? null,
    ico: (clientRow as { ico?: string | null } | null)?.ico ?? null,
    dic: (clientRow as { dic?: string | null } | null)?.dic ?? null,
    street: (clientRow as { street?: string | null } | null)?.street ?? null,
    city: (clientRow as { city?: string | null } | null)?.city ?? null,
    representative: (clientRow as { representative_name?: string | null } | null)?.representative_name ?? null,
  };

  const doc: ContractDoc = {
    contractNumber: c.contract_number,
    title: c.title,
    subject: c.subject,
    scopeBullets: c.scope_bullets ?? [],
    totalPrice: Number(c.total_price),
    currency: c.currency ?? 'CZK',
    depositPercent: Number(c.deposit_percent ?? 50),
    hourlyRate: Number(c.hourly_rate ?? 900),
    monthlyFee: c.monthly_fee !== null ? Number(c.monthly_fee) : null,
    deadlineDays: Number(c.deadline_days ?? 14),
    warrantyMonths: Number(c.warranty_months ?? 3),
    lateFeePerDay: Number(c.late_fee_per_day ?? 0.0005),
    penaltyMax: c.penalty_max !== null ? Number(c.penalty_max) : null,
    placeOfSigning: c.place_of_signing ?? 'Bělči',
    hasNda: !!c.has_nda,
    ndaPenalty: Number(c.nda_penalty ?? 100000),
    hasExclusivity: !!c.has_exclusivity,
    exclusivityClause: c.exclusivity_clause ?? null,
  };

  let pdfPath: string | undefined;
  let docxPath: string | undefined;
  const errors: string[] = [];

  try {
    const pdf = await renderContractPdf({ doc, customer, dodavatel });
    const up = await uploadDocument({
      clientId: c.client_id,
      projectId: c.project_id,
      type: 'smlouva',
      filename: `${c.contract_number}.pdf`,
      contentType: 'application/pdf',
      body: pdf,
      contractId,
      title: `${c.title} (PDF)`,
    });
    pdfPath = up.path;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error('[CONTRACT PDF] regenerate failed:', msg, stack);
    errors.push(`PDF: ${msg}`);
  }

  try {
    const docx = await renderContractDocx({ doc, customer, dodavatel });
    const up = await uploadDocument({
      clientId: c.client_id,
      projectId: c.project_id,
      type: 'smlouva',
      filename: `${c.contract_number}.docx`,
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      body: docx,
      contractId,
      title: `${c.title} (DOCX)`,
    });
    docxPath = up.path;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[CONTRACT DOCX] regenerate failed:', msg);
    errors.push(`DOCX: ${msg}`);
  }

  const updates: Record<string, unknown> = {};
  if (pdfPath) updates['pdf_url'] = pdfPath;
  if (docxPath) updates['docx_url'] = docxPath;
  if (Object.keys(updates).length > 0) {
    await untyped(admin).from('contracts').update(updates).eq('id', contractId);
  }

  revalidatePath('/portal/admin/smlouvy');
  revalidatePath(`/portal/admin/crm/klient/${c.client_id}`);
  revalidatePath('/portal/smlouvy');

  // PDF je must-have — pokud chybí, surface error i když DOCX prošlo.
  if (!pdfPath) {
    return {
      ok: false,
      error: errors.length > 0 ? errors.join(' · ') : 'PDF se nevygenerovalo (neznámý důvod, zkontrolujte Vercel Runtime Logs).',
    };
  }
  return { ok: true, pdfPath, docxPath };
}

export async function markContractSigned(contractId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const check = await checkRealViewer();
  if (!check.ok) return { ok: false, error: check.error };
  const role = await getViewerRole();
  if (role !== 'admin' && role !== 'obchodnik') return { ok: false, error: 'Nemáte oprávnění.' };

  const supabase = await createClient();
  const { error } = await untyped(supabase)
    .from('contracts')
    .update({ status: 'podepsano', signed_at_customer: new Date().toISOString().slice(0, 10) })
    .eq('id', contractId);
  if (error) {
    console.error('[CONTRACT] markSigned failed', error);
    return { ok: false, error: 'Nepodařilo se označit jako podepsanou.' };
  }
  revalidatePath('/portal/admin/smlouvy');
  return { ok: true };
}

/**
 * Pošle klientovi smlouvu jako PDF PŘÍLOHU e-mailu (žádný odkaz do portálu).
 * Nastaví shared_at → smlouva se zpřístupní v klientské zóně. Pokud PDF chybí,
 * pokusí se ho dogenerovat.
 */
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function sendContractToClient(
  contractId: string,
  overrideEmail?: string,
): Promise<{ ok: true; sentTo: string } | { ok: false; error: string }> {
  const check = await checkRealViewer();
  if (!check.ok) return { ok: false, error: check.error };
  const role = await getViewerRole();
  if (role !== 'admin' && role !== 'obchodnik') {
    return { ok: false, error: 'Nemáte oprávnění posílat smlouvy.' };
  }
  if (!process.env.RESEND_API_KEY) {
    return { ok: false, error: 'E-mailová služba není nakonfigurovaná (RESEND_API_KEY).' };
  }
  const override = overrideEmail?.trim();
  if (override && !EMAIL_RE.test(override)) {
    return { ok: false, error: 'Neplatná e-mailová adresa příjemce.' };
  }

  const admin = createAdminClient();
  const { data: ctrRow } = await untyped(admin)
    .from('contracts')
    .select('id, contract_number, title, pdf_url, client_id, status')
    .eq('id', contractId)
    .single();
  if (!ctrRow) return { ok: false, error: 'Smlouva nenalezena.' };
  const c = ctrRow as unknown as {
    contract_number: string;
    title: string;
    pdf_url: string | null;
    client_id: string;
    status: string;
  };

  // Zajisti PDF.
  let pdfPath = c.pdf_url;
  if (!pdfPath) {
    const regen = await regenerateContractDocs(contractId);
    if (!regen.ok) return { ok: false, error: `PDF se nepodařilo připravit: ${regen.error}` };
    pdfPath = regen.pdfPath ?? null;
    if (!pdfPath) return { ok: false, error: 'PDF se nepodařilo připravit.' };
  }

  const { data: prof } = await untyped(admin)
    .from('profiles')
    .select('email, full_name, contract_email')
    .eq('id', c.client_id)
    .single();
  const p = prof as { email?: string | null; full_name?: string | null; contract_email?: string | null } | null;
  // Priorita: override > smluvní e-mail klienta > hlavní e-mail.
  const recipientEmail = override || p?.contract_email || p?.email || null;
  const recipientName = p?.full_name?.split(' ')[0] || 'kliente';
  if (!recipientEmail) {
    return { ok: false, error: 'Klient nemá vyplněný e-mail — smlouvu nelze odeslat.' };
  }

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await downloadDocument(pdfPath);
  } catch (err) {
    console.error('[CONTRACT SEND] download failed', err);
    return { ok: false, error: 'PDF se nepodařilo stáhnout ze storage.' };
  }

  const safeNum = c.contract_number.replace(/[^A-Za-z0-9-]/g, '_');
  try {
    await sendEmail({
      to: recipientEmail,
      subject: `Smlouva ${c.contract_number} — ${c.title}`,
      replyTo: process.env.RESEND_REPLY_TO,
      body: ContractDeliveryEmail({
        name: recipientName,
        contractNumber: c.contract_number,
        title: c.title,
      }),
      attachments: [{ filename: `Smlouva-${safeNum}.pdf`, content: pdfBuffer }],
    });
  } catch (err) {
    console.error('[CONTRACT SEND] email failed', err);
    return { ok: false, error: 'E-mail se nepodařilo odeslat.' };
  }

  // Sdílení do zóny + posun stavu z konceptu na 'poslano' (nepřepisuj podepsano/zruseno).
  const update: Record<string, unknown> = { shared_at: new Date().toISOString() };
  if (c.status === 'koncept') update['status'] = 'poslano';
  await untyped(admin).from('contracts').update(update).eq('id', contractId);

  revalidatePath('/portal/admin/smlouvy');
  revalidatePath('/portal/smlouvy');
  return { ok: true, sentTo: recipientEmail };
}

export async function cancelContract(contractId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const check = await checkRealViewer();
  if (!check.ok) return { ok: false, error: check.error };
  const role = await getViewerRole();
  if (role !== 'admin' && role !== 'obchodnik') return { ok: false, error: 'Nemáte oprávnění.' };

  const supabase = await createClient();
  const { error } = await untyped(supabase).from('contracts').update({ status: 'zruseno' }).eq('id', contractId);
  if (error) {
    console.error('[CONTRACT] cancel failed', error);
    return { ok: false, error: 'Storno selhalo.' };
  }
  revalidatePath('/portal/admin/smlouvy');
  return { ok: true };
}
