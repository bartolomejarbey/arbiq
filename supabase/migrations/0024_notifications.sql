-- ============================================================================
-- 0024: in-app notifikace
-- ============================================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications(user_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications(user_id) where read_at is null;

alter table public.notifications enable row level security;
drop policy if exists "notifications: self read" on public.notifications;
create policy "notifications: self read" on public.notifications for select to authenticated
  using (user_id = auth.uid());
-- Zápis (insert) i mark-read běží přes service role (createAdminClient), scopováno v kódu.
