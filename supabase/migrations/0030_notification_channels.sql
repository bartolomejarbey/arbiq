-- ============================================================================
-- 0030: notifikační kanály — SMS + per-typ preference.
-- ----------------------------------------------------------------------------
-- profiles.email_notifications_enabled už existuje (0001). Přidáme master
-- přepínač pro SMS. Per-typ jemné nastavení žije v notification_prefs:
-- pokud existuje řádek (user_id, type), má přednost; jinak se použije
-- master přepínač profilu pro daný kanál.
-- ============================================================================

alter table public.profiles
  add column if not exists sms_notifications_enabled boolean not null default false;

create table if not exists public.notification_prefs (
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,                 -- např. 'invoice_due', 'new_message', 'deadline'
  email boolean not null default true,
  sms boolean not null default false,
  inapp boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, type)
);

drop trigger if exists notification_prefs_updated on public.notification_prefs;
create trigger notification_prefs_updated
  before update on public.notification_prefs
  for each row execute function public.set_updated_at();

alter table public.notification_prefs enable row level security;

drop policy if exists "notif_prefs: self read" on public.notification_prefs;
create policy "notif_prefs: self read" on public.notification_prefs for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "notif_prefs: self write" on public.notification_prefs;
create policy "notif_prefs: self write" on public.notification_prefs for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "notif_prefs: admin read" on public.notification_prefs;
create policy "notif_prefs: admin read" on public.notification_prefs for select to authenticated
  using (public.is_admin());
