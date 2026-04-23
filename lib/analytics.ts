'use client';

/**
 * Thin analytics façade. Today: no-op until the user chooses a provider
 * (Plausible, GA4, …) and updates this file. Cookie consent is checked
 * via localStorage so we never fire before the visitor opts in.
 */

const STORAGE_KEY = 'arbiq-consent';

type Categories = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

function consent(): Categories | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { categories?: Categories };
    return parsed.categories ?? null;
  } catch {
    return null;
  }
}

export function hasAnalyticsConsent(): boolean {
  return consent()?.analytics === true;
}

export function hasMarketingConsent(): boolean {
  return consent()?.marketing === true;
}

export function trackEvent(name: string, props?: Record<string, string | number | boolean>): void {
  if (!hasAnalyticsConsent()) return;
  // Plug in Plausible, GA4, or similar here.
  // Example:
  //   if (typeof window.plausible === 'function') window.plausible(name, { props });
  if (process.env.NODE_ENV === 'development') {
    console.debug('[analytics]', name, props);
  }
}

export function trackPageview(path?: string): void {
  if (!hasAnalyticsConsent()) return;
  // Same hook point — most analytics auto-detect pageviews via SPA hooks.
  if (process.env.NODE_ENV === 'development') {
    console.debug('[analytics] pageview', path ?? window.location.pathname);
  }
}
