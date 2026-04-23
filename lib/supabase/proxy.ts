import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/lib/types/database';

/**
 * Refresh the Supabase session for the incoming request and return the
 * authenticated user (or null), plus the response with refreshed cookies.
 *
 * Called from the root `proxy.ts` (Next.js 16's renamed middleware).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Critical: getUser() forces token refresh / verification.
  // Without this call, sessions silently expire.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, supabase, user };
}
