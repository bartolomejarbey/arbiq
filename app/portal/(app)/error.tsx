'use client';

import { useEffect } from 'react';
import { RotateCcw } from 'lucide-react';

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[PORTAL ERROR]', error);
  }, [error]);

  return (
    <div className="px-4 md:px-8 py-20 text-center">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-rust mb-3">Chyba</div>
      <h2 className="font-display italic font-black text-3xl text-moonlight mb-3">Něco se pokazilo</h2>
      <p className="text-sandstone text-sm max-w-md mx-auto mb-8">
        Tuto stránku se nepodařilo načíst. Zkuste to prosím znovu — pokud problém přetrvává,
        napište nám na <span className="text-caramel">info@arbiq.cz</span>.
      </p>
      <button
        onClick={() => reset()}
        className="inline-flex items-center gap-2 bg-caramel text-espresso px-5 py-2.5 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all"
      >
        <RotateCcw size={14} /> Zkusit znovu
      </button>
    </div>
  );
}
