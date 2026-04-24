'use client';

import { usePathname } from 'next/navigation';

/**
 * Hides children when the current pathname matches a chrome-less route.
 * - /portal — portal/CRM/admin shell má vlastní layout
 * - /vizitka — focused mobile landing page (vCard download flow)
 */
const CHROMELESS_PREFIXES = ['/portal', '/vizitka'];

export default function ChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname && CHROMELESS_PREFIXES.some((p) => pathname.startsWith(p))) return null;
  return <>{children}</>;
}
