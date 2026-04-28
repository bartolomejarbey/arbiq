'use client';

import { useState, useTransition, useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import StatusBadge from './StatusBadge';
import SourceTagBadge, { SOURCE_TAG_VALUES, tagLabel } from './SourceTagBadge';
import { formatDateShort } from '@/lib/formatters';
import { kampanData, type KampanKey } from '@/lib/kampan-data';
import { assignLeadToMe, discardLead } from '@/lib/actions/leads';
import LeadDetailDrawer from './LeadDetailDrawer';

export type LeadRow = {
  id: string;
  created_at: string;
  case_number: string | null;
  kampan: string;
  obor: string | null;
  velikost_firmy: string | null;
  step3_odpoved: string | null;
  name: string;
  email: string;
  phone: string | null;
  website_url: string | null;
  popis: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  status: string;
  source_tag: string | null;
  assigned_to: string | null;
  notes: string | null;
};

export default function LeadTable({
  leads,
  showActions = true,
}: {
  leads: LeadRow[];
  showActions?: boolean;
}) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [kampanFilter, setKampanFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [selected, setSelected] = useState<LeadRow | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return leads.filter((l) =>
      (statusFilter === 'all' || l.status === statusFilter) &&
      (kampanFilter === 'all' || l.kampan === kampanFilter) &&
      (tagFilter === 'all' || (l.source_tag ?? '') === tagFilter),
    );
  }, [leads, statusFilter, kampanFilter, tagFilter]);

  const allKampans = Array.from(new Set(leads.map((l) => l.kampan)));

  const handleAssign = (id: string) => startTransition(() => { void assignLeadToMe(id); });
  const handleDiscard = (id: string) => startTransition(() => { void discardLead(id); });

  return (
    <>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter}
          options={[
            { value: 'all', label: 'Všechny' },
            { value: 'new', label: 'Nový' },
            { value: 'contacted', label: 'Kontaktován' },
            { value: 'qualified', label: 'Kvalifikován' },
            { value: 'unqualified', label: 'Nekvalifikován' },
            { value: 'converted', label: 'Konvertován' },
            { value: 'lost', label: 'Ztracen' },
          ]}
        />
        <FilterSelect label="Kampaň" value={kampanFilter} onChange={setKampanFilter}
          options={[
            { value: 'all', label: 'Všechny' },
            ...allKampans.map((k) => ({
              value: k,
              label: kampanData[k as KampanKey]?.headline ? k : k,
            })),
          ]}
        />
        <FilterSelect label="Zdroj" value={tagFilter} onChange={setTagFilter}
          options={[
            { value: 'all', label: 'Všechny' },
            ...SOURCE_TAG_VALUES.map((v) => ({ value: v, label: tagLabel(v) })),
          ]}
        />
        <span className="ml-auto text-sandstone text-xs font-mono">
          {filtered.length} / {leads.length}
        </span>
      </div>

      <div className="bg-coffee overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-tobacco">
              <Th>Datum</Th>
              <Th>Číslo</Th>
              <Th>Jméno</Th>
              <Th>E-mail</Th>
              <Th>Kampaň</Th>
              <Th>Zdroj</Th>
              <Th>Obor</Th>
              <Th>Status</Th>
              {showActions && <th className="px-4 py-3"></th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={showActions ? 9 : 8} className="text-center text-sandstone py-12">
                  Žádné leady neodpovídají filtru.
                </td>
              </tr>
            )}
            {filtered.map((l, i) => (
              <tr key={l.id} className={`border-b border-tobacco/50 hover:bg-tobacco/30 ${i % 2 === 1 ? 'bg-coffee/40' : ''}`}>
                <td className="px-4 py-3 text-sandstone whitespace-nowrap">{formatDateShort(l.created_at)}</td>
                <td className="px-4 py-3 font-mono text-caramel text-xs">{l.case_number ?? '—'}</td>
                <td className="px-4 py-3 text-moonlight">{l.name}</td>
                <td className="px-4 py-3 text-sepia">
                  <a href={`mailto:${l.email}`} className="hover:text-caramel">{l.email}</a>
                </td>
                <td className="px-4 py-3 text-sepia">{l.kampan}</td>
                <td className="px-4 py-3"><SourceTagBadge tag={l.source_tag} leadId={l.id} editable /></td>
                <td className="px-4 py-3 text-sandstone">{l.obor ?? '—'}</td>
                <td className="px-4 py-3"><StatusBadge kind="lead" value={l.status} /></td>
                {showActions && (
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {l.status === 'new' && !l.assigned_to && (
                      <button
                        onClick={() => handleAssign(l.id)}
                        disabled={pending}
                        className="text-caramel hover:text-caramel-light text-xs font-mono uppercase tracking-widest mr-3 disabled:opacity-50"
                      >
                        Vzít si
                      </button>
                    )}
                    <button
                      onClick={() => setSelected(l)}
                      className="text-sepia hover:text-moonlight inline-flex items-center"
                      aria-label="Detail leadu"
                    >
                      Detail <ChevronRight size={14} />
                    </button>
                    {l.status === 'new' && (
                      <button
                        onClick={() => handleDiscard(l.id)}
                        disabled={pending}
                        className="text-sandstone hover:text-rust text-xs font-mono uppercase tracking-widest ml-3 disabled:opacity-50"
                      >
                        Zahodit
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <LeadDetailDrawer lead={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left font-mono text-[10px] uppercase tracking-widest text-sandstone px-4 py-3">
      {children}
    </th>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="inline-flex items-center gap-2 text-xs">
      <span className="font-mono text-[10px] uppercase tracking-widest text-sandstone">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-coffee border border-tobacco px-3 py-1.5 text-sepia focus:border-caramel focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
