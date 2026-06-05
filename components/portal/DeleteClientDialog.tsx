'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Trash2, Archive, X, AlertTriangle } from 'lucide-react';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteClient } from '@/lib/actions/users';

export default function DeleteClientDialog({
  clientId,
  clientName,
  redirectAfter,
  compact = false,
}: {
  clientId: string;
  clientName: string;
  /** Kam přesměrovat po úspěchu (např. zpět na seznam z detailu). */
  redirectAfter?: string;
  /** Jen ikona (do řádku stromu). */
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function run(mode: 'archive' | 'hard') {
    setError(null);
    if (mode === 'hard' && !confirm(`Opravdu NEVRATNĚ smazat klienta „${clientName}“? Tuto akci nelze vzít zpět.`)) return;
    startTransition(async () => {
      const res = await deleteClient(clientId, mode);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOpen(false);
      if (redirectAfter) router.push(redirectAfter);
      else router.refresh();
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        {compact ? (
          <button className="text-sandstone hover:text-rust p-1" aria-label={`Smazat ${clientName}`} title="Smazat / archivovat">
            <Trash2 size={14} />
          </button>
        ) : (
          <button className="inline-flex items-center gap-2 border border-rust/50 text-rust px-4 py-2 font-mono text-[11px] uppercase tracking-widest hover:bg-rust/10">
            <Trash2 size={14} /> Smazat
          </button>
        )}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-espresso/80 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-coffee z-50" aria-describedby={undefined}>
          <div className="px-6 py-5 border-b border-tobacco flex items-start justify-between gap-4">
            <Dialog.Title className="font-display italic font-black text-xl text-moonlight">
              Smazat klienta
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-sandstone hover:text-moonlight" aria-label="Zavřít"><X size={20} /></button>
            </Dialog.Close>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-sepia text-sm">
              Klient <strong className="text-moonlight">{clientName}</strong>. Vyber, jak postupovat:
            </p>

            <button
              onClick={() => run('archive')}
              disabled={pending}
              className="w-full text-left bg-espresso border border-tobacco hover:border-caramel p-4 flex items-start gap-3 disabled:opacity-50"
            >
              <Archive size={18} className="text-caramel shrink-0 mt-0.5" />
              <div>
                <div className="text-moonlight text-sm">Archivovat <span className="text-olive font-mono text-[10px] uppercase">doporučeno</span></div>
                <div className="text-sandstone text-xs">Skryje klienta ze seznamů, data (faktury, smlouvy) zůstanou. Lze obnovit.</div>
              </div>
            </button>

            <button
              onClick={() => run('hard')}
              disabled={pending}
              className="w-full text-left bg-espresso border border-rust/40 hover:border-rust p-4 flex items-start gap-3 disabled:opacity-50"
            >
              <AlertTriangle size={18} className="text-rust shrink-0 mt-0.5" />
              <div>
                <div className="text-moonlight text-sm">Tvrdě smazat</div>
                <div className="text-sandstone text-xs">Nevratně smaže klienta i účet. Funguje jen pokud nemá žádné doklady.</div>
              </div>
            </button>

            {error && <p className="text-rust text-sm font-mono border border-rust/40 bg-rust/10 px-3 py-2">{error}</p>}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
