import { redirect } from 'next/navigation';
import { createClient } from "@/lib/supabase/server";
import { requireViewer } from "@/lib/supabase/viewer";
import PageHeader from '@/components/portal/PageHeader';
import SettingsForm from './SettingsForm';

export const dynamic = 'force-dynamic';

type ProfileRow = {
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  ico: string | null;
  website_url: string | null;
  email_notifications_enabled: boolean;
};

export default async function NastaveniPage() {
  const viewer = await requireViewer();
  const supabase = await createClient();
  const user = viewer;

  const { data } = await supabase
    .from('profiles')
    .select('full_name, email, phone, company, ico, website_url, email_notifications_enabled')
    .eq('id', user.id)
    .single();

  const profile = (data as unknown as ProfileRow) ?? {
    full_name: '',
    email: user.email ?? '',
    phone: null,
    company: null,
    ico: null,
    website_url: null,
    email_notifications_enabled: true,
  };

  return (
    <div>
      <PageHeader eyebrow="Klientská zóna" title="Nastavení" subtitle="Upravte své kontaktní údaje a preference." />
      <div className="px-8 py-8 max-w-2xl">
        <SettingsForm profile={profile} />
      </div>
    </div>
  );
}
