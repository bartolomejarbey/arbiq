'use client';

import { usePathname } from 'next/navigation';

/**
 * Hides children when the current pathname starts with /portal.
 * Used to keep public Header/Footer off the portal/CRM/admin shell.
 */
export default function ChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith('/portal')) return null;
  return <>{children}</>;
}
