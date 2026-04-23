'use client';

import { useState, useTransition } from 'react';
import { Sparkles, Check, X } from 'lucide-react';
import StatusBadge from './StatusBadge';

export type RecommendationData = {
  id: string;
  service_name: string;
  description: string;
  estimated_price: string | null;
  status: string;
};

export default function RecommendationCard({
  rec,
  onInterested,
  onDismiss,
}: {
  rec: RecommendationData;
  onInterested: (id: string) => Promise<void>;
  onDismiss: (id: string) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [localStatus, setLocalStatus] = useState(rec.status);

  const actionable = localStatus === 'nova' || localStatus === 'zobrazena';

  function handle(action: 'interested' | 'dismiss') {
    setError(null);
    startTransition(async () => {
      try {
        if (action === 'interested') {
          await onInterested(rec.id);
          setLocalStatus('zajem');
        } else {
          await onDismiss(rec.id);
          setLocalStatus('odmitnuta');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Něco se pokazilo.');
      }
    });
  }

  return (
    <article className="bg-coffee p-6 relative">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-start gap-3">
          <Sparkles size={20} className="text-caramel mt-1 shrink-0" />
          <h3 className="font-display italic text-xl text-moonlight leading-tight">
            {rec.service_name}
          </h3>
        </div>
        <StatusBadge kind="recommendation" value={localStatus} />
      </div>

      <p className="text-sepia mb-4">{rec.description}</p>

      {rec.estimated_price && (
        <div className="mb-5">
          <div className="font-mono text-[10px] uppercase tracking-widest text-sandstone mb-1">
            Orientační cena
          </div>
          <div className="text-caramel font-medium">{rec.estimated_price}</div>
        </div>
      )}

      {error && <p className="text-rust text-xs font-mono mb-3">{error}</p>}

      {actionable && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handle('interested')}
            disabled={pending}
            className="inline-flex items-center gap-2 bg-caramel text-espresso px-5 py-2.5 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all disabled:opacity-50"
          >
            <Check size={14} />
            Mám zájem
          </button>
          <button
            type="button"
            onClick={() => handle('dismiss')}
            disabled={pending}
            className="inline-flex items-center gap-2 text-sandstone hover:text-sepia px-3 py-2.5 font-mono text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
          >
            <X size={14} />
            Nehodí se
          </button>
        </div>
      )}
    </article>
  );
}
