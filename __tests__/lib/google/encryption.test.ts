import { describe, it, expect } from 'vitest';
import { validateEncryptionKey } from '@/lib/google/encryption';

describe('validateEncryptionKey', () => {
  it('passes for valid 32-byte base64', () => {
    const key = Buffer.alloc(32).toString('base64');
    expect(() => validateEncryptionKey(key)).not.toThrow();
  });

  it('throws for empty string', () => {
    expect(() => validateEncryptionKey('')).toThrow(/missing/i);
  });

  it('throws for < 32 bytes decoded', () => {
    const short = Buffer.alloc(16).toString('base64');
    expect(() => validateEncryptionKey(short)).toThrow(/32 bytes/i);
  });
});
