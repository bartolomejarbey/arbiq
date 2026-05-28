import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isPreviewMode } from '@/lib/supabase/viewer';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (await isPreviewMode()) return <>{children}</>;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/portal/login');

  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = (data as { role?: string } | null)?.role;
  if (role !== 'admin') redirect('/portal/crm/dashboard');

  return <>{children}</>;
}
