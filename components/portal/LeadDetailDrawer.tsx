'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatDate } from '@/lib/formatters';
import ConvertLeadForm from './ConvertLeadForm';
import { useState } from 'react';
import type { LeadRow } from './LeadTable';

export default function LeadDetailDrawer({
  lead,
  onClose,
}: {
  lead: LeadRow;
  onClose: () => void;
}) {
  const [showConvert, setShowConvert] = useState(false);

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-espresso/80 backdrop-blur-sm z-40" />
        <Dialog.Content
          className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-coffee z-50 overflow-y-auto shadow-2xl"
          aria-describedby={undefined}
        >
          <div className="px-8 py-6 border-b border-tobacco flex items-start justify-between gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-sandstone mb-1">
                {lead.case_number ?? 'Lead'}
              </div>
              <Dialog.Title className="font-display italic font-black text-2xl text-moonlight leading-tight">
                {lead.name}
              </Dialog.Title>
              <div className="flex items-center gap-3 mt-2">
                <StatusBadge kind="lead" value={lead.status} />
                <span className="text-sandstone text-xs">{formatDate(lead.created_at)}</span>
              </div>
            </div>
            <Dialog.Close asChild>
              <button className="text-sandstone hover:text-moonlight" aria-label="Zavřít">
                <X size={22} />
              </button>
            </Dialog.Close>
          </div>

          {showConvert ? (
            <div className="p-8">
              <button
                onClick={() => setShowConvert(false)}
                className="text-sandstone hover:text-caramel text-xs font-mono uppercase tracking-widest mb-4"
              >
                ← Zpět na detail
              </button>
              <ConvertLeadForm lead={lead} onSuccess={onClose} />
            </div>
          ) : (
            <div className="p-8 space-y-6">
              <Section title="Kontakt">
                <Field label="E-mail">
                  <a href={`mailto:${lead.email}`} className="text-caramel hover:text-caramel-light">{lead.email}</a>
                </Field>
                {lead.phone && (
                  <Field label="Telefon">
                    <a href={`tel:${lead.phone}`} className="text-caramel hover:text-caramel-light">{lead.phone}</a>
                  </Field>
                )}
                {lead.website_url && (
                  <Field label="Web">
                    <a href={lead.website_url} target="_blank" rel="noopener noreferrer" className="text-caramel hover:text-caramel-light break-all">
                      {lead.website_url}
                    </a>
                  </Field>
                )}
              </Section>

              <Section title="Kampaň a kvalifikace">
                <Field label="Kampaň">{lead.kampan}</Field>
                {lead.obor && <Field label="Obor">{lead.obor}</Field>}
                {lead.velikost_firmy && <Field label="Velikost firmy">{lead.velikost_firmy}</Field>}
                {lead.step3_odpoved && <Field label="Specifická odpověď">{lead.step3_odpoved}</Field>}
              </Section>

              {lead.popis && (
                <Section title="Vlastní popis">
                  <p className="text-sepia whitespace-pre-wrap">{lead.popis}</p>
                </Section>
              )}

              {(lead.utm_source || lead.utm_medium || lead.utm_campaign) && (
                <Section title="Zdroj návštěvy">
                  {lead.utm_source && <Field label="UTM source">{lead.utm_source}</Field>}
                  {lead.utm_medium && <Field label="UTM medium">{lead.utm_medium}</Field>}
                  {lead.utm_campaign && <Field label="UTM campaign">{lead.utm_campaign}</Field>}
                </Section>
              )}

              {lead.status !== 'converted' && lead.status !== 'lost' && lead.status !== 'unqualified' && (
                <button
                  onClick={() => setShowConvert(true)}
                  className="w-full bg-caramel text-espresso px-6 py-4 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all"
                >
                  Konvertovat na klienta
                </button>
              )}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-sandstone mb-3 border-b border-tobacco pb-2">
        {title}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-sandstone text-xs">{label}</div>
      <div className="text-moonlight">{children}</div>
    </div>
  );
}
