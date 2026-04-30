'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Plus, X } from 'lucide-react';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createPortalUser } from '@/lib/actions/users';

export type ObchodnikOption = { id: string; full_name: string | null; email: string };

export default function CreateClientDialog({ obchodnici }: { obchodnici: ObchodnikOption[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [withProject, setWithProject] = useState(true);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set('role', 'klient');
    fd.set('send_invite', 'true');
    fd.set('create_initial_project', withProject ? 'true' : '');
    startTransition(async () => {
      const res = await createPortalUser(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOpen(false);
      // Redirect to klient detail
      if (res.userId) router.push(`/portal/crm/klient/${res.userId}`);
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="inline-flex items-center gap-2 bg-caramel hover:bg-caramel-light text-espresso px-4 py-2.5 font-mono text-[11px] uppercase tracking-widest font-bold transition-all">
          <Plus size={14} strokeWidth={2.5} />
          Nový klient
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-espresso/80 backdrop-blur-sm z-40" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-coffee z-50 shadow-2xl max-h-[90vh] overflow-y-auto"
          aria-describedby={undefined}
        >
          <div className="px-6 py-5 border-b border-tobacco flex items-start justify-between gap-4">
            <Dialog.Title className="font-display italic font-black text-xl text-moonlight">
              Nový klient
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-sandstone hover:text-moonlight" aria-label="Zavřít">
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-caramel border-b border-tobacco pb-1">
              Klient
            </div>

            <Field label="Jméno *" htmlFor="full_name">
              <input id="full_name" name="full_name" type="text" required minLength={2} maxLength={120} disabled={pending} className={inputClass} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="E-mail *" htmlFor="email">
                <input id="email" name="email" type="email" required maxLength={200} disabled={pending} className={inputClass} />
              </Field>
              <Field label="Telefon" htmlFor="phone">
                <input id="phone" name="phone" type="tel" maxLength={40} disabled={pending} className={inputClass} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Firma" htmlFor="company">
                <input id="company" name="company" type="text" maxLength={160} disabled={pending} className={inputClass} />
              </Field>
              <Field label="IČO" htmlFor="ico">
                <input id="ico" name="ico" type="text" maxLength={20} disabled={pending} className={inputClass} />
              </Field>
            </div>

            <Field label="Přiřadit obchodníka" htmlFor="assigned_obchodnik">
              <select id="assigned_obchodnik" name="assigned_obchodnik" defaultValue="" disabled={pending} className={inputClass}>
                <option value="">— žádný —</option>
                {obchodnici.map((o) => (
                  <option key={o.id} value={o.id}>{o.full_name ?? o.email}</option>
                ))}
              </select>
            </Field>

            <label className="flex items-center gap-3 pt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={withProject}
                onChange={(e) => setWithProject(e.target.checked)}
                disabled={pending}
                className="w-4 h-4 accent-caramel"
              />
              <span className="text-moonlight text-sm">Rovnou založit první projekt</span>
            </label>

            {withProject && (
              <div className="space-y-4 pt-2 pl-7 border-l-2 border-caramel/30">
                <Field label="Název projektu *" htmlFor="initial_project_name">
                  <input id="initial_project_name" name="initial_project_name" type="text" required={withProject} maxLength={160} disabled={pending} placeholder="Např. Web masi-co.cz redesign" className={inputClass} />
                </Field>
                <Field label="Popis projektu" htmlFor="initial_project_description">
                  <textarea id="initial_project_description" name="initial_project_description" rows={3} maxLength={4000} disabled={pending} placeholder="Rozsah, deadline, klíčové výstupy…" className={`${inputClass} resize-none`} />
                </Field>
              </div>
            )}

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
                {pending ? 'Vytvářím…' : 'Vytvořit klienta'}
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
