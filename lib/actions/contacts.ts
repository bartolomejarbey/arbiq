'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const ContactSchema = z.object({
  client_id: z.string().uuid(),
  type: z.enum(['telefon', 'email', 'schuzka', 'zprava', 'jine']),
  note: z.string().min(1).max(4000),
  next_followup: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function addCrmContact(formData: FormData): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Nepřihlášený uživatel.' };

  let parsed: z.infer<typeof ContactSchema>;
  try {
    parsed = ContactSchema.parse({
      client_id: String(formData.get('client_id') ?? ''),
      type: String(formData.get('type') ?? '') as z.infer<typeof ContactSchema>['type'],
      note: String(formData.get('note') ?? ''),
      next_followup: String(formData.get('next_followup') ?? '') || undefined,
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof z.ZodError ? err.issues.map((i) => i.message).join(', ') : 'Neplatná data.',
    };
  }

  const { error } = await supabase.from('crm_contacts').insert({
    client_id: parsed.client_id,
    obchodnik_id: user.id,
    type: parsed.type,
    note: parsed.note,
    next_followup: parsed.next_followup ?? null,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/portal/crm/klient/${parsed.client_id}`);
  return { ok: true };
}
