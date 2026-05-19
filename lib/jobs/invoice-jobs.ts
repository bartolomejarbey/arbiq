import 'server-only';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Internal job — NOT a server action (no 'use server' directive at top of file).
 * Importováno jen z /api/cron/overdue-invoices/route.ts který je gated CRON_SECRETem.
 *
 * Musí být v samostatném souboru aby ho Next.js nevystavoval přes Server Action
 * RPC endpoint (preview visitor by jinak mohl zavolat tuto mass-mutation
 * libovolně z prohlížeče).
 */
export async function markOverdueInvoices(): Promise<{ updated: number }> {
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const { error, count } = await admin
    .from('invoices')
    .update({ status: 'po_splatnosti' }, { count: 'exact' })
    .eq('status', 'ceka')
    .lt('due_date', today);
  if (error) throw new Error(error.message);
  revalidatePath('/portal/admin/faktury');
  revalidatePath('/portal/faktury');
  return { updated: count ?? 0 };
}
