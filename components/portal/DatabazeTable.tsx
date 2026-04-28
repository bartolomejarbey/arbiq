'use client';

import { useMemo, useState, useTransition } from 'react';
import { Phone, Mail, ArrowRightCircle, Trash2, X, Check, Clock } from 'lucide-react';
import { formatDateShort } from '@/lib/formatters';
import {
  setContactOutcome,
  importContactToLead,
  takeContact,
  type OutcomeValue,
} from '@/lib/actions/databaze';

export type ContactRow = {
  id: string;
  created_at: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  position: string | null;
  industry: string | null;
  source: string | null;
  notes: string | null;
  contacted: boolean;
  outcome: string | null;
  imported_to_leads: boolean;
  assigned_to: string | null;
};

const OUTCOME_LABELS: Record<string, string> = {
  nezvedl: 'Nezvedl',
  nezajem: 'Nezájem',
  zajem: 'Zájem',
  pozdeji: 'Později',
  spam: 'Spam',
  imported_to_leads: 'Importován',
};

const OUTCOME_COLOR: Record<string, string> = {
  nezvedl: 'text-sandstone',
  nezajem: 'text-rust',
  zajem: 'text-olive',
  pozdeji: 'text-parchment-gold',
  spam: 'text-rust/60',
  imported_to_leads: 'text-caramel',
};

export default function DatabazeTable({
  contacts,
  currentUserId,
}: {
  contacts: ContactRow[];
  currentUserId: string;
}) {
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('open');
  const [pending, startTransition] = useTransition();

  const allIndustries = Array.from(new Set(contacts.map((c) => c.industry).filter((i): i is string => !!i)));

  const filtered = useMemo(() => {
    return contacts.filter((c) => {
      if (industryFilter !== 'all' && c.industry !== industryFilter) return false;
      if (outcomeFilter === 'open' && (c.outcome || c.imported_to_leads)) return false;
      if (outcomeFilter !== 'open' && outcomeFilter !== 'all' && c.outcome !== outcomeFilter) return false;
      return true;
    });
  }, [contacts, industryFilter, outcomeFilter]);

  const action = (fn: () => Promise<unknown>) => startTransition(() => { void fn().catch((e) => alert(String(e))); });

  return (
    <>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <FilterSelect label="Obor" value={industryFilter} onChange={setIndustryFilter}
          options={[
            { value: 'all', label: 'Všechny' },
            ...allIndustries.map((i) => ({ value: i, label: i })),
          ]}
        />
        <FilterSelect label="Stav" value={outcomeFilter} onChange={setOutcomeFilter}
          options={[
            { value: 'open', label: 'Nekontaktováno' },
            { value: 'all', label: 'Všechny' },
            { value: 'nezvedl', label: 'Nezvedl' },
            { value: 'nezajem', label: 'Nezájem' },
            { value: 'zajem', label: 'Zájem' },
            { value: 'pozdeji', label: 'Později' },
            { value: 'spam', label: 'Spam' },
            { value: 'imported_to_leads', label: 'Importováno' },
          ]}
        />
        <span className="ml-auto text-sandstone text-xs font-mono">
          {filtered.length} / {contacts.length}
        </span>
      </div>

      {/* Desktop tabulka */}
      <div className="hidden md:block bg-coffee overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-tobacco">
              <Th>Datum</Th>
              <Th>Jméno</Th>
              <Th>Firma</Th>
              <Th>Obor</Th>
              <Th>Stav</Th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-sandstone py-12">
                  {contacts.length === 0 ? 'Databáze je prázdná. Nahrajte CSV.' : 'Žádné kontakty neodpovídají filtru.'}
                </td>
              </tr>
            )}
            {filtered.map((c, i) => (
              <tr key={c.id} className={`border-b border-tobacco/50 hover:bg-tobacco/30 ${i % 2 === 1 ? 'bg-coffee/40' : ''}`}>
                <td className="px-4 py-3 text-sandstone whitespace-nowrap">{formatDateShort(c.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="text-moonlight">{c.full_name}</div>
                  {c.position && <div className="text-sandstone text-xs">{c.position}</div>}
                </td>
                <td className="px-4 py-3 text-sepia">{c.company ?? '—'}</td>
                <td className="px-4 py-3 text-sandstone">{c.industry ?? '—'}</td>
                <td className="px-4 py-3">
                  {c.outcome ? (
                    <span className={`font-mono text-[10px] uppercase tracking-widest ${OUTCOME_COLOR[c.outcome] ?? 'text-sandstone'}`}>
                      {OUTCOME_LABELS[c.outcome] ?? c.outcome}
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] uppercase tracking-widest text-sandstone/60">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <ContactActions contact={c} currentUserId={currentUserId} pending={pending} runAction={action} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile karty */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 && (
          <div className="text-center text-sandstone py-12 bg-coffee">
            {contacts.length === 0 ? 'Databáze je prázdná. Nahrajte CSV.' : 'Žádné kontakty neodpovídají filtru.'}
          </div>
        )}
        {filtered.map((c) => (
          <div key={c.id} className="bg-coffee border-l-2 border-tobacco p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-moonlight font-medium">{c.full_name}</div>
                {c.position && <div className="text-sandstone text-xs">{c.position}</div>}
                {c.company && <div className="text-sepia text-sm">{c.company}</div>}
              </div>
              {c.outcome && (
                <span className={`font-mono text-[10px] uppercase tracking-widest ${OUTCOME_COLOR[c.outcome] ?? 'text-sandstone'}`}>
                  {OUTCOME_LABELS[c.outcome] ?? c.outcome}
                </span>
              )}
            </div>
            {c.industry && (
              <div className="text-xs text-sandstone mb-3">{c.industry}{c.source ? ` • ${c.source}` : ''}</div>
            )}
            <ContactActions contact={c} currentUserId={currentUserId} pending={pending} runAction={action} mobile />
          </div>
        ))}
      </div>
    </>
  );
}

function ContactActions({
  contact,
  currentUserId,
  pending,
  runAction,
  mobile = false,
}: {
  contact: ContactRow;
  currentUserId: string;
  pending: boolean;
  runAction: (fn: () => Promise<unknown>) => void;
  mobile?: boolean;
}) {
  if (contact.imported_to_leads) {
    return <span className="text-caramel font-mono text-[10px] uppercase tracking-widest">Importován ✓</span>;
  }

  const c = contact;
  const baseBtn = mobile
    ? 'px-3 py-2 min-h-[44px] inline-flex items-center justify-center gap-1 text-xs font-mono uppercase tracking-widest'
    : 'px-2 py-1 inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest';

  return (
    <div className={mobile ? 'flex flex-wrap gap-2' : 'inline-flex flex-wrap items-center gap-1.5 justify-end'}>
      {c.phone && (
        <a href={`tel:${c.phone.replace(/\s/g, '')}`} className={`${baseBtn} bg-olive/20 text-olive hover:bg-olive/30`}>
          <Phone size={12} /> Volat
        </a>
      )}
      {c.email && (
        <a href={`mailto:${c.email}`} className={`${baseBtn} bg-caramel/20 text-caramel hover:bg-caramel/30`}>
          <Mail size={12} /> Email
        </a>
      )}
      {!c.assigned_to && (
        <button
          onClick={() => runAction(() => takeContact(c.id))}
          disabled={pending}
          className={`${baseBtn} bg-tobacco text-sepia hover:bg-tobacco/70 disabled:opacity-50`}
        >
          Vzít si
        </button>
      )}
      <button
        onClick={() => runAction(() => setContactOutcome(c.id, 'nezvedl'))}
        disabled={pending}
        className={`${baseBtn} bg-coffee text-sandstone hover:bg-tobacco disabled:opacity-50`}
        title="Nezvedl"
      >
        <X size={12} /> Nezvedl
      </button>
      <button
        onClick={() => runAction(() => setContactOutcome(c.id, 'nezajem'))}
        disabled={pending}
        className={`${baseBtn} bg-rust/20 text-rust hover:bg-rust/30 disabled:opacity-50`}
        title="Nezájem"
      >
        <Trash2 size={12} /> Nezájem
      </button>
      <button
        onClick={() => runAction(() => setContactOutcome(c.id, 'pozdeji'))}
        disabled={pending}
        className={`${baseBtn} bg-parchment-gold/20 text-parchment-gold hover:bg-parchment-gold/30 disabled:opacity-50`}
        title="Později"
      >
        <Clock size={12} /> Později
      </button>
      <button
        onClick={() => {
          if (!confirm(`Importovat ${c.full_name} jako lead? Vytvoří se nový lead se stavem 'kontaktován'.`)) return;
          runAction(() => importContactToLead(c.id));
        }}
        disabled={pending || !c.email}
        title={!c.email ? 'Kontakt nemá email — nelze importovat' : 'Importovat jako lead'}
        className={`${baseBtn} bg-olive text-espresso hover:bg-olive/80 font-bold disabled:opacity-30`}
      >
        <Check size={12} /> Zájem → Lead
      </button>
    </div>
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
