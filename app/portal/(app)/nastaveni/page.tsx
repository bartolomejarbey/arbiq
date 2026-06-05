import Link from 'next/link';
import { Bell } from 'lucide-react';
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
      <div className="px-4 md:px-8 py-8 max-w-2xl space-y-6">
        <SettingsForm profile={profile} />
        <Link
          href="/portal/nastaveni/notifikace"
          className="flex items-center gap-3 bg-coffee border border-tobacco hover:border-caramel p-4 transition-colors"
        >
          <Bell size={18} className="text-caramel" />
          <div>
            <div className="text-moonlight text-sm">Notifikace</div>
            <div className="text-sandstone text-xs">E-mail, SMS a upozornění podle typu události.</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
