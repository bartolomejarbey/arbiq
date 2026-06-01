import 'server-only';

/**
 * Jednotné ověření cron požadavku. Vercel scheduler posílá
 * `Authorization: Bearer <CRON_SECRET>`; podporujeme i `x-cron-secret`
 * hlavičku a `?token=` v query (manuální spuštění / zpětná kompatibilita).
 */
export function isAuthorizedCron(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const url = new URL(request.url);
  const fromQuery = url.searchParams.get('token');
  const fromHeader = request.headers.get('x-cron-secret');
  const auth = request.headers.get('authorization');
  const fromBearer = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  return fromQuery === expected || fromHeader === expected || fromBearer === expected;
}
