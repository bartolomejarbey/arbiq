'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  Sparkles,
  Settings,
  KanbanSquare,
  Inbox,
  CheckSquare,
  UserCog,
  Database,
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';

const clientItems = [
  { href: '/portal/dashboard',  label: 'Přehled', icon: LayoutDashboard },
  { href: '/portal/faktury',    label: 'Faktury', icon: Receipt },
  { href: '/portal/doporuceni', label: 'Návrhy',  icon: Sparkles },
  { href: '/portal/nastaveni',  label: 'Nastavení', icon: Settings },
];

const crmItems = [
  { href: '/portal/crm/dashboard', label: 'Přehled',  icon: LayoutDashboard },
  { href: '/portal/crm/leady',     label: 'Leady',    icon: Inbox },
  { href: '/portal/crm/pipeline',  label: 'Pipeline', icon: KanbanSquare },
  { href: '/portal/crm/databaze',  label: 'Databáze', icon: Database },
  { href: '/portal/crm/ukoly',     label: 'Úkoly',    icon: CheckSquare },
];

const adminItems = [
  { href: '/portal/crm/dashboard',    label: 'CRM',     icon: LayoutDashboard },
  { href: '/portal/admin/uzivatele',  label: 'Lidé',    icon: UserCog },
  { href: '/portal/admin/faktury',    label: 'Faktury', icon: Receipt },
  { href: '/portal/admin/statistiky', label: 'Stats',   icon: Sparkles },
];

export default function MobileBottomNav() {
  const { profile } = useAuth();
  const pathname = usePathname() ?? '';
  const items = profile.role === 'klient' ? clientItems : profile.role === 'admin' ? adminItems : crmItems;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-coffee border-t border-tobacco z-30">
      <ul className="flex">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== '/portal/dashboard' && item.href !== '/portal/crm/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1 min-w-0">
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-1 py-3 text-[9px] font-mono uppercase tracking-widest transition-colors ${
                  active ? 'text-caramel' : 'text-sandstone hover:text-moonlight'
                }`}
              >
                <Icon size={18} />
                <span className="truncate max-w-full px-1">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
