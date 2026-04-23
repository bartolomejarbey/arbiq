import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isPreviewMode, PREVIEW_PROFILE } from '@/lib/supabase/viewer';
import { AuthProvider, type AuthProfile } from '@/lib/context/AuthContext';
import Sidebar from '@/components/portal/Sidebar';
import MobileBottomNav from '@/components/portal/MobileBottomNav';
import PreviewBanner from '@/components/portal/PreviewBanner';

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const preview = await isPreviewMode();

  let profile: AuthProfile & { is_active: boolean };

  if (preview) {
    profile = PREVIEW_PROFILE;
  } else {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/portal/login');
    }

    const { data: profileRow } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, avatar_url, email_notifications_enabled, is_active')
      .eq('id', user.id)
      .single();

    if (!profileRow || !profileRow.is_active) {
      await supabase.auth.signOut();
      redirect('/portal/login?error=Účet je deaktivován.');
    }

    profile = profileRow as unknown as AuthProfile & { is_active: boolean };
  }

  return (
    <AuthProvider profile={profile}>
      <div className="flex bg-espresso text-sepia min-h-screen font-body">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <div className="flex-1 min-w-0 overflow-x-hidden pb-16 lg:pb-0">
          {preview && <PreviewBanner />}
          {children}
        </div>
        <MobileBottomNav />
      </div>
    </AuthProvider>
  );
}
