'use client';

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

export type AresResult = {
  ico: string;
  name: string | null;
  dic: string | null;
  vat_payer: boolean;
  street: string | null;
  city: string | null;
  legal_form: string | null;
};

export default function IcoLookup({
  ico,
  onResult,
  className = '',
}: {
  /** Hodnota IČO pro lookup. Předej z formuláře (sledovat state nebo z ref). */
  ico: string;
  onResult: (data: AresResult) => void;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function lookup() {
    setErr(null);
    const clean = ico.replace(/\D/g, '');
    if (!/^\d{7,8}$/.test(clean)) {
      setErr('IČO musí mít 7 nebo 8 číslic.');
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(`/api/ares/${clean}`);
      const data = await r.json();
      if (!r.ok) {
        setErr(typeof data?.error === 'string' ? data.error : 'ARES lookup selhal.');
        return;
      }
      onResult(data as AresResult);
    } catch {
      setErr('Nepodařilo se připojit k ARES.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={lookup}
        disabled={loading || !ico}
        className="inline-flex items-center gap-1.5 px-3 py-2 bg-tobacco border border-tobacco hover:border-caramel text-sepia hover:text-caramel font-mono text-[10px] uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        title="Načíst název, adresu a DIČ z ARES"
      >
        {loading ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
        ARES
      </button>
      {err && <p className="text-rust text-[10px] font-mono mt-1">{err}</p>}
    </div>
  );
}
