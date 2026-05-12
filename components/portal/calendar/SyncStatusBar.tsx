'use client';

import { formatDistanceToNow } from 'date-fns';
import { cs } from 'date-fns/locale';

type Connection = {
  google_user_email?: string | null;
  last_sync_at?: string | null;
  status?: string | null;
  last_error?: string | null;
};

export default function SyncStatusBar({
  connection,
  eventCount,
}: {
  connection: unknown | null;
  eventCount: number;
}) {
  const labelClass = 'font-mono text-[9px] uppercase tracking-widest';
  const conn = connection as Connection | null;

  if (!conn) {
    return (
      <div className="bg-espresso border-t border-tobacco px-6 py-2 flex items-center justify-between">
        <span className={`${labelClass} text-sandstone`}>
          ● Google Calendar není připojen —{' '}
          <a
            href="/portal/nastaveni/kalendar"
            className="text-caramel hover:text-caramel-light"
          >
            připojit
          </a>
        </span>
        <span className={`${labelClass} text-sandstone`}>{eventCount} eventů</span>
      </div>
    );
  }

  let stateColor = 'text-olive';
  let stateText = 'OK';
  if (conn.status === 'error') {
    stateColor = 'text-rust';
    stateText = 'CHYBA';
  } else if (conn.status === 'revoked') {
    stateColor = 'text-caramel';
    stateText = 'TOKEN ZRUŠEN';
  }

  return (
    <div className="bg-espresso border-t border-tobacco px-6 py-2 flex items-center justify-between">
      <span className={`${labelClass} ${stateColor}`}>
        ● Google sync · {stateText}
        {conn.last_sync_at && (
          <span className="text-sandstone ml-2">
            · poslední pull{' '}
            {formatDistanceToNow(new Date(conn.last_sync_at), {
              addSuffix: true,
              locale: cs,
            })}
          </span>
        )}
      </span>
      <span className={`${labelClass} text-sandstone`}>{eventCount} eventů</span>
    </div>
  );
}
