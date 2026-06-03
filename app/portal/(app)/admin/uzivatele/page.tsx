import { redirect } from 'next/navigation';
import { createClient } from "@/lib/supabase/server";
import { requireViewer } from "@/lib/supabase/viewer";
import PageHeader from '@/components/portal/PageHeader';
import UsersClient from './UsersClient';

export const dynamic = 'force-dynamic';

type ProfileRow = {
  id: string;
  full_name: string;
  email: string;
  role: 'klient' | 'obchodnik' | 'admin';
  is_active: boolean;
  assigned_obchodnik: string | null;
  parent_client_id: string | null;
  parent: { full_name: string; company: string | null } | null;
  company: string | null;
  created_at: string;
};

export default async function UzivateleAdminPage() {
  const viewer = await requireViewer();
  const supabase = await createClient();
  const user = viewer;

  // POZOR: žádný self-referenční embed (parent:profiles!…) — PostgREST ho neumí
  // přeložit (PGRST200) a shodil by celý dotaz → prázdný seznam uživatelů.
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, is_active, assigned_obchodnik, parent_client_id, company, created_at')
    .order('role', { ascending: true })
    .order('full_name', { ascending: true });

  if (error) console.error('[admin/uzivatele] načtení uživatelů selhalo:', error.message);

  let users = ((data ?? []) as unknown as ProfileRow[]);
  // parent dohledáme v paměti — dotaz vrací všechny profily, takže rodič už je v sadě.
  const byId = new Map(users.map((u) => [u.id, u]));
  users = users.map((u) => {
    const p = u.parent_client_id ? byId.get(u.parent_client_id) : undefined;
    return { ...u, parent: p ? { full_name: p.full_name, company: p.company } : null };
  });
  const obchodnici = users.filter((u) => u.role === 'obchodnik' || u.role === 'admin');
  const existingClients = users
    .filter((u) => u.role === 'klient' && u.parent_client_id === null)
    .map((u) => ({ id: u.id, full_name: u.full_name, company: u.company }));

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Uživatelé" subtitle="Správa všech přístupů do portálu." />
      <div className="px-4 md:px-8 py-8 space-y-8">
        <UsersClient
          users={users}
          obchodnici={obchodnici.map((o) => ({ id: o.id, full_name: o.full_name }))}
          existingClients={existingClients}
        />
      </div>
    </div>
  );
}

export { type ProfileRow };
