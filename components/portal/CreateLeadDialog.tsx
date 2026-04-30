'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Plus, X } from 'lucide-react';
import { useState, useTransition } from 'react';
import { createLeadManual } from '@/lib/actions/leads';

const SOURCE_TAGS = [
  { value: 'cold_call', label: 'Telefon' },
  { value: 'email_outreach', label: 'E-mail' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'doporuceni', label: 'Doporučení' },
  { value: 'meta_ads', label: 'Meta Ads' },
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'organic', label: 'Organic' },
  { value: 'jine', label: 'Jiné' },
] as const;

export type Obchodnik = { id: string; full_name: string | null; email: string };

export default function CreateLeadDialog({ obchodnici }: { obchodnici: Obchodnik[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createLeadManual(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOpen(false);
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="inline-flex items-center gap-2 bg-caramel hover:bg-caramel-light text-espresso px-4 py-2.5 font-mono text-[11px] uppercase tracking-widest font-bold transition-all">
          <Plus size={14} strokeWidth={2.5} />
          Nový lead
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-espresso/80 backdrop-blur-sm z-40" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-coffee z-50 shadow-2xl max-h-[90vh] overflow-y-auto"
          aria-describedby={undefined}
        >
          <div className="px-6 py-5 border-b border-tobacco flex items-start justify-between gap-4">
            <Dialog.Title className="font-display italic font-black text-xl text-moonlight">
              Nový lead
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-sandstone hover:text-moonlight" aria-label="Zavřít">
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <Field label="Jméno *" htmlFor="full_name">
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                minLength={2}
                maxLength={120}
                disabled={pending}
                className="w-full bg-espresso border border-tobacco text-moonlight px-3 py-2 focus:border-caramel outline-none disabled:opacity-50"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="E-mail *" htmlFor="email">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  maxLength={200}
                  disabled={pending}
                  className="w-full bg-espresso border border-tobacco text-moonlight px-3 py-2 focus:border-caramel outline-none disabled:opacity-50"
                />
              </Field>
              <Field label="Telefon" htmlFor="phone">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  maxLength={40}
                  disabled={pending}
                  className="w-full bg-espresso border border-tobacco text-moonlight px-3 py-2 focus:border-caramel outline-none disabled:opacity-50"
                />
              </Field>
            </div>

            <Field label="Firma" htmlFor="company">
              <input
                id="company"
                name="company"
                type="text"
                maxLength={160}
                disabled={pending}
                className="w-full bg-espresso border border-tobacco text-moonlight px-3 py-2 focus:border-caramel outline-none disabled:opacity-50"
              />
            </Field>

            <Field label="Popis poptávky" htmlFor="popis">
              <textarea
                id="popis"
                name="popis"
                rows={3}
                maxLength={4000}
                disabled={pending}
                placeholder="Co chce, kdy, jaký rozsah…"
                className="w-full bg-espresso border border-tobacco text-moonlight px-3 py-2 focus:border-caramel outline-none resize-none disabled:opacity-50"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Zdroj" htmlFor="source_tag">
                <select
                  id="source_tag"
                  name="source_tag"
                  defaultValue="cold_call"
                  disabled={pending}
                  className="w-full bg-espresso border border-tobacco text-moonlight px-3 py-2 focus:border-caramel outline-none disabled:opacity-50"
                >
                  {SOURCE_TAGS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Přiřadit" htmlFor="assigned_to">
                <select
                  id="assigned_to"
                  name="assigned_to"
                  defaultValue=""
                  disabled={pending}
                  className="w-full bg-espresso border border-tobacco text-moonlight px-3 py-2 focus:border-caramel outline-none disabled:opacity-50"
                >
                  <option value="">— mně —</option>
                  {obchodnici.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.full_name ?? o.email}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <input type="hidden" name="kampan" value="manual" />

            {error && (
              <p className="text-rust text-sm font-mono border border-rust/40 bg-rust/10 px-3 py-2">{error}</p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  disabled={pending}
                  className="text-sandstone hover:text-moonlight font-mono text-[11px] uppercase tracking-widest"
                >
                  Zrušit
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={pending}
                className="bg-caramel hover:bg-caramel-light disabled:bg-tobacco disabled:text-sandstone text-espresso px-5 py-2.5 font-mono text-[11px] uppercase tracking-widest font-bold transition-all"
              >
                {pending ? 'Ukládám…' : 'Vytvořit lead'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

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
