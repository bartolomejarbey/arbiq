'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { untyped } from '@/lib/supabase/untyped';
import { sendEmail } from '@/lib/email/send';
import { logClientEmail } from '@/lib/email/correspondence';
import { logAdminAction } from '@/lib/audit';
import { clientAssignedTo } from '@/lib/actions/ownership';
import { PortalInviteEmail } from '@/lib/email/templates/portal-invite';

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Nepřihlášený uživatel.');

  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = (data as { role?: string } | null)?.role;
  if (role !== 'admin') throw new Error('Jen admin.');
  return { supabase, user };
}

const CreateUserSchema = z.object({
  full_name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  role: z.enum(['klient', 'obchodnik', 'admin']),
  phone: z.string().trim().max(40).optional().default(''),
  company: z.string().trim().max(160).optional().default(''),
  ico: z.string().trim().max(20).optional().default(''),
  dic: z.string().trim().max(20).optional().default(''),
  street: z.string().trim().max(200).optional().default(''),
  city: z.string().trim().max(200).optional().default(''),
  assigned_obchodnik: z.string().uuid().optional(),
  parent_client_id: z.string().uuid().optional(),
  send_invite: z.boolean().default(true),
  create_initial_project: z.boolean().default(false),
  initial_project_name: z.string().trim().max(160).optional().default(''),
  initial_project_description: z.string().trim().max(4000).optional().default(''),
});

export type UserActionResult = { ok: true; userId: string; projectId?: string } | { ok: false; error: string };

export async function createPortalUser(formData: FormData): Promise<UserActionResult> {
  let createCaller: { user: { id: string } };
  try {
    createCaller = await requireAdmin();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Nemáte oprávnění.' };
  }

  let parsed: z.infer<typeof CreateUserSchema>;
  try {
    parsed = CreateUserSchema.parse({
      full_name: String(formData.get('full_name') ?? ''),
      email: String(formData.get('email') ?? ''),
      role: String(formData.get('role') ?? 'klient') as z.infer<typeof CreateUserSchema>['role'],
      phone: String(formData.get('phone') ?? ''),
      company: String(formData.get('company') ?? ''),
      ico: String(formData.get('ico') ?? ''),
      dic: String(formData.get('dic') ?? ''),
      street: String(formData.get('street') ?? ''),
      city: String(formData.get('city') ?? ''),
      assigned_obchodnik: String(formData.get('assigned_obchodnik') ?? '') || undefined,
      parent_client_id: String(formData.get('parent_client_id') ?? '') || undefined,
      send_invite: formData.get('send_invite') === 'on' || formData.get('send_invite') === 'true',
      create_initial_project: formData.get('create_initial_project') === 'on' || formData.get('create_initial_project') === 'true',
      initial_project_name: String(formData.get('initial_project_name') ?? ''),
      initial_project_description: String(formData.get('initial_project_description') ?? ''),
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof z.ZodError ? err.issues.map((i) => i.message).join(', ') : 'Neplatná data.',
    };
  }

  // Pokud klient + initial project, jméno projektu je povinné.
  if (parsed.create_initial_project && parsed.role === 'klient' && !parsed.initial_project_name) {
    return { ok: false, error: 'Pro vytvoření projektu zadejte jeho název.' };
  }

  const admin = createAdminClient();
  const password = generatePassword();

  const { data: created, error } = await admin.auth.admin.createUser({
    email: parsed.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: parsed.full_name, role: parsed.role },
  });
  if (error || !created?.user) {
    return { ok: false, error: error?.message ?? 'Nepodařilo se vytvořit uživatele.' };
  }
  const newUserId = created.user.id;

  const obchodnikForClient = parsed.role === 'klient' ? parsed.assigned_obchodnik ?? null : null;
  const parentClientId = parsed.role === 'klient' ? parsed.parent_client_id ?? null : null;

  await admin
    .from('profiles')
    .update({
      full_name: parsed.full_name,
      role: parsed.role,
      phone: parsed.phone || null,
      company: parsed.company || null,
      ico: parsed.ico || null,
      dic: parsed.dic || null,
      street: parsed.street || null,
      city: parsed.city || null,
      assigned_obchodnik: obchodnikForClient,
      parent_client_id: parentClientId,
    })
    .eq('id', newUserId);

  let projectId: string | undefined;
  if (parsed.create_initial_project && parsed.role === 'klient') {
    const { data: project, error: projErr } = await admin
      .from('projects')
      .insert({
        client_id: newUserId,
        obchodnik_id: obchodnikForClient,
        name: parsed.initial_project_name,
        description: parsed.initial_project_description || null,
        status: 'novy',
        progress: 0,
      })
      .select('id')
      .single();

    if (projErr || !project) {
      // Rollback auth user.
      await admin.auth.admin.deleteUser(newUserId).catch(() => undefined);
      return { ok: false, error: projErr?.message ?? 'Nepodařilo se vytvořit projekt.' };
    }
    projectId = (project as { id: string }).id;
  }

  if (parsed.send_invite && process.env.RESEND_API_KEY) {
    const appUrl = process.env.APP_URL;
    if (!appUrl || appUrl.startsWith('http://localhost')) {
      console.error('createUser: APP_URL chybí nebo localhost — invite email vynechán');
    } else {
    const loginUrl = `${appUrl}/portal/login`;
    await sendEmail({
      to: parsed.email,
      subject: 'Přístup do ARBIQ portálu',
      replyTo: process.env.RESEND_REPLY_TO,
      body: PortalInviteEmail({ name: parsed.full_name, email: parsed.email, password, loginUrl }),
    }).catch((e) => console.error('portal-invite email failed', e));
    }
  }

  await logAdminAction({ actorId: createCaller.user.id, action: 'user.create', targetId: newUserId, targetType: 'profile', detail: { role: parsed.role } });
  revalidatePath('/portal/admin/uzivatele');
  revalidatePath('/portal/crm/klienti');
  revalidatePath('/portal/crm/dashboard');
  return { ok: true, userId: newUserId, projectId };
}

const UpdateClientSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional().default(''),
  company: z.string().trim().max(160).optional().default(''),
  ico: z.string().trim().max(20).optional().default(''),
  dic: z.string().trim().max(20).optional().default(''),
  street: z.string().trim().max(200).optional().default(''),
  city: z.string().trim().max(200).optional().default(''),
  assigned_obchodnik: z.union([z.string().uuid(), z.literal('')]).optional(),
  parent_client_id: z.union([z.string().uuid(), z.literal('')]).optional(),
});

/**
 * Úprava existujícího klienta adminem: jméno, e-mail (vč. auth), telefon,
 * firma (nepovinná), IČO/DIČ, adresa, přiřazený obchodník a parent firma
 * (model „jedna osoba = víc firem"). Admin-only.
 */
export async function updateClientProfile(
  clientId: string,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  let caller: { user: { id: string } };
  try {
    caller = await requireAdmin();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Nemáte oprávnění.' };
  }

  let parsed: z.infer<typeof UpdateClientSchema>;
  try {
    parsed = UpdateClientSchema.parse({
      full_name: String(formData.get('full_name') ?? ''),
      email: String(formData.get('email') ?? ''),
      phone: String(formData.get('phone') ?? ''),
      company: String(formData.get('company') ?? ''),
      ico: String(formData.get('ico') ?? ''),
      dic: String(formData.get('dic') ?? ''),
      street: String(formData.get('street') ?? ''),
      city: String(formData.get('city') ?? ''),
      assigned_obchodnik: String(formData.get('assigned_obchodnik') ?? ''),
      parent_client_id: String(formData.get('parent_client_id') ?? ''),
    });
  } catch (err) {
    return { ok: false, error: err instanceof z.ZodError ? err.issues.map((i) => i.message).join(', ') : 'Neplatná data.' };
  }

  const parentId = parsed.parent_client_id || null;
  if (parentId === clientId) {
    return { ok: false, error: 'Klient nemůže patřit sám pod sebe.' };
  }

  const admin = createAdminClient();
  const { data: current } = await admin.from('profiles').select('email, role').eq('id', clientId).single();
  const cur = current as { email?: string | null; role?: string } | null;
  if (!cur) return { ok: false, error: 'Klient nenalezen.' };

  // Zabraň dvouúrovňovému řetězení (parent musí být top-level osoba).
  if (parentId) {
    const { data: parent } = await admin.from('profiles').select('parent_client_id').eq('id', parentId).single();
    if ((parent as { parent_client_id?: string | null } | null)?.parent_client_id) {
      return { ok: false, error: 'Vybraná firma sama patří pod jiného klienta — zvolte hlavní osobu.' };
    }
  }

  // Změna e-mailu → nejdřív v auth (kvůli unikátnosti), pak v profilu.
  if (cur.email && parsed.email.toLowerCase() !== cur.email.toLowerCase()) {
    const { error: authErr } = await admin.auth.admin.updateUserById(clientId, { email: parsed.email, email_confirm: true });
    if (authErr) return { ok: false, error: `Změna e-mailu selhala: ${authErr.message}` };
  }

  const { error } = await admin
    .from('profiles')
    .update({
      full_name: parsed.full_name,
      email: parsed.email,
      phone: parsed.phone || null,
      company: parsed.company || null,
      ico: parsed.ico || null,
      dic: parsed.dic || null,
      street: parsed.street || null,
      city: parsed.city || null,
      assigned_obchodnik: parsed.assigned_obchodnik || null,
      parent_client_id: parentId,
    })
    .eq('id', clientId);
  if (error) return { ok: false, error: error.message };

  await logAdminAction({ actorId: caller.user.id, action: 'client.update', targetId: clientId, targetType: 'profile' });
  revalidatePath(`/portal/crm/klient/${clientId}`);
  revalidatePath('/portal/crm/klienti');
  revalidatePath('/portal/admin/uzivatele');
  return { ok: true };
}

export async function setUserActive(
  userId: string,
  isActive: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  let caller: { user: { id: string } };
  try {
    caller = await requireAdmin();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Nemáte oprávnění.' };
  }

  // Self-lockout guard: nelze deaktivovat sám sebe ani posledního aktivního admina.
  if (!isActive) {
    if (userId === caller.user.id) {
      return { ok: false, error: 'Nemůžete deaktivovat sami sebe.' };
    }
    const admin0 = createAdminClient();
    const { data: target } = await admin0.from('profiles').select('role').eq('id', userId).single();
    if ((target as { role?: string } | null)?.role === 'admin') {
      const { count } = await admin0
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'admin')
        .eq('is_active', true);
      if ((count ?? 0) <= 1) {
        return { ok: false, error: 'Nelze deaktivovat posledního aktivního admina.' };
      }
    }
  }

  const admin = createAdminClient();
  const { error } = await admin.from('profiles').update({ is_active: isActive }).eq('id', userId);
  if (error) return { ok: false, error: error.message };
  if (!isActive) {
    await admin.auth.admin.signOut(userId, 'global').catch(() => undefined);
  }
  await logAdminAction({
    actorId: caller.user.id,
    action: isActive ? 'user.activate' : 'user.deactivate',
    targetId: userId,
    targetType: 'profile',
  });
  revalidatePath('/portal/admin/uzivatele');
  return { ok: true };
}

export async function resetUserPassword(userId: string): Promise<{ ok: true; password: string } | { ok: false; error: string }> {
  let caller: { user: { id: string } };
  try {
    caller = await requireAdmin();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Nemáte oprávnění.' };
  }
  const admin = createAdminClient();
  const password = generatePassword();
  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) return { ok: false, error: error.message };
  await logAdminAction({ actorId: caller.user.id, action: 'user.reset_password', targetId: userId, targetType: 'profile' });
  return { ok: true, password };
}

/**
 * "Pozvat do zóny": vygeneruje nové heslo a pošle klientovi uvítací e-mail
 * s přihlašovacími údaji (PortalInviteEmail). Použij když klient invite nikdy
 * nedostal nebo ho potřebuje znovu.
 */
export async function inviteClientToZone(
  userId: string,
): Promise<{ ok: true; sentTo: string } | { ok: false; error: string }> {
  let inviteCaller: { user: { id: string } };
  try {
    inviteCaller = await requireAdmin();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Nemáte oprávnění.' };
  }
  if (!process.env.RESEND_API_KEY) {
    return { ok: false, error: 'E-mailová služba není nakonfigurovaná (RESEND_API_KEY).' };
  }
  const appUrl = process.env.APP_URL;
  if (!appUrl || appUrl.startsWith('http://localhost')) {
    return { ok: false, error: 'APP_URL není nastavené — pozvánku nelze poslat (vznikl by localhost odkaz).' };
  }

  const admin = createAdminClient();
  const { data: prof } = await admin
    .from('profiles')
    .select('email, full_name')
    .eq('id', userId)
    .single();
  const p = prof as { email?: string | null; full_name?: string | null } | null;
  if (!p?.email) return { ok: false, error: 'Uživatel nemá vyplněný e-mail.' };

  const password = generatePassword();
  const { error: pwErr } = await admin.auth.admin.updateUserById(userId, { password });
  if (pwErr) return { ok: false, error: `Nepodařilo se nastavit heslo: ${pwErr.message}` };

  // Ujisti se, že je účet aktivní (jinak by proxy login odmítla).
  await admin.from('profiles').update({ is_active: true }).eq('id', userId);

  try {
    await sendEmail({
      to: p.email,
      subject: 'Přístup do ARBIQ portálu',
      replyTo: process.env.RESEND_REPLY_TO,
      body: PortalInviteEmail({
        name: p.full_name ?? 'kliente',
        email: p.email,
        password,
        loginUrl: `${appUrl}/portal/login`,
      }),
    });
  } catch (err) {
    console.error('inviteClientToZone email failed', err);
    return { ok: false, error: 'E-mail s pozvánkou se nepodařilo odeslat.' };
  }

  // Zaloguj do korespondence (BEZ hesla v těle).
  void logClientEmail({
    clientId: userId,
    direction: 'outbound',
    fromEmail: process.env.RESEND_FROM ?? 'noreply@arbiq.cz',
    toEmail: p.email,
    subject: 'Přístup do ARBIQ portálu',
    body: 'Byly Vám zaslány přihlašovací údaje do klientské zóny ARBIQ (e-mail s heslem).',
  });

  await logAdminAction({ actorId: inviteCaller.user.id, action: 'user.invite_to_zone', targetId: userId, targetType: 'profile' });
  revalidatePath('/portal/admin/uzivatele');
  return { ok: true, sentTo: p.email };
}

export async function setAssignedObchodnik(
  clientId: string,
  obchodnikId: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  let assignCaller: { user: { id: string } };
  try {
    assignCaller = await requireAdmin();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Nemáte oprávnění.' };
  }
  const admin = createAdminClient();
  const { error } = await admin
    .from('profiles')
    .update({ assigned_obchodnik: obchodnikId })
    .eq('id', clientId);
  if (error) return { ok: false, error: error.message };
  await logAdminAction({ actorId: assignCaller.user.id, action: 'client.reassign', targetId: clientId, targetType: 'profile', detail: { obchodnik_id: obchodnikId } });
  revalidatePath('/portal/admin/uzivatele');
  revalidatePath(`/portal/crm/klient/${clientId}`);
  return { ok: true };
}

const ClientEmailsSchema = z.object({
  billing_email: z.union([z.string().trim().email().max(200), z.literal('')]).transform((v) => v || null),
  contract_email: z.union([z.string().trim().email().max(200), z.literal('')]).transform((v) => v || null),
});

/**
 * Nastaví fakturační a smluvní e-mail klienta (oddělené od hlavního kontaktu).
 * Použije se jako default při odeslání faktury/smlouvy. Admin i obchodník.
 */
export async function updateClientEmails(
  clientId: string,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Nepřihlášený uživatel.' };
  const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = (prof as { role?: string } | null)?.role;
  if (role !== 'admin' && role !== 'obchodnik') return { ok: false, error: 'Nemáte oprávnění.' };
  if (role !== 'admin' && !(await clientAssignedTo(clientId, user.id))) {
    return { ok: false, error: 'Tento klient vám není přiřazen.' };
  }

  let parsed: { billing_email: string | null; contract_email: string | null };
  try {
    parsed = ClientEmailsSchema.parse({
      billing_email: String(formData.get('billing_email') ?? '').trim(),
      contract_email: String(formData.get('contract_email') ?? '').trim(),
    });
  } catch (err) {
    return { ok: false, error: err instanceof z.ZodError ? err.issues.map((i) => i.message).join(', ') : 'Neplatný e-mail.' };
  }

  const admin = createAdminClient();
  const { error } = await untyped(admin)
    .from('profiles')
    .update({ billing_email: parsed.billing_email, contract_email: parsed.contract_email })
    .eq('id', clientId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/portal/crm/klient/${clientId}`);
  return { ok: true };
}

/**
 * "Smazání" klienta s volbou režimu:
 *  - 'archive': soft delete (profiles.archived_at) — data zůstanou, lze obnovit.
 *  - 'hard': tvrdé smazání i auth účtu, JEN pokud klient nemá žádné doklady
 *    (faktury/smlouvy/nabídky/projekty); jinak vrátí chybu a doporučí archiv.
 * Admin only. Firmy klienta se při hard delete smažou kaskádou (FK on delete cascade).
 */
export async function deleteClient(
  clientId: string,
  mode: 'archive' | 'hard',
): Promise<{ ok: true; mode: 'archive' | 'hard' } | { ok: false; error: string }> {
  let caller: { user: { id: string } };
  try {
    caller = await requireAdmin();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Nemáte oprávnění.' };
  }
  if (clientId === caller.user.id) {
    return { ok: false, error: 'Nemůžete smazat sami sebe.' };
  }

  const admin = createAdminClient();

  if (mode === 'archive') {
    const { error } = await untyped(admin)
      .from('profiles')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', clientId);
    if (error) return { ok: false, error: error.message };
    await admin.auth.admin.signOut(clientId, 'global').catch(() => undefined);
    await logAdminAction({ actorId: caller.user.id, action: 'client.archive', targetId: clientId, targetType: 'profile' });
    revalidatePath('/portal/crm/klienti');
    revalidatePath(`/portal/crm/klient/${clientId}`);
    return { ok: true, mode };
  }

  // hard delete — pojistka na doklady (DB navíc blokuje on delete restrict u invoices/projects)
  for (const table of ['invoices', 'contracts', 'quotes', 'projects'] as const) {
    const { count } = await untyped(admin).from(table).select('id', { count: 'exact', head: true }).eq('client_id', clientId);
    if ((count ?? 0) > 0) {
      return {
        ok: false,
        error: `Klient má navázané doklady (${table}) — tvrdé smazání není možné. Použij archivaci.`,
      };
    }
  }

  const { error } = await admin.auth.admin.deleteUser(clientId);
  if (error) return { ok: false, error: `Smazání selhalo: ${error.message}` };
  await logAdminAction({ actorId: caller.user.id, action: 'client.delete', targetId: clientId, targetType: 'profile' });
  revalidatePath('/portal/crm/klienti');
  return { ok: true, mode };
}

/** Obnoví archivovaného klienta (archived_at = null). Admin only. */
export async function restoreClient(clientId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  let caller: { user: { id: string } };
  try {
    caller = await requireAdmin();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Nemáte oprávnění.' };
  }
  const admin = createAdminClient();
  const { error } = await untyped(admin).from('profiles').update({ archived_at: null }).eq('id', clientId);
  if (error) return { ok: false, error: error.message };
  await logAdminAction({ actorId: caller.user.id, action: 'client.restore', targetId: clientId, targetType: 'profile' });
  revalidatePath('/portal/crm/klienti');
  revalidatePath(`/portal/crm/klient/${clientId}`);
  return { ok: true };
}

function generatePassword(length = 14): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  let pw = '';
  for (let i = 0; i < length; i++) pw += alphabet[arr[i] % alphabet.length];
  return pw;
}
