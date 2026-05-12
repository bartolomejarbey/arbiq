import { describe, it, expect, beforeEach } from 'vitest';
import { buildAuthUrl, parseStateToken, signStateToken } from '@/lib/google/oauth';

beforeEach(() => {
  process.env.GOOGLE_OAUTH_CLIENT_ID = 'test-client';
  process.env.GOOGLE_OAUTH_CLIENT_SECRET = 'test-secret';
  process.env.APP_URL = 'http://localhost:3000';
  process.env.GOOGLE_OAUTH_STATE_SECRET = 'state-secret-for-tests';
});

describe('OAuth state token', () => {
  it('round-trip: sign + parse returns userId', () => {
    const signed = signStateToken('user-123');
    const result = parseStateToken(signed);
    expect(result.userId).toBe('user-123');
  });

  it('parse fails for tampered token', () => {
    const signed = signStateToken('user-123');
    const tampered = signed.slice(0, -2) + 'xx';
    expect(() => parseStateToken(tampered)).toThrow();
  });

  it('parse fails for expired token (>5min)', () => {
    const signed = signStateToken('user-123', Date.now() - 6 * 60 * 1000);
    expect(() => parseStateToken(signed)).toThrow(/expired/i);
  });
});

describe('buildAuthUrl', () => {
  it('includes required params', () => {
    const url = buildAuthUrl('user-123');
    expect(url).toContain('client_id=test-client');
    expect(url).toContain('redirect_uri=http');
    expect(url).toContain('access_type=offline');
    expect(url).toContain('prompt=consent');
    expect(url).toContain('scope=');
    expect(url).toContain('state=');
  });
});
