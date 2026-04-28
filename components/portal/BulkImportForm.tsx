'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { bulkImportContacts, type BulkImportResult } from '@/lib/actions/databaze';

const ACCEPTED_HEADERS = [
  'full_name',
  'email',
  'phone',
  'company',
  'position',
  'ico',
  'industry',
  'source',
  'notes',
] as const;

type Row = Partial<Record<(typeof ACCEPTED_HEADERS)[number], string>>;

const HEADER_ALIASES: Record<string, (typeof ACCEPTED_HEADERS)[number]> = {
  jmeno: 'full_name',
  jméno: 'full_name',
  name: 'full_name',
  fullname: 'full_name',
  full_name: 'full_name',
  email: 'email',
  e_mail: 'email',
  telefon: 'phone',
  phone: 'phone',
  tel: 'phone',
  firma: 'company',
  company: 'company',
  pozice: 'position',
  position: 'position',
  ico: 'ico',
  ičo: 'ico',
  obor: 'industry',
  industry: 'industry',
  zdroj: 'source',
  source: 'source',
  poznamka: 'notes',
  poznámka: 'notes',
  notes: 'notes',
};

function normalizeHeader(h: string): (typeof ACCEPTED_HEADERS)[number] | null {
  const k = h.trim().toLowerCase().replace(/\s+/g, '_');
  return HEADER_ALIASES[k] ?? null;
}

export default function BulkImportForm() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [pending, startTransition] = useTransition();

  const handleFile = (file: File) => {
    setFileName(file.name);
    setRows([]);
    setParseError(null);
    setResult(null);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h,
      complete: (parsed) => {
        // Map každý header na akceptovaný klíč nebo zahodit
        const headerMap: Record<string, (typeof ACCEPTED_HEADERS)[number]> = {};
        for (const original of parsed.meta.fields ?? []) {
          const norm = normalizeHeader(original);
          if (norm) headerMap[original] = norm;
        }

        if (!Object.values(headerMap).includes('full_name')) {
          setParseError('CSV musí obsahovat sloupec "full_name" (nebo "Jméno"). Akceptované sloupce: ' + ACCEPTED_HEADERS.join(', '));
          return;
        }

        const mapped: Row[] = parsed.data.map((rawRow) => {
          const out: Row = {};
          for (const [original, normalized] of Object.entries(headerMap)) {
            const v = rawRow[original]?.trim();
            if (v) out[normalized] = v;
          }
          return out;
        }).filter((r) => r.full_name);

        setRows(mapped);
      },
      error: (err) => setParseError(err.message),
    });
  };

  const handleSubmit = () => {
    setResult(null);
    startTransition(async () => {
      try {
        const r = await bulkImportContacts(rows);
        setResult(r);
        if (r.inserted > 0 && r.errors.length === 0) {
          // Auto-redirect po úspěchu
          setTimeout(() => router.push('/portal/crm/databaze'), 1500);
        }
      } catch (e) {
        setParseError(String(e));
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-coffee border border-tobacco p-6">
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-3">
            CSV soubor
          </span>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
            className="block w-full text-sepia file:mr-4 file:px-4 file:py-2 file:bg-tobacco file:text-caramel file:font-mono file:text-xs file:uppercase file:tracking-widest file:border-0 file:hover:bg-tobacco/70 file:cursor-pointer"
          />
        </label>
        {fileName && <div className="text-sepia text-sm mt-3">Soubor: <span className="font-mono">{fileName}</span></div>}
        <div className="text-sandstone text-xs mt-4 leading-relaxed">
          <p className="mb-1"><strong className="text-sepia">Akceptované sloupce:</strong></p>
          <p className="font-mono">full_name, email, phone, company, position, ico, industry, source, notes</p>
          <p className="mt-2">Aliasy: <span className="font-mono">jmeno → full_name, telefon → phone, firma → company, ičo → ico, obor → industry, zdroj → source, poznámka → notes</span></p>
          <p className="mt-2"><strong className="text-sepia">Povinné:</strong> alespoň <code className="font-mono">full_name</code>. Bez emailu nelze později importovat jako lead.</p>
        </div>
      </div>

      {parseError && (
        <div className="bg-rust/20 border border-rust/40 p-4 text-rust text-sm">
          {parseError}
        </div>
      )}

      {rows.length > 0 && (
        <div className="bg-coffee border border-tobacco">
          <div className="px-6 py-4 border-b border-tobacco flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-widest text-sandstone">
              Náhled — {rows.length} řádků
            </span>
            <button
              onClick={handleSubmit}
              disabled={pending}
              className="bg-caramel text-espresso px-6 py-2 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-colors disabled:opacity-50"
            >
              {pending ? 'Importuji…' : `Importovat ${rows.length} kontaktů`}
            </button>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-coffee">
                <tr className="border-b border-tobacco">
                  {ACCEPTED_HEADERS.map((h) => (
                    <th key={h} className="text-left font-mono text-[10px] uppercase tracking-widest text-sandstone px-3 py-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 50).map((r, i) => (
                  <tr key={i} className={`border-b border-tobacco/40 ${i % 2 === 1 ? 'bg-coffee/40' : ''}`}>
                    {ACCEPTED_HEADERS.map((h) => (
                      <td key={h} className="px-3 py-2 text-sepia">{r[h] ?? '—'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 50 && (
              <div className="text-center text-sandstone/60 py-3 text-xs">
                … a dalších {rows.length - 50} řádků
              </div>
            )}
          </div>
        </div>
      )}

      {result && (
        <div className={`p-4 border ${result.errors.length > 0 ? 'bg-parchment-gold/10 border-parchment-gold/40' : 'bg-olive/20 border-olive/40'} text-sm`}>
          <div className="font-bold text-moonlight mb-2">Výsledek importu</div>
          <ul className="space-y-1 text-sepia">
            <li>Vloženo: <strong className="text-olive">{result.inserted}</strong></li>
            <li>Přeskočeno (duplicitní email): <strong>{result.skipped}</strong></li>
            <li>Chyby: <strong className={result.errors.length > 0 ? 'text-rust' : 'text-sepia'}>{result.errors.length}</strong></li>
          </ul>
          {result.errors.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-rust font-mono text-xs uppercase tracking-widest">Zobrazit chyby</summary>
              <ul className="mt-2 text-xs space-y-1 max-h-48 overflow-y-auto">
                {result.errors.slice(0, 100).map((e, i) => (
                  <li key={i} className="text-rust">Řádek {e.row}: {e.message}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
