'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { untyped } from '@/lib/supabase/untyped';
import { checkRealViewer, getViewerRole } from '@/lib/supabase/viewer';
import { clientAssignedTo } from '@/lib/actions/ownership';
import { logAdminAction } from '@/lib/audit';

const optEmail = z
  .union([z.string().trim().email().max(200), z.literal('')])
  .optional()
  .transform((v) => (v ? v : null));
const optStr = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));

const FirmaSchema = z.object({
  nazev: z.string().trim().min(2, 'Název firmy je povinný.').max(200),
  ico: optStr(20),
  dic: optStr(20),
  street: optStr(200),
  city: optStr(200),
  zip: optStr(20),
  country: z.string().trim().max(60).optional().transform((v) => (v ? v : 'CZ')),
  billing_email: optEmail,
  contract_email: optEmail,
  representative_name: optStr(160),
  phone: optStr(40),
  website_url: optStr(200),
  notes: optStr(4000),
  is_primary: z.boolean().default(false),
});

type FirmaValues = z.infer<typeof FirmaSchema>;

function parseFirmaForm(formData: FormData): FirmaValues {
  return FirmaSchema.parse({
    nazev: String(formData.get('nazev') ?? ''),
    ico: String(formData.get('ico') ?? ''),
    dic: String(formData.get('dic') ?? ''),
    street: String(formData.get('street') ?? ''),
    city: String(formData.get('city') ?? ''),
    zip: String(formData.get('zip') ?? ''),
    country: String(formData.get('country') ?? ''),
    billing_email: String(formData.get('billing_email') ?? ''),
    contract_email: String(formData.get('contract_email') ?? ''),
    representative_name: String(formData.get('representative_name') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    website_url: String(formData.get('website_url') ?? ''),
    notes: String(formData.get('notes') ?? ''),
    is_primary: formData.get('is_primary') === 'on' || formData.get('is_primary') === 'true',
  });
}

/** Smí přihlášený uživatel spravovat firmy daného klienta? admin vždy, obchodník svého. */
async function assertCanManage(
  clientId: string,
): Promise<{ ok: true; viewerId: string } | { ok: false; error: string }> {
  const check = await checkRealViewer();
  if (!check.ok) return { ok: false, error: check.error };
  const role = await getViewerRole();
  if (role !== 'admin' && role !== 'obchodnik') return { ok: false, error: 'Nemáte oprávnění.' };
  if (role !== 'admin' && !(await clientAssignedTo(clientId, check.viewer.id))) {
    return { ok: false, error: 'Tento klient vám není přiřazen.' };
  }
  return { ok: true, viewerId: check.viewer.id };
}

/** Při nastavení primární firmy zruš primární příznak u ostatních firem klienta. */
async function clearOtherPrimary(
  admin: ReturnType<typeof createAdminClient>,
  clientId: string,
  exceptFirmaId?: string,
): Promise<void> {
  let q = untyped(admin).from('firmy').update({ is_primary: false }).eq('client_id', clientId).eq('is_primary', true);
  if (exceptFirmaId) q = q.neq('id', exceptFirmaId);
  await q;
}

export async function createFirma(
  clientId: string,
  formData: FormData,
): Promise<{ ok: true; firmaId: string } | { ok: false; error: string }> {
  const can = await assertCanManage(clientId);
  if (!can.ok) return can;

  let values: FirmaValues;
  try {
    values = parseFirmaForm(formData);
  } catch (err) {
    return { ok: false, error: err instanceof z.ZodError ? err.issues.map((i) => i.message).join(', ') : 'Neplatná data.' };
  }

  const admin = createAdminClient();
  // Pokud klient ještě nemá žádnou firmu, ať je tahle automaticky primární.
  const { count } = await untyped(admin)
    .from('firmy')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', clientId);
  const makePrimary = values.is_primary || (count ?? 0) === 0;
  if (makePrimary) await clearOtherPrimary(admin, clientId);

  const { data, error } = await untyped(admin)
    .from('firmy')
    .insert({ ...values, is_primary: makePrimary, client_id: clientId })
    .select('id')
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? 'Nepodařilo se vytvořit firmu.' };

  await logAdminAction({ actorId: can.viewerId, action: 'firma.create', targetId: (data as { id: string }).id, targetType: 'firma', detail: { client_id: clientId } });
  revalidatePath(`/portal/crm/klient/${clientId}`);
  revalidatePath('/portal/crm/firmy');
  return { ok: true, firmaId: (data as { id: string }).id };
}

export async function updateFirma(
  firmaId: string,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const { data: existing } = await untyped(admin).from('firmy').select('client_id').eq('id', firmaId).maybeSingle();
  const clientId = (existing as { client_id?: string } | null)?.client_id;
  if (!clientId) return { ok: false, error: 'Firma nenalezena.' };

  const can = await assertCanManage(clientId);
  if (!can.ok) return can;

  let values: FirmaValues;
  try {
    values = parseFirmaForm(formData);
  } catch (err) {
    return { ok: false, error: err instanceof z.ZodError ? err.issues.map((i) => i.message).join(', ') : 'Neplatná data.' };
  }

  if (values.is_primary) await clearOtherPrimary(admin, clientId, firmaId);
  const { error } = await untyped(admin).from('firmy').update(values).eq('id', firmaId);
  if (error) return { ok: false, error: error.message };

  await logAdminAction({ actorId: can.viewerId, action: 'firma.update', targetId: firmaId, targetType: 'firma' });
  revalidatePath(`/portal/crm/klient/${clientId}`);
  revalidatePath('/portal/crm/firmy');
  return { ok: true };
}

export async function setFirmaArchived(
  firmaId: string,
  archived: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const { data: existing } = await untyped(admin).from('firmy').select('client_id').eq('id', firmaId).maybeSingle();
  const clientId = (existing as { client_id?: string } | null)?.client_id;
  if (!clientId) return { ok: false, error: 'Firma nenalezena.' };

  const can = await assertCanManage(clientId);
  if (!can.ok) return can;

  const { error } = await untyped(admin)
    .from('firmy')
    .update({ archived_at: archived ? new Date().toISOString() : null, is_primary: archived ? false : undefined })
    .eq('id', firmaId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/portal/crm/klient/${clientId}`);
  revalidatePath('/portal/crm/firmy');
  return { ok: true };
}

/** Tvrdě smaže firmu — jen pokud na ni není navázaný žádný doklad. */
export async function deleteFirma(
  firmaId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const { data: existing } = await untyped(admin).from('firmy').select('client_id').eq('id', firmaId).maybeSingle();
  const clientId = (existing as { client_id?: string } | null)?.client_id;
  if (!clientId) return { ok: false, error: 'Firma nenalezena.' };

  const can = await assertCanManage(clientId);
  if (!can.ok) return can;

  for (const table of ['invoices', 'contracts', 'quotes', 'projects'] as const) {
    const { count } = await untyped(admin).from(table).select('id', { count: 'exact', head: true }).eq('firma_id', firmaId);
    if ((count ?? 0) > 0) {
      return { ok: false, error: `Firmu nelze smazat — má navázané doklady (${table}). Použij archivaci.` };
    }
  }

  const { error } = await untyped(admin).from('firmy').delete().eq('id', firmaId);
  if (error) return { ok: false, error: error.message };
  await logAdminAction({ actorId: can.viewerId, action: 'firma.delete', targetId: firmaId, targetType: 'firma' });
  revalidatePath(`/portal/crm/klient/${clientId}`);
  revalidatePath('/portal/crm/firmy');
  return { ok: true };
}
