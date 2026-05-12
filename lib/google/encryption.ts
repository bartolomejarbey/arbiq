import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Validuje, že env var GOOGLE_OAUTH_ENCRYPTION_KEY je 32 bytes base64.
 * Hází throw při startupu pokud key chybí.
 */
export function validateEncryptionKey(key: string): void {
  if (!key || key.length === 0) {
    throw new Error('GOOGLE_OAUTH_ENCRYPTION_KEY missing');
  }
  let decoded: Buffer;
  try {
    decoded = Buffer.from(key, 'base64');
  } catch {
    throw new Error('GOOGLE_OAUTH_ENCRYPTION_KEY is not valid base64');
  }
  if (decoded.length !== 32) {
    throw new Error(
      `GOOGLE_OAUTH_ENCRYPTION_KEY must decode to 32 bytes (got ${decoded.length})`,
    );
  }
}

let cachedKey: string | undefined;
function getEncryptionKey(): string {
  if (cachedKey) return cachedKey;
  const key = process.env.GOOGLE_OAUTH_ENCRYPTION_KEY ?? '';
  validateEncryptionKey(key);
  cachedKey = key;
  return key;
}

/**
 * Šifruje refresh token přes pgcrypto helper v Postgresu (extensions.pgp_sym_encrypt).
 * Klíč se předává jako argument — RPC nesdílejí transaction.
 */
export async function encryptToken(plainText: string): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('encrypt_with_key', {
    token: plainText,
    key: getEncryptionKey(),
  });
  if (error) throw error;
  return data as string;
}

export async function decryptToken(encrypted: string): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('decrypt_with_key', {
    encrypted,
    key: getEncryptionKey(),
  });
  if (error) throw error;
  return data as string;
}
