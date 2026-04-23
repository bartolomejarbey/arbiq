import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';

const PREVIEW_COOKIE = 'arbiq_preview';

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Login page is public; skip session refresh entirely to avoid any
  // cookie-set side effects while unauthenticated.
  if (pathname === '/portal/login') {
    return NextResponse.next({ request });
  }

  // Preview mode — admin can browse the portal without logging in.
  // Cookie is set by the "Vstoupit do náhledu" button on the login page.
  // In preview mode the layout uses a hardcoded admin profile; pages render
  // with empty data because Supabase queries against the placeholder UUID
  // find nothing.
  if (request.cookies.get(PREVIEW_COOKIE)?.value === '1') {
    if (pathname === '/portal' || pathname === '/portal/') {
      return NextResponse.redirect(new URL('/portal/dashboard', request.url));
    }
    return NextResponse.next({ request });
  }

  const { response, supabase, user } = await updateSession(request);

  if (!user) {
    const loginUrl = new URL('/portal/login', request.url);
    loginUrl.searchParams.set('next', pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // Resolve role from profiles for role-based gating.
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.is_active) {
    // Stale or deactivated account — sign out + bounce to login with notice.
    await supabase.auth.signOut();
    const loginUrl = new URL('/portal/login', request.url);
    loginUrl.searchParams.set('error', 'Účet je deaktivován.');
    return NextResponse.redirect(loginUrl);
  }

  const role = profile.role as 'klient' | 'obchodnik' | 'admin';

  if (role === 'klient' && (pathname.startsWith('/portal/crm') || pathname.startsWith('/portal/admin'))) {
    return NextResponse.redirect(new URL('/portal/dashboard', request.url));
  }

  if (role === 'obchodnik' && pathname.startsWith('/portal/admin')) {
    return NextResponse.redirect(new URL('/portal/crm/dashboard', request.url));
  }

  // Bare /portal -> role-appropriate landing
  if (pathname === '/portal' || pathname === '/portal/') {
    const landing =
      role === 'klient' ? '/portal/dashboard' : role === 'obchodnik' ? '/portal/crm/dashboard' : '/portal/admin/statistiky';
    return NextResponse.redirect(new URL(landing, request.url));
  }

  return response;
}

export const config = {
  matcher: ['/portal/:path*'],
};
