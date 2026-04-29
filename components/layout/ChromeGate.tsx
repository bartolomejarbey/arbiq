'use client';

import { usePathname } from 'next/navigation';

type Target = 'header' | 'footer' | 'cookies' | 'chat';

/**
 * Skryje konkrétní chrome element na vybraných cestách.
 * - /portal a /vizitka — vlastní layout, schováme všechno.
 * - /pripad/* — onboarding flow musí být focused, schováme header + footer.
 *   CookieBanner zůstává (legal), ChatWidget zůstává (může pomoci s otázkou).
 */
const RULES: Record<Target, string[]> = {
  header: ['/portal', '/vizitka', '/pripad'],
  footer: ['/portal', '/vizitka', '/pripad'],
  cookies: ['/portal', '/vizitka'],
  chat: ['/portal', '/vizitka'],
};

export default function ChromeGate({
  target = 'header',
  children,
}: {
  target?: Target;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (pathname && RULES[target].some((p) => pathname.startsWith(p))) return null;
  return <>{children}</>;
}
