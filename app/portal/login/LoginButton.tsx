'use client';

import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';

/** Tlačítko přihlášení s loading stavem (jinak uživatel 1–2 s neví, že se něco děje). */
export default function LoginButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="w-full inline-flex items-center justify-center gap-2 bg-caramel text-espresso px-6 py-4 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all disabled:opacity-70 disabled:cursor-wait"
    >
      {pending ? (
        <>
          <Loader2 size={14} className="animate-spin" /> Přihlašuji…
        </>
      ) : (
        'Přihlásit se'
      )}
    </button>
  );
}
