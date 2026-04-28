'use client';

import { useTransition } from 'react';
import { updateLeadSourceTag } from '@/lib/actions/leads';

export const SOURCE_TAG_VALUES = [
  'meta_ads',
  'google_ads',
  'cold_call',
  'email_outreach',
  'linkedin',
  'doporuceni',
  'organic',
  'imported_db',
  'jine',
] as const;

export type SourceTag = (typeof SOURCE_TAG_VALUES)[number];

const META: Record<SourceTag, { label: string; bg: string; text: string; ring: string }> = {
  meta_ads: { label: 'Meta Ads', bg: 'bg-caramel/20', text: 'text-caramel', ring: 'ring-caramel/30' },
  google_ads: { label: 'Google Ads', bg: 'bg-parchment-gold/20', text: 'text-parchment-gold', ring: 'ring-parchment-gold/30' },
  cold_call: { label: 'Cold call', bg: 'bg-olive/20', text: 'text-olive', ring: 'ring-olive/30' },
  email_outreach: { label: 'Email', bg: 'bg-sepia/20', text: 'text-sepia', ring: 'ring-sepia/30' },
  linkedin: { label: 'LinkedIn', bg: 'bg-moonlight/10', text: 'text-moonlight', ring: 'ring-moonlight/30' },
  doporuceni: { label: 'Doporučení', bg: 'bg-caramel-light/20', text: 'text-caramel-light', ring: 'ring-caramel-light/30' },
  organic: { label: 'Organic', bg: 'bg-tobacco/40', text: 'text-sandstone', ring: 'ring-sandstone/30' },
  imported_db: { label: 'DB import', bg: 'bg-rust/20', text: 'text-rust', ring: 'ring-rust/30' },
  jine: { label: 'Jiné', bg: 'bg-coffee', text: 'text-sandstone', ring: 'ring-sandstone/20' },
};

export function tagLabel(tag: string | null): string {
  if (!tag) return 'Neznámý';
  return META[tag as SourceTag]?.label ?? tag;
}

export default function SourceTagBadge({
  tag,
  leadId,
  editable = false,
}: {
  tag: string | null;
  leadId?: string;
  editable?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const meta = tag ? META[tag as SourceTag] : null;

  if (!editable || !leadId) {
    if (!meta) {
      return (
        <span className="inline-flex items-center px-2 py-1 font-mono text-[10px] uppercase tracking-widest bg-coffee text-sandstone/60 ring-1 ring-sandstone/20">
          —
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center px-2 py-1 font-mono text-[10px] uppercase tracking-widest ${meta.bg} ${meta.text} ring-1 ${meta.ring}`}>
        {meta.label}
      </span>
    );
  }

  return (
    <select
      disabled={pending}
      value={tag ?? ''}
      onChange={(e) => {
        const next = e.target.value as SourceTag | '';
        if (!next) return;
        startTransition(() => {
          void updateLeadSourceTag(leadId, next);
        });
      }}
      className={`inline-flex items-center px-2 py-1 font-mono text-[10px] uppercase tracking-widest border-0 cursor-pointer disabled:opacity-50 ${
        meta ? `${meta.bg} ${meta.text}` : 'bg-coffee text-sandstone/60'
      } focus:outline-none focus:ring-1 focus:ring-caramel`}
    >
      <option value="" disabled>
        — vyberte —
      </option>
      {SOURCE_TAG_VALUES.map((v) => (
        <option key={v} value={v}>
          {META[v].label}
        </option>
      ))}
    </select>
  );
}
