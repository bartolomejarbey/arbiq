import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';

/**
 * Service-role client. Bypasses RLS. Server-side only.
 *
 * Use only for: creating users (auth.admin.createUser), CSV exports,
 * deleting rows, marking invoices paid by admins, and other elevated
 * operations. Never import this from a Client Component.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
