import 'server-only';

import { timingSafeEqual } from 'crypto';

/** Konstantní-časové porovnání (anti timing side-channel). */
function safeEq(candidate: string | null | undefined, expected: string): boolean {
  if (!candidate) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Jednotné ověření cron požadavku. Vercel scheduler posílá
 * `Authorization: Bearer <CRON_SECRET>`; podporujeme i `x-cron-secret`
 * hlavičku a `?token=` v query (manuální spuštění / zpětná kompatibilita).
 */
export function isAuthorizedCron(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const url = new URL(request.url);
  const auth = request.headers.get('authorization');
  const fromBearer = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  return (
    safeEq(fromBearer, expected) ||
    safeEq(request.headers.get('x-cron-secret'), expected) ||
    safeEq(url.searchParams.get('token'), expected)
  );
}
