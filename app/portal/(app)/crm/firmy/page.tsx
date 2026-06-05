import Link from 'next/link';
import { Building2, Star, Archive } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireViewer } from '@/lib/supabase/viewer';
import { untyped } from '@/lib/supabase/untyped';
import PageHeader from '@/components/portal/PageHeader';
import EmptyState from '@/components/portal/EmptyState';
import FirmaDialog, { type FirmaClientOption } from '@/components/portal/FirmaDialog';
import type { Firma } from '@/lib/data/firmy';

export const dynamic = 'force-dynamic';

const COLS =
  'id, client_id, nazev, ico, dic, street, city, zip, country, billing_email, contract_email, representative_name, phone, website_url, is_primary, archived_at';

export default async function FirmyPage() {
  const viewer = await requireViewer();

  let firmy: Firma[] = [];
  let owners = new Map<string, string>();
  let clients: FirmaClientOption[] = [];

  if (!viewer.isPreview) {
    const supabase = await createClient();
    const [{ data: firmyRows }, { data: clientRows }] = await Promise.all([
      untyped(supabase).from('firmy').select(COLS).order('nazev', { ascending: true }),
      untyped(supabase).from('profiles').select('id, full_name').eq('role', 'klient').order('full_name'),
    ]);
    firmy = (firmyRows ?? []) as Firma[];
    clients = ((clientRows ?? []) as Array<{ id: string; full_name: string }>).map((c) => ({ id: c.id, full_name: c.full_name }));
    owners = new Map(clients.map((c) => [c.id, c.full_name]));
  }

  // Seskup podle vlastníka (klienta).
  const byClient = new Map<string, Firma[]>();
  for (const f of firmy) {
    const arr = byClient.get(f.client_id) ?? [];
    arr.push(f);
    byClient.set(f.client_id, arr);
  }

  return (
    <div>
      <PageHeader
        eyebrow="CRM"
        title="Firmy"
        subtitle="Fakturační subjekty klientů — IČO, DIČ, adresa. Jeden klient může mít více firem."
        actions={<FirmaDialog clients={clients} triggerLabel="Nová firma" />}
      />
      <div className="px-4 md:px-8 py-8 space-y-8">
        {firmy.length === 0 ? (
          <EmptyState title="Zatím žádné firmy" description="Firmy se zakládají u klienta nebo tlačítkem „Nová firma“ výše." />
        ) : (
          [...byClient.entries()].map(([clientId, list]) => (
            <section key={clientId} className="space-y-3">
              <div className="flex items-center justify-between border-b border-tobacco pb-2">
                <Link href={`/portal/crm/klient/${clientId}`} className="font-display italic text-lg text-moonlight hover:text-caramel">
                  {owners.get(clientId) ?? 'Klient'}
                </Link>
                <span className="font-mono text-[10px] uppercase tracking-widest text-sandstone">{list.length} firem</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {list.map((f) => (
                  <div key={f.id} className={`bg-coffee border p-4 space-y-2 ${f.archived_at ? 'border-tobacco/40 opacity-60' : 'border-tobacco'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Building2 size={16} className="text-caramel shrink-0" />
                        <span className="text-moonlight text-sm truncate">{f.nazev}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {f.is_primary && <Star size={13} className="text-parchment-gold" aria-label="Primární" />}
                        {f.archived_at && <Archive size={13} className="text-sandstone" aria-label="Archivováno" />}
                      </div>
                    </div>
                    <div className="font-mono text-[11px] text-sandstone space-y-0.5">
                      {f.ico && <div>IČO {f.ico}{f.dic ? ` · DIČ ${f.dic}` : ''}</div>}
                      {(f.street || f.city) && <div className="text-sepia/70">{[f.street, f.city].filter(Boolean).join(', ')}</div>}
                      {f.billing_email && <div className="truncate">{f.billing_email}</div>}
                    </div>
                    <div className="pt-1">
                      <FirmaDialog firma={f} variant="ghost" triggerLabel="Upravit" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
