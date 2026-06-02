import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import { untyped } from '@/lib/supabase/untyped';

/**
 * True pokud je klient přiřazen danému obchodníkovi. Admina kontroluj zvlášť
 * (admin smí vše). Slouží jako ownership guard v server actions, které píšou
 * přes service-role admin client (RLS by je nezachytila).
 */
export async function clientAssignedTo(clientId: string, userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await untyped(admin)
    .from('profiles')
    .select('assigned_obchodnik')
    .eq('id', clientId)
    .single();
  return (data as { assigned_obchodnik?: string | null } | null)?.assigned_obchodnik === userId;
}
