import 'server-only';

import crypto from 'node:crypto';
import { google } from 'googleapis';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
];

const STATE_TTL_MS = 5 * 60 * 1000;

function stateSecret(): string {
  const s = process.env.GOOGLE_OAUTH_STATE_SECRET ?? process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? '';
  if (!s) throw new Error('GOOGLE_OAUTH_STATE_SECRET (or CLIENT_SECRET) missing');
  return s;
}

export function signStateToken(userId: string, nowMs = Date.now()): string {
  const nonce = crypto.randomBytes(8).toString('hex');
  const payload = `${userId}.${nowMs}.${nonce}`;
  const hmac = crypto.createHmac('sha256', stateSecret()).update(payload).digest('hex');
  return Buffer.from(`${payload}.${hmac}`).toString('base64url');
}

export function parseStateToken(state: string): { userId: string; ts: number } {
  let decoded: string;
  try {
    decoded = Buffer.from(state, 'base64url').toString('utf8');
  } catch {
    throw new Error('Invalid state token (base64)');
  }
  const parts = decoded.split('.');
  if (parts.length !== 4) throw new Error('Invalid state token (format)');
  const [userId, tsStr, nonce, hmac] = parts;
  const expected = crypto
    .createHmac('sha256', stateSecret())
    .update(`${userId}.${tsStr}.${nonce}`)
    .digest('hex');
  const hmacBuf = Buffer.from(hmac);
  const expectedBuf = Buffer.from(expected);
  if (hmacBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(hmacBuf, expectedBuf)) {
    throw new Error('Invalid state token (HMAC mismatch)');
  }
  const ts = parseInt(tsStr, 10);
  if (Number.isNaN(ts)) throw new Error('Invalid state token (timestamp)');
  if (Date.now() - ts > STATE_TTL_MS) throw new Error('State token expired');
  return { userId, ts };
}

export function buildAuthUrl(userId: string): string {
  const state = signStateToken(userId);
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
    redirect_uri: `${process.env.APP_URL}/api/google/oauth/callback`,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES.join(' '),
    state,
    include_granted_scopes: 'true',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID!,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
    `${process.env.APP_URL}/api/google/oauth/callback`,
  );
}

export async function exchangeCodeForTokens(code: string) {
  const client = createOAuth2Client();
  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token) {
    throw new Error('No refresh_token returned — user must re-grant access (prompt=consent)');
  }
  return {
    refreshToken: tokens.refresh_token,
    accessToken: tokens.access_token!,
    expiresAt: new Date(tokens.expiry_date!),
  };
}

export async function fetchUserEmail(accessToken: string): Promise<string> {
  const client = createOAuth2Client();
  client.setCredentials({ access_token: accessToken });
  const oauth2 = google.oauth2({ version: 'v2', auth: client });
  const me = await oauth2.userinfo.get();
  if (!me.data.email) throw new Error('Google userinfo did not return email');
  return me.data.email;
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresAt: Date;
}> {
  const client = createOAuth2Client();
  client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await client.refreshAccessToken();
  return {
    accessToken: credentials.access_token!,
    expiresAt: new Date(credentials.expiry_date!),
  };
}
