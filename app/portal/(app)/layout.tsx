import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { untyped } from '@/lib/supabase/untyped';
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
  // Reálný přihlášený uživatel má přednost před náhledem (zaseknutá preview
  // cookie nesmí maskovat reálný účet). Preview (anon) je demo s mock daty.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: AuthProfile & { is_active: boolean };
  let preview = false;
  let unreadNotifications = 0;

  if (user) {
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

    const { count } = await untyped(supabase)
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('read_at', null);
    unreadNotifications = count ?? 0;
  } else if (await isPreviewMode()) {
    preview = true;
    profile = PREVIEW_PROFILE;
  } else {
    redirect('/portal/login');
    return null;
  }

  return (
    <AuthProvider profile={profile}>
      <div className="flex bg-espresso text-sepia min-h-screen font-body">
        <div className="hidden lg:block">
          <Sidebar unreadNotifications={unreadNotifications} />
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
