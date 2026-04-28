'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/send';
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
  assigned_obchodnik: z.string().uuid().optional(),
  send_invite: z.boolean().default(true),
});

export type UserActionResult = { ok: true; userId: string } | { ok: false; error: string };

export async function createPortalUser(formData: FormData): Promise<UserActionResult> {
  try {
    await requireAdmin();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Nemáte oprávnění.' };
  }

  let parsed: z.infer<typeof CreateUserSchema>;
  try {
    parsed = CreateUserSchema.parse({
      full_name: String(formData.get('full_name') ?? ''),
      email: String(formData.get('email') ?? ''),
      role: String(formData.get('role') ?? 'klient') as z.infer<typeof CreateUserSchema>['role'],
      assigned_obchodnik: String(formData.get('assigned_obchodnik') ?? '') || undefined,
      send_invite: formData.get('send_invite') === 'on',
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof z.ZodError ? err.issues.map((i) => i.message).join(', ') : 'Neplatná data.',
    };
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

  await admin
    .from('profiles')
    .update({
      full_name: parsed.full_name,
      role: parsed.role,
      assigned_obchodnik: parsed.role === 'klient' ? parsed.assigned_obchodnik ?? null : null,
    })
    .eq('id', newUserId);

  if (parsed.send_invite && process.env.RESEND_API_KEY) {
    const loginUrl = `${process.env.APP_URL ?? 'http://localhost:3000'}/portal/login`;
    await sendEmail({
      to: parsed.email,
      subject: 'Přístup do ARBIQ portálu',
      replyTo: process.env.RESEND_REPLY_TO,
      body: PortalInviteEmail({ name: parsed.full_name, email: parsed.email, password, loginUrl }),
    }).catch((e) => console.error('portal-invite email failed', e));
  }

  revalidatePath('/portal/admin/uzivatele');
  return { ok: true, userId: newUserId };
}

export async function setUserActive(userId: string, isActive: boolean) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from('profiles').update({ is_active: isActive }).eq('id', userId);
  if (!isActive) {
    // Sign them out by invalidating sessions
    await admin.auth.admin.signOut(userId, 'global').catch(() => undefined);
  }
  revalidatePath('/portal/admin/uzivatele');
}

export async function resetUserPassword(userId: string): Promise<{ ok: true; password: string } | { ok: false; error: string }> {
  try {
    await requireAdmin();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Nemáte oprávnění.' };
  }
  const admin = createAdminClient();
  const password = generatePassword();
  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) return { ok: false, error: error.message };
  return { ok: true, password };
}

export async function setAssignedObchodnik(clientId: string, obchodnikId: string | null) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from('profiles').update({ assigned_obchodnik: obchodnikId }).eq('id', clientId);
  revalidatePath('/portal/admin/uzivatele');
  revalidatePath(`/portal/crm/klient/${clientId}`);
}

function generatePassword(length = 14): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  let pw = '';
  for (let i = 0; i < length; i++) pw += alphabet[arr[i] % alphabet.length];
  return pw;
}
