'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

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
  const supabase = await createClient();
  await supabase
    .from('recommendations')
    .update({ status: 'zobrazena' })
    .in('id', recIds)
    .eq('status', 'nova');
}
