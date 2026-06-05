/**
 * Čistá (bez IO, bez server-only) logika výběru notifikačních kanálů + katalog
 * typů. Importovatelné i z client komponent (UI preferencí) i z testů.
 */

/** Katalog typů notifikací (pro UI preferencí a konzistentní `type` stringy). */
export const NOTIFICATION_TYPES: { type: string; label: string; smsDefault: boolean }[] = [
  { type: 'invoice_new', label: 'Nová faktura', smsDefault: false },
  { type: 'invoice_due', label: 'Faktura před/po splatnosti', smsDefault: true },
  { type: 'invoice_paid', label: 'Faktura zaplacena', smsDefault: false },
  { type: 'new_message', label: 'Nová zpráva v projektu', smsDefault: false },
  { type: 'deadline', label: 'Blížící se deadline', smsDefault: true },
  { type: 'contract_signed', label: 'Smlouva podepsána', smsDefault: false },
  { type: 'quote_accepted', label: 'Nabídka akceptována', smsDefault: false },
  { type: 'meeting', label: 'Připomínka schůzky', smsDefault: true },
  { type: 'system', label: 'Systémové / ostatní', smsDefault: false },
];

export type ResolvedChannels = { inapp: boolean; email: boolean; sms: boolean };

export type ProfileFlags = {
  hasEmail: boolean;
  hasPhone: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
};

export type PrefRow = { email: boolean; sms: boolean; inapp: boolean } | null;

export type ChannelOverride = { inapp?: boolean; email?: boolean; sms?: boolean } | undefined;

/**
 * Spočítá, do kterých kanálů poslat.
 * Priorita: explicitní override > per-typ preference > master přepínač profilu.
 * E-mail/SMS navíc vyžadují vyplněný kontakt (e-mail/telefon).
 */
export function resolveChannels(
  profile: ProfileFlags,
  pref: PrefRow,
  override?: ChannelOverride,
): ResolvedChannels {
  const inapp = override?.inapp ?? pref?.inapp ?? true;
  const emailWanted = override?.email ?? (pref ? pref.email : profile.emailEnabled);
  const smsWanted = override?.sms ?? (pref ? pref.sms : profile.smsEnabled);
  return {
    inapp,
    email: Boolean(emailWanted) && profile.hasEmail,
    sms: Boolean(smsWanted) && profile.hasPhone,
  };
}
