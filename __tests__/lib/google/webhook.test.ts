import { describe, it, expect, beforeEach } from 'vitest';
import { signChannelToken, verifyChannelToken } from '@/lib/google/webhook';

beforeEach(() => {
  process.env.GOOGLE_OAUTH_CLIENT_SECRET = 'test-secret';
});

describe('channel token HMAC', () => {
  it('round-trip: sign + verify returns true', () => {
    const token = signChannelToken('user-abc');
    expect(verifyChannelToken(token, 'user-abc')).toBe(true);
  });

  it('verify fails for wrong user', () => {
    const token = signChannelToken('user-abc');
    expect(verifyChannelToken(token, 'user-xyz')).toBe(false);
  });

  it('verify fails for tampered token', () => {
    const token = signChannelToken('user-abc');
    expect(verifyChannelToken(token.slice(0, -2) + 'xx', 'user-abc')).toBe(false);
  });
});
