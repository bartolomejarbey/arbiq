import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isPreviewMode } from '@/lib/supabase/viewer';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Reálný přihlášený uživatel má přednost před náhledem (zaseknutá preview cookie
  // nesmí obejít admin gate). Preview (anon) je čistě demo s mock daty.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const role = (data as { role?: string } | null)?.role;
    if (role !== 'admin') redirect('/portal/crm/dashboard');
    return <>{children}</>;
  }

  if (await isPreviewMode()) return <>{children}</>;
  redirect('/portal/login');
}
