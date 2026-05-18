import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Cast tightly typed Database client to a generic client for tables/columns
 * added in migration 0007 (contracts, invoices.kind, documents.client_id, …)
 * that nejsou ještě v lib/types/database.ts.
 *
 * Po spuštění `supabase gen types --linked > lib/types/database.ts` lze tento
 * helper z volání odstranit a používat plně typovaný client.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function untyped<T>(c: T): SupabaseClient<any, any, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return c as unknown as SupabaseClient<any, any, any>;
}
