'use client';

import { useTransition } from 'react';
import { CheckCircle2, AlertTriangle, Circle, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cs } from 'date-fns/locale';
import type { CalendarConnectionStatus } from '@/lib/google/types';

const labelClass = 'font-mono text-[10px] uppercase tracking-widest text-sandstone';

export default function SettingsClient({
  status,
  flashOk,
  flashError,
}: {
  status: CalendarConnectionStatus;
  flashOk: boolean;
  flashError: string | null;
}) {
  const [pending, startTransition] = useTransition();

  function handleConnect() {
    window.location.href = '/api/google/oauth/start';
  }

  function handleDisconnect() {
    if (
      !confirm(
        'Opravdu odpojit Google Calendar? Existující eventy v ARBIQ zůstanou, ale dále se nebudou synchronizovat.',
      )
    )
      return;
    startTransition(async () => {
      const res = await fetch('/api/google/oauth/disconnect', { method: 'POST' });
      if (res.ok) window.location.reload();
    });
  }

  return (
    <div className="max-w-2xl space-y-8">
      {flashOk && (
        <div className="bg-olive/15 border-l-4 border-olive p-4">
          <p className="font-mono text-xs text-olive uppercase tracking-widest">
            Připojeno k Google Calendar.
          </p>
        </div>
      )}
      {flashError && (
        <div className="bg-rust/15 border-l-4 border-rust p-4">
          <p className="font-mono text-xs text-rust uppercase tracking-widest">
            Chyba: {flashError}
          </p>
        </div>
      )}

      <section className="bg-coffee border border-tobacco p-6 space-y-4">
        <div className="flex items-center gap-3">
          {status.state === 'connected' && <CheckCircle2 className="text-olive" size={20} />}
          {status.state === 'error' && <AlertTriangle className="text-rust" size={20} />}
          {status.state === 'revoked' && <AlertTriangle className="text-caramel" size={20} />}
          {status.state === 'not_connected' && <Circle className="text-sandstone" size={20} />}
          <h3 className="font-display italic text-xl text-moonlight">
            {status.state === 'connected' && 'Připojeno'}
            {status.state === 'error' && 'Chyba synchronizace'}
            {status.state === 'revoked' && 'Token zrušen'}
            {status.state === 'not_connected' && 'Není připojeno'}
          </h3>
        </div>

        {status.state !== 'not_connected' && (
          <div className="space-y-1 pl-8">
            <p className={labelClass}>Google účet</p>
            <p className="text-moonlight font-mono text-sm">{status.email}</p>
          </div>
        )}

        {status.state === 'connected' && (
          <div className="space-y-1 pl-8">
            <p className={labelClass}>Poslední synchronizace</p>
            <p className="text-sepia text-sm">
              {status.lastSyncAt
                ? formatDistanceToNow(new Date(status.lastSyncAt), {
                    addSuffix: true,
                    locale: cs,
                  })
                : 'zatím neproběhla'}
            </p>
          </div>
        )}

        {status.state === 'error' && (
          <div className="space-y-1 pl-8">
            <p className={labelClass}>Detail chyby</p>
            <p className="text-rust text-sm font-mono">{status.error}</p>
          </div>
        )}

        <div className="pt-4 flex items-center gap-3">
          {status.state === 'not_connected' && (
            <button
              onClick={handleConnect}
              className="inline-flex items-center gap-2 bg-caramel text-espresso px-5 py-2.5 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light"
            >
              Připojit Google Calendar <ExternalLink size={14} />
            </button>
          )}
          {(status.state === 'connected' ||
            status.state === 'error' ||
            status.state === 'revoked') && (
            <>
              <button
                onClick={handleConnect}
                className="border border-caramel text-caramel px-5 py-2.5 font-mono text-xs uppercase tracking-widest hover:bg-caramel/10"
              >
                Připojit znovu
              </button>
              <button
                onClick={handleDisconnect}
                disabled={pending}
                className="border border-rust/50 text-rust px-5 py-2.5 font-mono text-xs uppercase tracking-widest hover:bg-rust/10 disabled:opacity-50"
              >
                {pending ? 'Odpojuji…' : 'Odpojit'}
              </button>
            </>
          )}
        </div>
      </section>

      <section className="text-xs text-sepia/70 space-y-2 pl-1">
        <p>
          • Synchronizace probíhá obousměrně: změny v ARBIQ se promítnou do Google a naopak.
        </p>
        <p>
          • Synchronizujeme <strong>jen primární Google kalendář</strong>. Osobní eventy
          se zobrazí v ARBIQ jako &bdquo;soukromé&ldquo; bez detailu.
        </p>
        <p>
          • Sdílené eventy se ostatním obchodníkům doručí přes Google attendees (bez
          e-mailových pozvánek).
        </p>
      </section>
    </div>
  );
}
