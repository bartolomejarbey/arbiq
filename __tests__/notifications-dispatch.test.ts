import { describe, it, expect } from 'vitest';
import { resolveChannels, type ProfileFlags } from '@/lib/notifications/channels';

const full: ProfileFlags = { hasEmail: true, hasPhone: true, emailEnabled: true, smsEnabled: true };

describe('resolveChannels', () => {
  it('bez preferencí jede dle master přepínačů profilu', () => {
    expect(resolveChannels(full, null)).toEqual({ inapp: true, email: true, sms: true });
    expect(
      resolveChannels({ ...full, smsEnabled: false }, null),
    ).toEqual({ inapp: true, email: true, sms: false });
  });

  it('per-typ preference přebije master přepínač', () => {
    // master: email on, sms off; pref: email off, sms on
    const r = resolveChannels(
      { ...full, smsEnabled: false },
      { email: false, sms: true, inapp: true },
    );
    expect(r).toEqual({ inapp: true, email: false, sms: true });
  });

  it('explicitní override přebije i preferenci', () => {
    const r = resolveChannels(full, { email: true, sms: true, inapp: true }, { sms: false });
    expect(r.sms).toBe(false);
    expect(r.email).toBe(true);
  });

  it('e-mail vyžaduje vyplněný e-mail', () => {
    const r = resolveChannels({ ...full, hasEmail: false }, null);
    expect(r.email).toBe(false);
  });

  it('SMS vyžaduje vyplněný telefon', () => {
    const r = resolveChannels({ ...full, hasPhone: false }, null);
    expect(r.sms).toBe(false);
  });

  it('in-app default true, lze vypnout overridem', () => {
    expect(resolveChannels(full, null).inapp).toBe(true);
    expect(resolveChannels(full, null, { inapp: false }).inapp).toBe(false);
    expect(resolveChannels(full, { email: true, sms: false, inapp: false }).inapp).toBe(false);
  });
});
