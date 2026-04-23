'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackPageView } from '@/lib/track';

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const qs = searchParams?.toString();
    const url = pathname + (qs ? `?${qs}` : '');
    if (last.current === url) return;
    last.current = url;
    trackPageView(url);
  }, [pathname, searchParams]);

  return null;
}
