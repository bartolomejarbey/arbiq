'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { untyped } from '@/lib/supabase/untyped';
import { checkRealViewer, getViewerRole } from '@/lib/supabase/viewer';
import { clientAssignedTo } from '@/lib/actions/ownership';
import { createContract } from '@/lib/actions/contracts';
import { notifyPortalUser } from '@/lib/email/notify';
import { getDodavatel } from '@/lib/config/dodavatel';
import { uploadDocument } from '@/lib/storage/documents';
import { renderNabidkaPdf, type QuoteDoc, type QuoteCustomer, type QuoteItem } from '@/lib/pdf/nabidka';

const ItemSchema = z.object({
  label: z.string().min(1).max(200),
  description: z.string().max(500).optional().nullable(),
  quantity: z.number().positive(),
  unit: z.string().max(20).optional().nullable(),
  unit_price: z.number().nonnegative(),
});

const QuoteSchema = z.object({
  client_id: z.string().uuid(),
  project_id: z.string().uuid().optional(),
  title: z.string().min(3).max(200),
  intro_text: z.string().max(2000).optional().nullable(),
  items: z.array(ItemSchema).min(1).max(40),
  payment_terms: z.string().max(500).default('50 % záloha při akceptaci, 50 % po předání díla'),
  deadline_days: z.number().int().min(1).max(365).default(14),
  valid_days: z.number().int().min(1).max(365).default(30),
});

export type QuoteActionResult = { ok: true; quoteId: string; pdfPath?: string } | { ok: false; error: string };

function parseItems(formData: FormData): QuoteItem[] {
  const raw = formData.get('items');
  if (typeof raw !== 'string' || raw.length === 0) return [];
  try {
    const arr = JSON.parse(raw) as Array<Record<string, unknown>>;
    return arr.map((p) => ({
      label: String(p['label'] ?? '').trim(),
      description: (p['description'] as string | null) ?? null,
      quantity: Number(p['quantity'] ?? 1),
      unit: (p['unit'] as string | null) ?? 'ks',
      unit_price: Number(p['unit_price'] ?? 0),
    }));
  } catch {
    return [];
  }
}

export async function createQuote(formData: FormData): Promise<QuoteActionResult> {
  const check = await checkRealViewer();
  if (!check.ok) return { ok: false, error: check.error };
  const role = await getViewerRole();
  if (role !== 'admin' && role !== 'obchodnik') {
    return { ok: false, error: 'Nemáte oprávnění vytvářet nabídky.' };
  }

  let parsed: z.infer<typeof QuoteSchema>;
  try {
    parsed = QuoteSchema.parse({
      client_id: String(formData.get('client_id') ?? ''),
      project_id: String(formData.get('project_id') ?? '') || undefined,
      title: String(formData.get('title') ?? '').trim(),
      intro_text: String(formData.get('intro_text') ?? '') || null,
      items: parseItems(formData),
      payment_terms: String(formData.get('payment_terms') ?? '50 % záloha při akceptaci, 50 % po předání díla'),
      deadline_days: Number(formData.get('deadline_days') ?? 14),
      valid_days: Number(formData.get('valid_days') ?? 30),
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof z.ZodError ? err.issues.map((i) => i.message).join(', ') : 'Neplatná data.',
    };
  }

  const totalPrice = parsed.items.reduce((s, it) => s + it.quantity * it.unit_price, 0);
  if (totalPrice <= 0) return { ok: false, error: 'Celková cena musí být kladná.' };

  // Ownership: obchodník smí vystavit nabídku jen svému přiřazenému klientovi.
  if (role !== 'admin' && !(await clientAssignedTo(parsed.client_id, check.viewer.id))) {
    return { ok: false, error: 'Tento klient vám není přiřazen.' };
  }

  const supabase = await createClient();
  const { data: numData } = await untyped(supabase).rpc('next_quote_number');
  const quoteNumber = typeof numData === 'string' ? numData : `NAB-${new Date().getFullYear()}-${Date.now() % 1000}`;

  const validUntil = new Date(Date.now() + parsed.valid_days * 86400_000).toISOString().slice(0, 10);

  const { data: row, error } = await untyped(supabase)
    .from('quotes')
    .insert({
      client_id: parsed.client_id,
      project_id: parsed.project_id ?? null,
      obchodnik_id: check.viewer.id,
      quote_number: quoteNumber,
      title: parsed.title,
      intro_text: parsed.intro_text,
      items: parsed.items,
      total_price: totalPrice,
      currency: 'CZK',
      vat_note: 'Zhotovitel není plátcem DPH',
      valid_until: validUntil,
      payment_terms: parsed.payment_terms,
      deadline_days: parsed.deadline_days,
      status: 'koncept',
    })
    .select('id')
    .single();
  if (error || !row) {
    return { ok: false, error: error?.message ?? 'Nepodařilo se vytvořit nabídku.' };
  }
  const quoteId = (row as { id: string }).id;

  // Generate PDF
  const admin = createAdminClient();
  const [{ data: clientRow }, dodavatel] = await Promise.all([
    untyped(admin)
      .from('profiles')
      .select('id, full_name, email, phone, company, ico, dic, street, city, representative_name')
      .eq('id', parsed.client_id)
      .single(),
    getDodavatel(),
  ]);

  const customer: QuoteCustomer = {
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

  const doc: QuoteDoc = {
    quoteNumber,
    title: parsed.title,
    introText: parsed.intro_text,
    items: parsed.items,
    totalPrice,
    currency: 'CZK',
    validUntil,
    paymentTerms: parsed.payment_terms,
    deadlineDays: parsed.deadline_days,
  };

  let pdfPath: string | undefined;
  try {
    const pdf = await renderNabidkaPdf({ doc, customer, dodavatel });
    const up = await uploadDocument({
      clientId: parsed.client_id,
      projectId: parsed.project_id ?? null,
      type: 'nabidka',
      filename: `${quoteNumber}.pdf`,
      contentType: 'application/pdf',
      body: pdf,
      title: `${parsed.title} (Nabídka)`,
    });
    pdfPath = up.path;
    await untyped(admin).from('quotes').update({ pdf_url: pdfPath }).eq('id', quoteId);
    await untyped(admin).from('documents').update({ quote_id: quoteId }).eq('id', up.documentId);
  } catch (err) {
    console.error('[QUOTE PDF] failed', err);
  }

  void notifyPortalUser({
    recipientId: parsed.client_id,
    subject: `Cenová nabídka ${quoteNumber}`,
    heading: `Cenová nabídka ${quoteNumber}`,
    intro: `Připravili jsme pro Vás nabídku „${parsed.title}" v hodnotě ${totalPrice.toLocaleString('cs-CZ')} Kč. Najdete ji ke stažení v klientské zóně.`,
    ctaLabel: 'Zobrazit nabídku',
    ctaPath: '/portal/nabidky',
  });

  revalidatePath('/portal/admin/nabidky');
  revalidatePath(`/portal/admin/crm/klient/${parsed.client_id}`);
  return { ok: true, quoteId, pdfPath };
}

export async function regenerateQuotePdf(quoteId: string): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  const check = await checkRealViewer();
  if (!check.ok) return { ok: false, error: check.error };
  const role = await getViewerRole();
  if (role !== 'admin' && role !== 'obchodnik') return { ok: false, error: 'Nemáte oprávnění.' };

  const admin = createAdminClient();
  const { data: qRow } = await untyped(admin).from('quotes').select('*').eq('id', quoteId).single();
  if (!qRow) return { ok: false, error: 'Nabídka nenalezena.' };
  const q = qRow as Record<string, unknown>;

  // Ownership (admin client bypassuje RLS → guard v kódu): obchodník jen svého klienta.
  if (role !== 'admin' && !(await clientAssignedTo(q['client_id'] as string, check.viewer.id))) {
    return { ok: false, error: 'Tento klient vám není přiřazen.' };
  }

  const [{ data: clientRow }, dodavatel] = await Promise.all([
    untyped(admin)
      .from('profiles')
      .select('id, full_name, email, phone, company, ico, dic, street, city, representative_name')
      .eq('id', q['client_id'] as string)
      .single(),
    getDodavatel(),
  ]);

  const customer: QuoteCustomer = {
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

  const doc: QuoteDoc = {
    quoteNumber: q['quote_number'] as string,
    title: q['title'] as string,
    introText: (q['intro_text'] as string | null) ?? null,
    items: (q['items'] as QuoteItem[]) ?? [],
    totalPrice: Number(q['total_price'] ?? 0),
    currency: (q['currency'] as string) ?? 'CZK',
    validUntil: q['valid_until'] as string,
    paymentTerms: (q['payment_terms'] as string) ?? '50 % záloha při akceptaci, 50 % po předání díla',
    deadlineDays: Number(q['deadline_days'] ?? 14),
  };

  try {
    const pdf = await renderNabidkaPdf({ doc, customer, dodavatel });
    const up = await uploadDocument({
      clientId: q['client_id'] as string,
      projectId: (q['project_id'] as string | null) ?? null,
      type: 'nabidka',
      filename: `${doc.quoteNumber}.pdf`,
      contentType: 'application/pdf',
      body: pdf,
      title: `${doc.title} (Nabídka)`,
    });
    await untyped(admin).from('quotes').update({ pdf_url: up.path }).eq('id', quoteId);
    await untyped(admin).from('documents').update({ quote_id: quoteId }).eq('id', up.documentId);
    revalidatePath('/portal/admin/nabidky');
    return { ok: true, path: up.path };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[QUOTE PDF] regenerate', msg);
    return { ok: false, error: msg };
  }
}

export async function markQuoteAccepted(quoteId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const check = await checkRealViewer();
  if (!check.ok) return { ok: false, error: check.error };
  const role = await getViewerRole();
  if (role !== 'admin' && role !== 'obchodnik') return { ok: false, error: 'Nemáte oprávnění.' };

  const supabase = await createClient();
  const { data: cur } = await untyped(supabase).from('quotes').select('status, valid_until').eq('id', quoteId).single();
  const q = cur as { status?: string; valid_until?: string } | null;
  if (!q) return { ok: false, error: 'Nabídka nenalezena.' };
  if (q.status === 'akceptovano') return { ok: false, error: 'Nabídka už je akceptovaná.' };
  if (q.status === 'zruseno' || q.status === 'expirovano') return { ok: false, error: 'Nelze akceptovat zrušenou/propadlou nabídku.' };
  if (q.valid_until && q.valid_until < new Date().toISOString().slice(0, 10)) {
    return { ok: false, error: 'Platnost nabídky vypršela — nelze ji akceptovat.' };
  }

  const { error } = await untyped(supabase)
    .from('quotes')
    .update({ status: 'akceptovano', accepted_at: new Date().toISOString().slice(0, 10) })
    .eq('id', quoteId);
  if (error) return { ok: false, error: 'Nepodařilo se označit jako akceptováno.' };
  revalidatePath('/portal/admin/nabidky');
  return { ok: true };
}

/**
 * Převede akceptovanou/aktivní nabídku na smlouvu o dílo (předvyplní z položek)
 * a propojí je (quotes.contract_id). Šetří ruční přepisování.
 */
export async function convertQuoteToContract(
  quoteId: string,
): Promise<{ ok: true; contractId: string } | { ok: false; error: string }> {
  const check = await checkRealViewer();
  if (!check.ok) return { ok: false, error: check.error };
  const role = await getViewerRole();
  if (role !== 'admin' && role !== 'obchodnik') return { ok: false, error: 'Nemáte oprávnění.' };

  const admin = createAdminClient();
  const { data: qRow } = await untyped(admin)
    .from('quotes')
    .select('client_id, project_id, title, intro_text, items, total_price, status, contract_id')
    .eq('id', quoteId)
    .single();
  const q = qRow as {
    client_id?: string;
    project_id?: string | null;
    title?: string;
    intro_text?: string | null;
    items?: Array<{ label?: string }>;
    total_price?: number;
    status?: string;
    contract_id?: string | null;
  } | null;
  if (!q || !q.client_id) return { ok: false, error: 'Nabídka nenalezena.' };
  if (q.contract_id) return { ok: false, error: 'Z této nabídky už byla vytvořena smlouva.' };
  if (q.status === 'zruseno' || q.status === 'expirovano') return { ok: false, error: 'Nelze převést zrušenou/propadlou nabídku.' };
  if (role !== 'admin' && !(await clientAssignedTo(q.client_id, check.viewer.id))) {
    return { ok: false, error: 'Tento klient vám není přiřazen.' };
  }

  const bullets = (q.items ?? []).map((it) => it.label).filter((l): l is string => !!l && l.length >= 2).join('\n');
  const fd = new FormData();
  fd.set('client_id', q.client_id);
  if (q.project_id) fd.set('project_id', q.project_id);
  fd.set('title', q.title ?? 'Smlouva o dílo');
  fd.set('subject', q.intro_text && q.intro_text.length >= 5 ? q.intro_text : `Zhotovení díla dle nabídky ${q.title ?? ''}`.trim());
  if (bullets) fd.set('scope_bullets', bullets);
  fd.set('total_price', String(q.total_price ?? 0));

  const res = await createContract(fd);
  if (!res.ok) return { ok: false, error: `Smlouvu se nepodařilo vytvořit: ${res.error}` };

  // Propojení jen pokud je contract_id stále null (nepřepiš při souběhu — ochrana
  // před osiřením prvního propojení; UI navíc blokuje tlačítko během odeslání).
  await untyped(admin)
    .from('quotes')
    .update({
      contract_id: res.contractId,
      status: q.status === 'koncept' || q.status === 'poslano' ? 'akceptovano' : q.status,
      accepted_at: new Date().toISOString().slice(0, 10),
    })
    .eq('id', quoteId)
    .is('contract_id', null);

  revalidatePath('/portal/admin/nabidky');
  revalidatePath('/portal/admin/smlouvy');
  return { ok: true, contractId: res.contractId };
}

export async function cancelQuote(quoteId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const check = await checkRealViewer();
  if (!check.ok) return { ok: false, error: check.error };
  const role = await getViewerRole();
  if (role !== 'admin' && role !== 'obchodnik') return { ok: false, error: 'Nemáte oprávnění.' };

  const supabase = await createClient();
  if (role !== 'admin') {
    const { data: c } = await untyped(supabase).from('quotes').select('client_id').eq('id', quoteId).single();
    const cid = (c as { client_id?: string } | null)?.client_id;
    if (!cid || !(await clientAssignedTo(cid, check.viewer.id))) {
      return { ok: false, error: 'Tento klient vám není přiřazen.' };
    }
  }
  const { error } = await untyped(supabase).from('quotes').update({ status: 'zruseno' }).eq('id', quoteId);
  if (error) return { ok: false, error: 'Nepodařilo se zrušit.' };
  revalidatePath('/portal/admin/nabidky');
  return { ok: true };
}
