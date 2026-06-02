'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { untyped } from '@/lib/supabase/untyped';
import { getViewer } from '@/lib/supabase/viewer';

export async function markRecommendationInterested(recId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc('mark_recommendation_interested', { rec_id: recId });
  if (error) throw new Error(error.message);
  revalidatePath('/portal/doporuceni');
  revalidatePath('/portal/dashboard');
}

export async function dismissRecommendation(recId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc('dismiss_recommendation', { rec_id: recId });
  if (error) throw new Error(error.message);
  revalidatePath('/portal/doporuceni');
  revalidatePath('/portal/dashboard');
}

/**
 * Marks recommendations as 'zobrazena' the first time the klient sees them.
 * Run from /portal/doporuceni page server-side, before render.
 */
export async function markRecommendationsAsViewed(recIds: string[]) {
  if (recIds.length === 0) return;
  // RLS write policy na recommendations je admin-only → klientův přímý update
  // tiše selže. Použij service-role SCOPOVANÝ na vlastní doporučení klienta.
  const viewer = await getViewer();
  if (!viewer || viewer.isPreview) return;
  const admin = createAdminClient();
  await untyped(admin)
    .from('recommendations')
    .update({ status: 'zobrazena' })
    .in('id', recIds)
    .eq('client_id', viewer.id)
    .eq('status', 'nova');
}
