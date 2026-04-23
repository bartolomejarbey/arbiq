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
  created_at: string;
};

export default async function UzivateleAdminPage() {
  const viewer = await requireViewer();
  const supabase = await createClient();
  const user = viewer;

  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, is_active, assigned_obchodnik, created_at')
    .order('role', { ascending: true })
    .order('full_name', { ascending: true });

  const users = ((data ?? []) as unknown as ProfileRow[]);
  const obchodnici = users.filter((u) => u.role === 'obchodnik' || u.role === 'admin');

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Uživatelé" subtitle="Správa všech přístupů do portálu." />
      <div className="px-8 py-8 space-y-8">
        <UsersClient users={users} obchodnici={obchodnici.map((o) => ({ id: o.id, full_name: o.full_name }))} />
      </div>
    </div>
  );
}

export { type ProfileRow };
