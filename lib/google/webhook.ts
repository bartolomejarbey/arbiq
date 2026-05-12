import 'server-only';

import crypto from 'node:crypto';

function secret(): string {
  const s = process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? '';
  if (!s) throw new Error('GOOGLE_OAUTH_CLIENT_SECRET missing');
  return s;
}

/**
 * HMAC-SHA256(userId) hex digest. Posíláme do Google jako `token` u events.watch.
 * Google při pingu pošle zpět v X-Goog-Channel-Token headeru.
 */
export function signChannelToken(userId: string): string {
  return crypto.createHmac('sha256', secret()).update(userId).digest('hex');
}

export function verifyChannelToken(token: string, userId: string): boolean {
  const expected = signChannelToken(userId);
  if (token.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}
