import { Building2, Star } from 'lucide-react';
import FirmaDialog from '@/components/portal/FirmaDialog';
import type { Firma } from '@/lib/data/firmy';

/**
 * Panel firem klienta v 360° centru. Karty firem + (pro admina/obchodníka)
 * přidání a úprava firmy. Fakturuje se na firmu — tady je její identita.
 */
export default function FirmyPanel({
  firmy,
  clientId,
  clientName,
  canManage,
}: {
  firmy: Firma[];
  clientId: string;
  clientName: string;
  canManage: boolean;
}) {
  return (
    <section>
      <h2 className="font-display italic font-black text-2xl text-moonlight mb-4 flex items-center gap-3">
        <Building2 size={20} className="text-caramel" />
        <span>Firmy</span>
        {canManage && (
          <span className="ml-auto">
            <FirmaDialog presetClientId={clientId} presetClientName={clientName} variant="ghost" triggerLabel="Přidat firmu" />
          </span>
        )}
      </h2>

      {firmy.length === 0 ? (
        <p className="text-sandstone text-sm bg-coffee p-6">
          Klient zatím nemá žádnou firmu.{canManage ? ' Přidej ji tlačítkem „Přidat firmu“ — bude se na ni fakturovat.' : ''}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {firmy.map((f) => (
            <div key={f.id} className="bg-coffee border border-tobacco p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 size={16} className="text-caramel shrink-0" />
                  <span className="text-moonlight text-sm truncate">{f.nazev}</span>
                  {f.is_primary && <Star size={13} className="text-parchment-gold shrink-0" aria-label="Primární" />}
                </div>
                {canManage && <FirmaDialog firma={f} variant="ghost" triggerLabel="Upravit" />}
              </div>
              <div className="font-mono text-[11px] text-sandstone space-y-0.5">
                {f.ico && <div>IČO {f.ico}{f.dic ? ` · DIČ ${f.dic}` : ''}</div>}
                {(f.street || f.city) && <div className="text-sepia/70">{[f.street, f.city].filter(Boolean).join(', ')}</div>}
                {f.billing_email && <div className="truncate">Fakturace: {f.billing_email}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
