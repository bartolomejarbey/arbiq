'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function CopyContactButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  async function handleCopy() {
    setError(false);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback pro starší Safari (iOS < 13.4) a IE
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        if (!ok) throw new Error('execCommand copy returned false');
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(true);
      setTimeout(() => setError(false), 3000);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="w-full flex items-center justify-center gap-2 border border-tobacco hover:border-caramel text-sepia hover:text-moonlight px-4 py-3 font-mono text-xs uppercase tracking-widest transition-colors"
      aria-live="polite"
    >
      {copied ? (
        <>
          <Check size={16} className="text-olive" />
          <span className="text-olive">Zkopírováno</span>
        </>
      ) : error ? (
        <span className="text-rust">Nepodařilo se zkopírovat</span>
      ) : (
        <>
          <Copy size={16} />
          <span>Zkopírovat kontakt</span>
        </>
      )}
    </button>
  );
}
