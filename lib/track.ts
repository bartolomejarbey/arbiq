'use client';

const VISITOR_KEY = 'arbiq_anon_id';
const SESSION_KEY = 'arbiq_session_id';
const SESSION_TS = 'arbiq_session_ts';
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 min idle window

function rand(): string {
  return Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
}

function getVisitorId(): string {
  if (typeof window === 'undefined') return 'srv';
  let id = window.localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = 'a-' + rand();
    window.localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

function getSessionId(): string {
  if (typeof window === 'undefined') return 'srv';
  const now = Date.now();
  const ts = Number(window.sessionStorage.getItem(SESSION_TS) || 0);
  let id = window.sessionStorage.getItem(SESSION_KEY);
  if (!id || now - ts > SESSION_TTL_MS) {
    id = 's-' + rand();
    window.sessionStorage.setItem(SESSION_KEY, id);
  }
  window.sessionStorage.setItem(SESSION_TS, String(now));
  return id;
}

function getUtm(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const sp = new URLSearchParams(window.location.search);
    const u: Record<string, string> = {};
    for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
      const v = sp.get(k);
      if (v) u[k] = v.slice(0, 100);
    }
    return u;
  } catch {
    return {};
  }
}

export function track(event: string, props: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined') return;
  // Respekt cookie consent — pokud uživatel odmítl analytics, neodesíláme.
  try {
    const raw = window.localStorage.getItem('arbiq-consent');
    if (raw) {
      const parsed = JSON.parse(raw) as { categories?: { analytics?: boolean } };
      if (parsed?.categories?.analytics === false) return;
    }
  } catch {}

  const payload = {
    visitor_id: getVisitorId(),
    session_id: getSessionId(),
    event: event.slice(0, 60),
    page: window.location.pathname.slice(0, 200),
    referrer: document.referrer ? document.referrer.slice(0, 300) : null,
    utm: getUtm(),
    props: props ?? {},
  };

  try {
    const body = JSON.stringify(payload);
    if ('sendBeacon' in navigator) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon('/api/track', blob);
    } else {
      void fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => undefined);
    }
  } catch {
    // best-effort
  }
}

export function trackPageView(path?: string): void {
  track('pageview', { path: path ?? (typeof window !== 'undefined' ? window.location.pathname : '/') });
}
