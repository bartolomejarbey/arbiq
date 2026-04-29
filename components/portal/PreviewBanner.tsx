'use client';

import { Eye, X } from 'lucide-react';
import { useEffect, useTransition } from 'react';
import { exitPreview } from '@/lib/actions/preview';

declare global {
  interface Window {
    SHERLOCK?: boolean;
  }
}

export default function PreviewBanner() {
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.SHERLOCK) return;
    window.SHERLOCK = true;
    // Easter egg pro vývojáře co otevřou DevTools
    const logo = `
%c    ___    ____  ____  _____ ____
%c   /   |  / __ \\/ __ )/  _/ __ \\
%c  / /| | / /_/ / __  |/ // / / /
%c / ___ |/ _, _/ /_/ // // /_/ /
%c/_/  |_/_/ |_/_____/___/\\___\\_\\
`;
    /* eslint-disable no-console */
    console.log(logo,
      'color: #C9986A; font-family: monospace;',
      'color: #C9986A; font-family: monospace;',
      'color: #C9986A; font-family: monospace;',
      'color: #C9986A; font-family: monospace;',
      'color: #C9986A; font-family: monospace;',
    );
    console.log('%c🔍 Vítejte ve vyšetřovací místnosti, Watsone.',
      'color: #D8DDE5; font-size: 14px; font-family: monospace; font-weight: bold;');
    console.log('%cPokud vidíte tuto zprávu, něco hledáte. Najdete nás na info@arbey.cz.',
      'color: #8B7B65; font-family: monospace;');
    console.log('%c→ Kódujete? Hledáme Senior Next.js. Pošlete nám CV.',
      'color: #C9986A; font-family: monospace;');
    /* eslint-enable no-console */
  }, []);

  function handleExit() {
    startTransition(async () => {
      await exitPreview();
    });
  }

  return (
    <div className="bg-rust/15 border-b border-rust/40 px-6 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <Eye size={16} className="text-rust shrink-0" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-rust truncate">
          Náhled portálu — fiktivní detektivní agentura (Sherlock & spol.). Pro vlastní data si požádejte o invite.
        </span>
      </div>
      <button
        type="button"
        onClick={handleExit}
        disabled={pending}
        className="inline-flex items-center gap-1.5 text-rust hover:text-moonlight font-mono text-[10px] uppercase tracking-widest transition-colors disabled:opacity-50 shrink-0"
      >
        <X size={12} />
        {pending ? 'Odcházím…' : 'Ukončit náhled'}
      </button>
    </div>
  );
}
