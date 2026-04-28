/**
 * Inferuje source_tag z utm_source / kampan podle stejné logiky jako migrace 0003.
 * Drží se v sync s SQL backfill, aby nově vznikající leady dostaly stejný tag,
 * jaký by jim přiřadil backfill nad starými daty.
 */
export type SourceTagInferInput = {
  utmSource?: string | null;
  kampan?: string | null;
  /** Když víme, že lead vznikl ručním importem (úkol 4B), přepíše heuristiku. */
  forceTag?: 'imported_db' | 'cold_call' | 'email_outreach' | 'linkedin' | 'doporuceni';
};

export function inferSourceTag(input: SourceTagInferInput): string {
  if (input.forceTag) return input.forceTag;

  const utm = (input.utmSource ?? '').toLowerCase();
  if (utm.includes('meta') || utm.includes('facebook') || utm.includes('instagram')) return 'meta_ads';
  if (utm.includes('google') || utm.includes('adwords')) return 'google_ads';
  if (utm.includes('linkedin')) return 'linkedin';

  // Lead z landing page (kampan vyplněna) bez utm = pravděpodobně Meta Ads.
  if (input.kampan && input.kampan.length > 0) return 'meta_ads';

  return 'organic';
}
