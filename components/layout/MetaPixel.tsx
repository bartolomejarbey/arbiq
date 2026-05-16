'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const PIXEL_ID = '1718210025769248';

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { callMethod?: unknown; queue?: unknown[] };
  }
}

function hasMarketingConsent(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = window.localStorage.getItem('arbiq-consent');
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { categories?: { marketing?: boolean } };
    return parsed?.categories?.marketing === true;
  } catch {
    return false;
  }
}

export default function MetaPixel() {
  const [enabled, setEnabled] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPath = useRef<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    setEnabled(hasMarketingConsent());
    function onConsent(e: Event) {
      const detail = (e as CustomEvent).detail as { categories?: { marketing?: boolean } } | undefined;
      setEnabled(detail?.categories?.marketing === true);
    }
    window.addEventListener('arbiq-consent', onConsent);
    return () => window.removeEventListener('arbiq-consent', onConsent);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
    const qs = searchParams?.toString();
    const url = pathname + (qs ? `?${qs}` : '');
    if (!initialized.current) {
      initialized.current = true;
      lastPath.current = url;
      return;
    }
    if (lastPath.current === url) return;
    lastPath.current = url;
    window.fbq('track', 'PageView');
  }, [enabled, pathname, searchParams]);

  if (!enabled) return null;

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${PIXEL_ID}');
fbq('track', 'PageView');
`,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          alt=""
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
