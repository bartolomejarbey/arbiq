import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/types/database';

/**
 * Supabase client for Server Components, Server Actions, and Route Handlers.
 * Reads + writes the session cookie via Next.js 16's async `cookies()`.
 *
 * In a pure Server Component (where cookie writes are forbidden), the
 * setAll() write attempt throws — we swallow it. The session refresh still
 * happens on the next request that goes through proxy.ts.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — proxy.ts will refresh instead.
          }
        },
      },
    },
  );
}
