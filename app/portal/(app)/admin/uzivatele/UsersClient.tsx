'use client';

import { useState, useTransition } from 'react';
import { Plus, KeyRound, Power } from 'lucide-react';
import StatusBadge from '@/components/portal/StatusBadge';
import { formatDate } from '@/lib/formatters';
import { createPortalUser, setUserActive, resetUserPassword } from '@/lib/actions/users';

type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: 'klient' | 'obchodnik' | 'admin';
  is_active: boolean;
  assigned_obchodnik: string | null;
  created_at: string;
};

const roleLabels: Record<string, string> = {
  klient: 'Klient',
  obchodnik: 'Obchodník',
  admin: 'Admin',
};

const inputClass =
  'w-full bg-espresso border border-tobacco px-3 py-2 text-moonlight placeholder:text-sandstone/50 focus:border-caramel focus:outline-none transition-colors';
const labelClass = 'font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-1.5';

export default function UsersClient({
  users,
  obchodnici,
}: {
  users: Profile[];
  obchodnici: { id: string; full_name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [createdRole, setCreatedRole] = useState<'klient' | 'obchodnik' | 'admin'>('klient');

  function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const res = await createPortalUser(fd);
      if (!res.ok) setError(res.error);
      else {
        form.reset();
        setOpen(false);
        setSuccess('Uživatel vytvořen. Heslo bylo posláno e-mailem.');
      }
    });
  }

  function onResetPassword(userId: string) {
    if (!confirm('Vygenerovat nové heslo pro tohoto uživatele?')) return;
    startTransition(async () => {
      const res = await resetUserPassword(userId);
      if (res.ok) setSuccess(`Nové heslo: ${res.password} (zkopírujte a předejte uživateli — již ho neuvidíte).`);
      else setError(res.error);
    });
  }

  function onToggleActive(userId: string, current: boolean) {
    startTransition(() => { void setUserActive(userId, !current); });
  }

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-3">
        {!open ? (
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 bg-caramel text-espresso px-4 py-2.5 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all"
          >
            <Plus size={14} /> Přidat uživatele
          </button>
        ) : <span />}
        <span className="text-sandstone text-xs">{users.length} uživatel(ů)</span>
      </div>

      {(error || success) && (
        <div className={`p-4 ${error ? 'bg-rust/10 border border-rust/40 text-rust' : 'bg-olive/10 border border-olive/40 text-olive'} text-sm font-mono`}>
          {error ?? success}
        </div>
      )}

      {open && (
        <form onSubmit={onCreate} className="bg-coffee p-6 space-y-4">
          <h3 className="font-display italic text-xl text-moonlight">Nový uživatel</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="full_name">Jméno</label>
              <input id="full_name" name="full_name" required minLength={2} className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="email">E-mail</label>
              <input id="email" name="email" type="email" required className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="role">Role</label>
              <select
                id="role" name="role"
                value={createdRole}
                onChange={(e) => setCreatedRole(e.target.value as typeof createdRole)}
                className={inputClass}
              >
                <option value="klient">Klient</option>
                <option value="obchodnik">Obchodník</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {createdRole === 'klient' && (
              <div>
                <label className={labelClass} htmlFor="assigned_obchodnik">Přiřazený obchodník</label>
                <select id="assigned_obchodnik" name="assigned_obchodnik" className={inputClass} defaultValue="">
                  <option value="">— bez přiřazení —</option>
                  {obchodnici.map((o) => (
                    <option key={o.id} value={o.id}>{o.full_name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input id="send_invite" name="send_invite" type="checkbox" defaultChecked className="w-4 h-4 accent-caramel" />
            <label htmlFor="send_invite" className="text-sepia text-sm">Poslat uvítací e-mail s heslem</label>
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={pending} className="bg-caramel text-espresso px-5 py-2.5 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all disabled:opacity-50">
              {pending ? 'Vytvářím…' : 'Vytvořit uživatele'}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-sandstone hover:text-moonlight text-xs font-mono uppercase tracking-widest">Zrušit</button>
          </div>
        </form>
      )}

      <div className="bg-coffee overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-tobacco">
              <Th>Jméno</Th>
              <Th>E-mail</Th>
              <Th>Role</Th>
              <Th>Stav</Th>
              <Th>Vytvořeno</Th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id} className={`border-b border-tobacco/50 ${i % 2 === 1 ? 'bg-coffee/40' : ''}`}>
                <td className="px-4 py-3 text-moonlight">{u.full_name}</td>
                <td className="px-4 py-3 text-sepia">{u.email}</td>
                <td className="px-4 py-3 text-sepia">{roleLabels[u.role]}</td>
                <td className="px-4 py-3">
                  {u.is_active
                    ? <StatusBadge kind="task" value="done" />
                    : <StatusBadge kind="task" value="cancelled" />}
                </td>
                <td className="px-4 py-3 text-sandstone whitespace-nowrap">{formatDate(u.created_at)}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button
                    onClick={() => onResetPassword(u.id)}
                    disabled={pending}
                    className="text-sandstone hover:text-caramel inline-flex items-center gap-1 text-xs mr-3 disabled:opacity-50"
                    title="Resetovat heslo"
                  >
                    <KeyRound size={14} />
                  </button>
                  <button
                    onClick={() => onToggleActive(u.id, u.is_active)}
                    disabled={pending}
                    className={`inline-flex items-center gap-1 text-xs ${u.is_active ? 'text-sandstone hover:text-rust' : 'text-sandstone hover:text-olive'} disabled:opacity-50`}
                    title={u.is_active ? 'Deaktivovat' : 'Aktivovat'}
                  >
                    <Power size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left font-mono text-[10px] uppercase tracking-widest text-sandstone px-4 py-3">{children}</th>;
}
