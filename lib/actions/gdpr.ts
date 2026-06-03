'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { untyped } from '@/lib/supabase/untyped';
import { checkRealViewer, getViewerRole } from '@/lib/supabase/viewer';
import { logAdminAction } from '@/lib/audit';

/**
 * GDPR erasure (čl. 17) s výjimkou zákonné archivace. Profil zůstává (kvůli FK
 * na faktury/smlouvy s 10letou archivační povinností), ale osobní údaje se
 * vymažou/nahradí. Faktury/smlouvy zůstávají (zákonný titul), zobrazí se s
 * anonymizovaným jménem. Korespondence a CRM poznámky se scrubnou.
 */
export async function anonymizeClient(
  clientId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const check = await checkRealViewer();
  if (!check.ok) return { ok: false, error: check.error };
  if ((await getViewerRole()) !== 'admin') return { ok: false, error: 'Jen admin smí anonymizovat klienta.' };
  if (clientId === check.viewer.id) return { ok: false, error: 'Nelze anonymizovat vlastní účet.' };

  const admin = createAdminClient();
  const anonEmail = `anon+${clientId}@arbiq.invalid`;

  const { error: pErr } = await untyped(admin)
    .from('profiles')
    .update({
      full_name: 'Anonymizovaný klient',
      email: anonEmail,
      phone: null,
      company: null,
      ico: null,
      dic: null,
      street: null,
      city: null,
      website_url: null,
      avatar_url: null,
      representative_name: null,
      billing_email: null,
      contract_email: null,
      is_active: false,
    })
    .eq('id', clientId);
  if (pErr) return { ok: false, error: `Profil: ${pErr.message}` };

  // Auth identita + odhlášení.
  await admin.auth.admin.updateUserById(clientId, { email: anonEmail }).catch(() => undefined);
  await admin.auth.admin.signOut(clientId, 'global').catch(() => undefined);

  // Scrub PII v korespondenci a CRM záznamech.
  await untyped(admin).from('client_emails')
    .update({ from_email: null, to_email: null, subject: '[anonymizováno]', body: '[anonymizováno]' })
    .eq('client_id', clientId);
  await untyped(admin).from('crm_notes').update({ content: '[anonymizováno]' }).eq('client_id', clientId);
  await untyped(admin).from('crm_contacts').update({ note: '[anonymizováno]' }).eq('client_id', clientId);
  await untyped(admin).from('crm_tasks').update({ title: '[anonymizováno]', description: '[anonymizováno]' }).eq('client_id', clientId);
  // Metadata dokumentů (názvy mohou nést jméno). Soubory faktur/smluv ve storage
  // ZŮSTÁVAJÍ z titulu zákonné archivační povinnosti (10 let) — obsahují daňové doklady.
  await untyped(admin).from('documents').update({ title: '[anonymizováno]', name: '[anonymizováno]' }).eq('client_id', clientId);
  // Zdrojový lead, ze kterého klient vznikl (PII přežívala výmaz).
  await untyped(admin).from('landing_leads')
    .update({ name: '[anonymizováno]', email: '[anonymizováno]', phone: null, popis: '[anonymizováno]', website_url: null })
    .eq('converted_to_client', clientId);

  await logAdminAction({ actorId: check.viewer.id, action: 'client.anonymize', targetId: clientId, targetType: 'profile' });
  revalidatePath(`/portal/crm/klient/${clientId}`);
  revalidatePath('/portal/crm/klienti');
  return { ok: true };
}
