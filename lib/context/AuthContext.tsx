'use client';

import { createContext, useContext, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { UserRole } from '@/lib/types/database';

export type AuthProfile = {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  avatar_url: string | null;
  email_notifications_enabled: boolean;
};

type AuthContextValue = {
  profile: AuthProfile;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  profile,
  children,
}: {
  profile: AuthProfile;
  children: React.ReactNode;
}) {
  const value = useMemo<AuthContextValue>(
    () => ({
      profile,
      async signOut() {
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = '/portal/login';
      },
    }),
    [profile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
