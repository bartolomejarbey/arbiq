'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const ProfileSchema = z.object({
  full_name: z.string().min(2).max(120),
  phone: z.string().max(40).optional().default(''),
  company: z.string().max(160).optional().default(''),
  ico: z.string().max(20).optional().default(''),
  website_url: z.string().max(500).optional().default(''),
  email_notifications_enabled: z.boolean().default(true),
});

export type ProfileActionResult = { ok: true } | { ok: false; error: string };

export async function updateProfile(formData: FormData): Promise<ProfileActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Nepřihlášený uživatel.' };

  let parsed: z.infer<typeof ProfileSchema>;
  try {
    parsed = ProfileSchema.parse({
      full_name: String(formData.get('full_name') ?? ''),
      phone: String(formData.get('phone') ?? ''),
      company: String(formData.get('company') ?? ''),
      ico: String(formData.get('ico') ?? ''),
      website_url: String(formData.get('website_url') ?? ''),
      email_notifications_enabled: formData.get('email_notifications_enabled') === 'on',
    });
  } catch (err) {
    const message = err instanceof z.ZodError
      ? err.issues.map((i) => i.message).join(', ')
      : 'Neplatná data.';
    return { ok: false, error: message };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: parsed.full_name,
      phone: parsed.phone || null,
      company: parsed.company || null,
      ico: parsed.ico || null,
      website_url: parsed.website_url || null,
      email_notifications_enabled: parsed.email_notifications_enabled,
    })
    .eq('id', user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/portal/nastaveni');
  return { ok: true };
}

const PasswordSchema = z.object({
  password: z.string().min(8, 'Heslo musí mít alespoň 8 znaků.').max(72),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: 'Hesla se neshodují.', path: ['confirm'] });

export async function changePassword(formData: FormData): Promise<ProfileActionResult> {
  let parsed: z.infer<typeof PasswordSchema>;
  try {
    parsed = PasswordSchema.parse({
      password: String(formData.get('password') ?? ''),
      confirm: String(formData.get('confirm') ?? ''),
    });
  } catch (err) {
    const message = err instanceof z.ZodError
      ? err.issues.map((i) => i.message).join(', ')
      : 'Neplatné heslo.';
    return { ok: false, error: message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
