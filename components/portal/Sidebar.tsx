'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  Sparkles,
  Settings,
  KanbanSquare,
  Users,
  Inbox,
  CheckSquare,
  UserCog,
  FolderKanban,
  Trophy,
  LogOut,
  Cookie,
  Activity,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';

type NavItem = { href: string; label: string; icon: React.ComponentType<{ size?: number }> };

const clientNav: NavItem[] = [
  { href: '/portal/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/portal/faktury',     label: 'Faktury',     icon: Receipt },
  { href: '/portal/vysledky',    label: 'Výsledky',    icon: BarChart3 },
  { href: '/portal/doporuceni',  label: 'Doporučení',  icon: Sparkles },
];

const crmNav: NavItem[] = [
  { href: '/portal/crm/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/portal/crm/pipeline',  label: 'Pipeline',  icon: KanbanSquare },
  { href: '/portal/crm/klienti',   label: 'Klienti',   icon: Users },
  { href: '/portal/crm/leady',     label: 'Leady',     icon: Inbox },
  { href: '/portal/crm/ukoly',     label: 'Úkoly',     icon: CheckSquare },
];

const adminNav: NavItem[] = [
  { href: '/portal/admin/uzivatele',  label: 'Uživatelé',   icon: UserCog },
  { href: '/portal/admin/projekty',   label: 'Projekty',    icon: FolderKanban },
  { href: '/portal/admin/faktury',    label: 'Faktury',     icon: Receipt },
  { href: '/portal/admin/doporuceni', label: 'Doporučení',  icon: Sparkles },
  { href: '/portal/admin/statistiky', label: 'Statistiky',  icon: Trophy },
  { href: '/portal/admin/analytics',  label: 'Analytics',   icon: Activity },
  { href: '/portal/admin/chats',      label: 'Chaty',       icon: MessageSquare },
  { href: '/portal/admin/consent-log', label: 'Cookie log', icon: Cookie },
];

const settingsItem: NavItem = {
  href: '/portal/nastaveni',
  label: 'Nastavení',
  icon: Settings,
};

export default function Sidebar() {
  const { profile, signOut } = useAuth();
  const pathname = usePathname() ?? '';

  const sections: Array<{ title: string | null; items: NavItem[] }> = [];

  if (profile.role === 'klient') {
    sections.push({ title: null, items: clientNav });
  } else {
    sections.push({ title: 'CRM', items: crmNav });
    if (profile.role === 'admin') {
      sections.push({ title: 'Admin', items: adminNav });
    }
  }
  sections.push({ title: null, items: [settingsItem] });

  return (
    <aside className="w-60 shrink-0 bg-coffee border-r border-tobacco flex flex-col h-screen sticky top-0">
      <div className="px-6 py-6 border-b border-tobacco">
        <Link href="/portal" className="block">
          <div className="font-display italic font-black text-moonlight text-2xl tracking-tight">
            ARBIQ
          </div>
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-sandstone mt-1">
            {profile.role === 'klient' && 'Klientská zóna'}
            {profile.role === 'obchodnik' && 'CRM'}
            {profile.role === 'admin' && 'Admin'}
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {sections.map((section, idx) => (
          <div key={idx} className="mb-4">
            {section.title && (
              <div className="px-6 py-2 font-mono text-[9px] uppercase tracking-[0.18em] text-sandstone/60">
                {section.title}
              </div>
            )}
            <ul>
              {section.items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== '/portal/dashboard' &&
                   item.href !== '/portal/crm/dashboard' &&
                   pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-6 py-2.5 text-sm transition-colors ${
                        active
                          ? 'bg-tobacco text-caramel border-l-2 border-caramel'
                          : 'text-sepia hover:text-moonlight hover:bg-tobacco/50 border-l-2 border-transparent'
                      }`}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-tobacco px-6 py-4">
        <div className="text-moonlight text-sm truncate">{profile.full_name}</div>
        <div className="text-sandstone text-xs truncate mb-3">{profile.email}</div>
        <button
          onClick={() => void signOut()}
          className="flex items-center gap-2 text-sandstone hover:text-caramel text-xs font-mono uppercase tracking-widest transition-colors"
        >
          <LogOut size={14} />
          <span>Odhlásit se</span>
        </button>
      </div>
    </aside>
  );
}
