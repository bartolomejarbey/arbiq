'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'arbiq-consent';

type Categories = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

type StoredConsent = {
  categories: Categories;
  decidedAt: string;
  version: number;
};

const CURRENT_VERSION = 1;

function readConsent(): StoredConsent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredConsent;
    if (parsed.version !== CURRENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

const ANON_ID_KEY = 'arbiq_anon_id';

function getOrCreateAnonId(): string {
  if (typeof window === 'undefined') return 'srv';
  let id = window.localStorage.getItem(ANON_ID_KEY);
  if (!id) {
    id = 'a-' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
    window.localStorage.setItem(ANON_ID_KEY, id);
  }
  return id;
}

function writeConsent(categories: Categories, source: 'banner_accept_all' | 'banner_necessary' | 'banner_custom') {
  const stored: StoredConsent = {
    categories,
    decidedAt: new Date().toISOString(),
    version: CURRENT_VERSION,
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  window.dispatchEvent(new CustomEvent('arbiq-consent', { detail: stored }));

  // Best-effort log to server (GDPR audit trail). Pokud selže, neblokujeme UX.
  fetch('/api/consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      anon_id: getOrCreateAnonId(),
      necessary: categories.necessary,
      analytics: categories.analytics,
      marketing: categories.marketing,
      source,
    }),
    keepalive: true,
  }).catch(() => undefined);
}

export default function CookieBanner() {
  const [show, setShow] = useState(false);
  const [details, setDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot SSR-safe init from localStorage
    if (!readConsent()) setShow(true);
  }, []);

  if (!show) return null;

  function acceptAll() {
    writeConsent({ necessary: true, analytics: true, marketing: true }, 'banner_accept_all');
    setShow(false);
  }
  function acceptNecessary() {
    writeConsent({ necessary: true, analytics: false, marketing: false }, 'banner_necessary');
    setShow(false);
  }
  function saveCustom() {
    writeConsent({ necessary: true, analytics, marketing }, 'banner_custom');
    setShow(false);
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:right-auto md:left-6 md:bottom-6 md:max-w-md z-50 bg-coffee border border-tobacco shadow-2xl">
      <div className="p-5 space-y-4">
        <div>
          <div className="font-display italic text-moonlight text-lg leading-tight">Cookies a soukromí</div>
          <p className="text-sepia text-sm mt-2">
            Používáme cookies pro nezbytný provoz a — s Vaším souhlasem — pro analytiku a marketing.{' '}
            <a href="/manifest" className="text-caramel hover:text-caramel-light">Více</a>
          </p>
        </div>

        {details && (
          <div className="space-y-2 text-sm border-t border-tobacco pt-4">
            <label className="flex items-start gap-3 opacity-60 cursor-not-allowed">
              <input type="checkbox" checked disabled className="mt-1 w-4 h-4 accent-caramel" />
              <div>
                <div className="text-moonlight">Nezbytné</div>
                <div className="text-sandstone text-xs">Přihlášení, bezpečnost, preference. Vždy aktivní.</div>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="mt-1 w-4 h-4 accent-caramel"
              />
              <div>
                <div className="text-moonlight">Analytika</div>
                <div className="text-sandstone text-xs">Anonymní statistiky návštěvnosti, abychom věděli, co funguje.</div>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                className="mt-1 w-4 h-4 accent-caramel"
              />
              <div>
                <div className="text-moonlight">Marketing</div>
                <div className="text-sandstone text-xs">Měření reklamních kampaní (Meta, Google).</div>
              </div>
            </label>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {!details ? (
            <>
              <button onClick={acceptAll} className="bg-caramel text-espresso px-4 py-2 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all">
                Přijmout vše
              </button>
              <button onClick={acceptNecessary} className="bg-coffee border border-tobacco hover:border-caramel text-sepia px-4 py-2 font-mono text-xs uppercase tracking-widest transition-all">
                Jen nezbytné
              </button>
              <button onClick={() => setDetails(true)} className="text-sandstone hover:text-caramel text-xs font-mono uppercase tracking-widest ml-auto">
                Nastavení
              </button>
            </>
          ) : (
            <>
              <button onClick={saveCustom} className="bg-caramel text-espresso px-4 py-2 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all">
                Uložit volbu
              </button>
              <button onClick={() => setDetails(false)} className="text-sandstone hover:text-moonlight text-xs font-mono uppercase tracking-widest ml-auto">
                Zpět
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
