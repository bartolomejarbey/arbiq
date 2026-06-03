'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Pencil, X } from 'lucide-react';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateClientProfile } from '@/lib/actions/users';
import IcoLookup from '@/components/portal/IcoLookup';

export type ObchodnikOption = { id: string; full_name: string | null; email: string };
export type ParentOption = { id: string; full_name: string; company: string | null };

export type EditClientData = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  ico: string | null;
  dic: string | null;
  street: string | null;
  city: string | null;
  assigned_obchodnik: string | null;
  parent_client_id: string | null;
};

export default function EditClientForm({
  client,
  obchodnici,
  parents,
}: {
  client: EditClientData;
  obchodnici: ObchodnikOption[];
  parents: ParentOption[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [ico, setIco] = useState(client.ico ?? '');
  const [company, setCompany] = useState(client.company ?? '');
  const [dic, setDic] = useState(client.dic ?? '');
  const [street, setStreet] = useState(client.street ?? '');
  const [city, setCity] = useState(client.city ?? '');
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateClientProfile(client.id, fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  // Nelze přiřadit klienta sám pod sebe.
  const parentChoices = parents.filter((p) => p.id !== client.id);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="inline-flex items-center gap-2 border border-tobacco hover:border-caramel text-sepia hover:text-caramel px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors">
          <Pencil size={12} strokeWidth={2.5} />
          Upravit
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
              Upravit klienta
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-sandstone hover:text-moonlight" aria-label="Zavřít">
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <Field label="Jméno *" htmlFor="e_full_name">
              <input id="e_full_name" name="full_name" type="text" required minLength={2} maxLength={120} disabled={pending} defaultValue={client.full_name} className={inputClass} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="E-mail *" htmlFor="e_email">
                <input id="e_email" name="email" type="email" required maxLength={200} disabled={pending} defaultValue={client.email} className={inputClass} />
              </Field>
              <Field label="Telefon" htmlFor="e_phone">
                <input id="e_phone" name="phone" type="tel" maxLength={40} disabled={pending} defaultValue={client.phone ?? ''} className={inputClass} />
              </Field>
            </div>

            <div className="grid grid-cols-[1fr_180px_auto] gap-2 items-end">
              <Field label="Firma" htmlFor="e_company">
                <input id="e_company" name="company" type="text" maxLength={160} disabled={pending} value={company} onChange={(ev) => setCompany(ev.target.value)} className={inputClass} />
              </Field>
              <Field label="IČO" htmlFor="e_ico">
                <input id="e_ico" name="ico" type="text" maxLength={20} disabled={pending} value={ico} onChange={(ev) => setIco(ev.target.value)} className={inputClass} />
              </Field>
              <IcoLookup
                ico={ico}
                onResult={(d) => {
                  setIco(d.ico);
                  if (d.name) setCompany(d.name);
                  if (d.dic) setDic(d.dic);
                  if (d.street) setStreet(d.street);
                  if (d.city) setCity(d.city);
                }}
                className="pb-0.5"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-espresso p-3 border border-tobacco/50">
              <Field label="DIČ" htmlFor="e_dic">
                <input id="e_dic" name="dic" type="text" maxLength={20} disabled={pending} value={dic} onChange={(ev) => setDic(ev.target.value)} className={inputClass} />
              </Field>
              <Field label="Ulice + č.p." htmlFor="e_street">
                <input id="e_street" name="street" type="text" maxLength={200} disabled={pending} value={street} onChange={(ev) => setStreet(ev.target.value)} className={inputClass} />
              </Field>
              <Field label="Město + PSČ" htmlFor="e_city">
                <input id="e_city" name="city" type="text" maxLength={200} disabled={pending} value={city} onChange={(ev) => setCity(ev.target.value)} className={inputClass} />
              </Field>
            </div>

            <Field label="Přiřazený obchodník" htmlFor="e_assigned_obchodnik">
              <select id="e_assigned_obchodnik" name="assigned_obchodnik" defaultValue={client.assigned_obchodnik ?? ''} disabled={pending} className={inputClass}>
                <option value="">— žádný —</option>
                {obchodnici.map((o) => (
                  <option key={o.id} value={o.id}>{o.full_name ?? o.email}</option>
                ))}
              </select>
            </Field>

            <Field label="Patří k osobě (tato firma spadá pod jiného klienta)" htmlFor="e_parent_client_id">
              <select id="e_parent_client_id" name="parent_client_id" defaultValue={client.parent_client_id ?? ''} disabled={pending} className={inputClass}>
                <option value="">— samostatná osoba —</option>
                {parentChoices.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}{p.company ? ` · ${p.company}` : ''}
                  </option>
                ))}
              </select>
            </Field>

            {error && (
              <p className="text-rust text-sm font-mono border border-rust/40 bg-rust/10 px-3 py-2">{error}</p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Dialog.Close asChild>
                <button type="button" disabled={pending} className="text-sandstone hover:text-moonlight font-mono text-[11px] uppercase tracking-widest">
                  Zrušit
                </button>
              </Dialog.Close>
              <button type="submit" disabled={pending} className="bg-caramel hover:bg-caramel-light disabled:bg-tobacco disabled:text-sandstone text-espresso px-5 py-2.5 font-mono text-[11px] uppercase tracking-widest font-bold transition-all">
                {pending ? 'Ukládám…' : 'Uložit změny'}
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
