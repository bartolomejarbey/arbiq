'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { notifyPortalUser } from '@/lib/email/notify';

const Schema = z.object({
  client_id: z.string().uuid(),
  service_name: z.string().min(2).max(160),
  description: z.string().min(5).max(4000),
  estimated_price: z.string().max(80).optional().default(''),
});

export type RecommendationActionResult = { ok: true } | { ok: false; error: string };

export async function createRecommendation(formData: FormData): Promise<RecommendationActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Nepřihlášený uživatel.' };

  let parsed: z.infer<typeof Schema>;
  try {
    parsed = Schema.parse({
      client_id: String(formData.get('client_id') ?? ''),
      service_name: String(formData.get('service_name') ?? ''),
      description: String(formData.get('description') ?? ''),
      estimated_price: String(formData.get('estimated_price') ?? ''),
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof z.ZodError ? err.issues.map((i) => i.message).join(', ') : 'Neplatná data.',
    };
  }

  const { error } = await supabase.from('recommendations').insert({
    client_id: parsed.client_id,
    created_by: user.id,
    service_name: parsed.service_name,
    description: parsed.description,
    estimated_price: parsed.estimated_price || null,
    status: 'nova',
  });
  if (error) return { ok: false, error: error.message };

  void notifyPortalUser({
    recipientId: parsed.client_id,
    subject: `Doporučení: ${parsed.service_name}`,
    heading: 'Máme pro Vás doporučení',
    intro: `Na základě Vašeho projektu doporučujeme: „${parsed.service_name}". Detaily najdete v portálu.`,
    ctaLabel: 'Zobrazit doporučení',
    ctaPath: '/portal/doporuceni',
  });

  revalidatePath('/portal/admin/doporuceni');
  revalidatePath(`/portal/doporuceni`);
  return { ok: true };
}
