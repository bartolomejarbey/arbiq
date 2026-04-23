'use client';

import { Eye, X } from 'lucide-react';
import { useTransition } from 'react';
import { exitPreview } from '@/lib/actions/preview';

export default function PreviewBanner() {
  const [pending, startTransition] = useTransition();

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
          Náhled portálu — bez přihlášení, data prázdná
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
