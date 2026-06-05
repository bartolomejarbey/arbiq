'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Plus, X, Pencil } from 'lucide-react';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import IcoLookup from '@/components/portal/IcoLookup';
import { createFirma, updateFirma } from '@/lib/actions/firmy';
import type { Firma } from '@/lib/data/firmy';

export type FirmaClientOption = { id: string; full_name: string };

export default function FirmaDialog({
  presetClientId,
  presetClientName,
  clients,
  firma,
  triggerLabel,
  variant = 'primary',
}: {
  /** Vlastník firmy je předvolený (z detailu klienta). */
  presetClientId?: string;
  presetClientName?: string;
  /** Když není preset, ukáže výběr klienta (globální stránka Firmy). */
  clients?: FirmaClientOption[];
  /** Edit režim — předvyplní hodnoty a volá updateFirma. */
  firma?: Firma;
  triggerLabel?: string;
  variant?: 'primary' | 'ghost';
}) {
  const isEdit = Boolean(firma);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const [clientId, setClientId] = useState(presetClientId ?? firma?.client_id ?? '');
  const [ico, setIco] = useState(firma?.ico ?? '');
  const [nazev, setNazev] = useState(firma?.nazev ?? '');
  const [dic, setDic] = useState(firma?.dic ?? '');
  const [street, setStreet] = useState(firma?.street ?? '');
  const [city, setCity] = useState(firma?.city ?? '');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = isEdit
        ? await updateFirma(firma!.id, fd)
        : clientId
          ? await createFirma(clientId, fd)
          : ({ ok: false, error: 'Vyber klienta.' } as const);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  const triggerClass =
    variant === 'primary'
      ? 'inline-flex items-center gap-2 bg-caramel hover:bg-caramel-light text-espresso px-4 py-2.5 font-mono text-[11px] uppercase tracking-widest font-bold transition-all'
      : 'inline-flex items-center gap-1.5 border border-tobacco hover:border-caramel text-sepia hover:text-caramel px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors';

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className={triggerClass}>
          {isEdit ? <Pencil size={variant === 'ghost' ? 12 : 14} /> : <Plus size={variant === 'ghost' ? 12 : 14} strokeWidth={2.5} />}
          {triggerLabel ?? (isEdit ? 'Upravit' : 'Přidat firmu')}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-espresso/80 backdrop-blur-sm z-40" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-coffee z-50 max-h-[90vh] overflow-y-auto"
          aria-describedby={undefined}
        >
          <div className="px-6 py-5 border-b border-tobacco flex items-start justify-between gap-4">
            <Dialog.Title className="font-display italic font-black text-xl text-moonlight">
              {isEdit ? `Upravit firmu` : presetClientName ? `Nová firma — ${presetClientName}` : 'Nová firma'}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-sandstone hover:text-moonlight" aria-label="Zavřít">
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {!presetClientId && !isEdit && (
              <Field label="Klient (vlastník firmy) *" htmlFor="client_picker">
                <select
                  id="client_picker"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  required
                  disabled={pending}
                  className={inputClass}
                >
                  <option value="">— vyber klienta —</option>
                  {(clients ?? []).map((c) => (
                    <option key={c.id} value={c.id}>{c.full_name}</option>
                  ))}
                </select>
              </Field>
            )}

            <div className="grid grid-cols-[1fr_180px_auto] gap-2 items-end">
              <Field label="Název firmy *" htmlFor="nazev">
                <input id="nazev" name="nazev" type="text" required minLength={2} maxLength={200} disabled={pending} value={nazev} onChange={(e) => setNazev(e.target.value)} className={inputClass} />
              </Field>
              <Field label="IČO" htmlFor="ico">
                <input id="ico" name="ico" type="text" maxLength={20} disabled={pending} value={ico} onChange={(e) => setIco(e.target.value)} className={inputClass} />
              </Field>
              <IcoLookup
                ico={ico}
                onResult={(d) => {
                  setIco(d.ico);
                  if (d.name && !nazev) setNazev(d.name);
                  if (d.dic) setDic(d.dic);
                  if (d.street) setStreet(d.street);
                  if (d.city) setCity(d.city);
                }}
                className="pb-0.5"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="DIČ" htmlFor="dic">
                <input id="dic" name="dic" type="text" maxLength={20} disabled={pending} value={dic} onChange={(e) => setDic(e.target.value)} className={inputClass} />
              </Field>
              <Field label="Ulice + č.p." htmlFor="street">
                <input id="street" name="street" type="text" maxLength={200} disabled={pending} value={street} onChange={(e) => setStreet(e.target.value)} className={inputClass} />
              </Field>
              <Field label="Město" htmlFor="city">
                <input id="city" name="city" type="text" maxLength={200} disabled={pending} value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="PSČ" htmlFor="zip">
                <input id="zip" name="zip" type="text" maxLength={20} disabled={pending} defaultValue={firma?.zip ?? ''} className={inputClass} />
              </Field>
              <Field label="Země" htmlFor="country">
                <input id="country" name="country" type="text" maxLength={60} disabled={pending} defaultValue={firma?.country ?? 'CZ'} className={inputClass} />
              </Field>
              <Field label="Zástupce" htmlFor="representative_name">
                <input id="representative_name" name="representative_name" type="text" maxLength={160} disabled={pending} defaultValue={firma?.representative_name ?? ''} className={inputClass} />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Fakturační e-mail" htmlFor="billing_email">
                <input id="billing_email" name="billing_email" type="email" maxLength={200} disabled={pending} defaultValue={firma?.billing_email ?? ''} className={inputClass} />
              </Field>
              <Field label="Smluvní e-mail" htmlFor="contract_email">
                <input id="contract_email" name="contract_email" type="email" maxLength={200} disabled={pending} defaultValue={firma?.contract_email ?? ''} className={inputClass} />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Telefon" htmlFor="phone">
                <input id="phone" name="phone" type="tel" maxLength={40} disabled={pending} defaultValue={firma?.phone ?? ''} className={inputClass} />
              </Field>
              <Field label="Web" htmlFor="website_url">
                <input id="website_url" name="website_url" type="text" maxLength={200} disabled={pending} defaultValue={firma?.website_url ?? ''} className={inputClass} />
              </Field>
            </div>

            <label className="flex items-center gap-3 pt-1 cursor-pointer">
              <input type="checkbox" name="is_primary" disabled={pending} defaultChecked={firma?.is_primary ?? false} className="w-4 h-4 accent-caramel" />
              <span className="text-moonlight text-sm">Primární firma klienta (výchozí pro fakturaci)</span>
            </label>

            {error && <p className="text-rust text-sm font-mono border border-rust/40 bg-rust/10 px-3 py-2">{error}</p>}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Dialog.Close asChild>
                <button type="button" disabled={pending} className="text-sandstone hover:text-moonlight font-mono text-[11px] uppercase tracking-widest">
                  Zrušit
                </button>
              </Dialog.Close>
              <button type="submit" disabled={pending} className="bg-caramel hover:bg-caramel-light disabled:bg-tobacco disabled:text-sandstone text-espresso px-5 py-2.5 font-mono text-[11px] uppercase tracking-widest font-bold transition-all">
                {pending ? 'Ukládám…' : isEdit ? 'Uložit změny' : 'Vytvořit firmu'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

const inputClass = 'w-full bg-espresso border border-tobacco text-moonlight px-3 py-2 focus:border-caramel outline-none disabled:opacity-50';

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
