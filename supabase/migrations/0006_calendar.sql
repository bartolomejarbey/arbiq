-- ============================================================================
-- 0006: Google Calendar integration
-- ============================================================================
-- Tabulky pro per-user Google Calendar OAuth tokens + lokální mirror events
-- + audit log sync operací. RLS na všech třech.

create extension if not exists pgcrypto;

-- ============================================================================
-- TABLE: google_oauth_connections
-- ============================================================================
create table public.google_oauth_connections (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- OAuth tokens (refresh_token vždy šifrovaný)
  encrypted_refresh_token text not null,
  access_token text,
  access_token_expires_at timestamptz,

  -- Calendar config
  google_user_email text not null,
  calendar_id text not null default 'primary',

  -- Incremental sync state
  sync_token text,
  last_sync_at timestamptz,

  -- Watch (push notifications) channel
  watch_channel_id text,
  watch_resource_id text,
  watch_expires_at timestamptz,

  -- Connection state
  status text not null default 'connected'
    check (status in ('connected','revoked','error')),
  last_error text
);

create trigger google_oauth_connections_updated
  before update on public.google_oauth_connections
  for each row execute function public.set_updated_at();

alter table public.google_oauth_connections enable row level security;

create policy "OAuth: select own or admin"
  on public.google_oauth_connections for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "OAuth: insert own"
  on public.google_oauth_connections for insert to authenticated
  with check (user_id = auth.uid());

create policy "OAuth: update own"
  on public.google_oauth_connections for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "OAuth: delete own"
  on public.google_oauth_connections for delete to authenticated
  using (user_id = auth.uid());

-- ============================================================================
-- TABLE: events
-- ============================================================================
create table public.events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  owner_id uuid not null references public.profiles(id) on delete cascade,

  -- Google sync handles
  google_event_id text,
  google_calendar_id text default 'primary',
  etag text,

  -- Obsah
  title text not null check (length(title) between 1 and 1024),
  description text,
  location text,

  -- Čas
  start_at timestamptz not null,
  end_at timestamptz not null,
  all_day boolean not null default false,
  timezone text not null default 'Europe/Prague',
  check (end_at > start_at),

  -- Visibility a sdílení
  visibility text not null default 'private'
    check (visibility in ('private','shared')),
  attendees jsonb not null default '[]'::jsonb,

  -- Google Meet
  meet_link text,
  conference_data jsonb,

  -- CRM linky (max jeden)
  lead_id uuid references public.landing_leads(id) on delete set null,
  client_id uuid references public.profiles(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  check (
    (lead_id is not null)::int +
    (client_id is not null)::int +
    (project_id is not null)::int <= 1
  ),

  -- Sync state
  sync_status text not null default 'pending'
    check (sync_status in ('pending','synced','error')),
  sync_error text,
  last_synced_at timestamptz,

  -- Soft delete
  deleted_at timestamptz,

  unique (owner_id, google_event_id)
);

create index events_owner_start_idx on public.events(owner_id, start_at);
create index events_start_idx on public.events(start_at) where deleted_at is null;
create index events_sync_pending_idx on public.events(sync_status) where sync_status in ('pending','error');
create index events_lead_idx on public.events(lead_id) where lead_id is not null;
create index events_client_idx on public.events(client_id) where client_id is not null;
create index events_project_idx on public.events(project_id) where project_id is not null;

create trigger events_updated
  before update on public.events
  for each row execute function public.set_updated_at();

alter table public.events enable row level security;

create policy "Events: select"
  on public.events for select to authenticated
  using (
    deleted_at is null and (
      owner_id = auth.uid()
      or public.is_admin()
      or (visibility = 'shared' and public.is_obchodnik_or_admin())
    )
  );

create policy "Events: insert own"
  on public.events for insert to authenticated
  with check (owner_id = auth.uid() and public.is_obchodnik_or_admin());

create policy "Events: update own"
  on public.events for update to authenticated
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

create policy "Events: delete own"
  on public.events for delete to authenticated
  using (owner_id = auth.uid() or public.is_admin());

-- ============================================================================
-- TABLE: event_sync_log
-- ============================================================================
create table public.event_sync_log (
  id bigserial primary key,
  occurred_at timestamptz not null default now(),
  user_id uuid references public.profiles(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  direction text not null check (direction in ('outbound','inbound')),
  action text not null check (action in ('insert','update','delete','watch_renew','full_resync')),
  status text not null check (status in ('ok','error','retry')),
  error text,
  request_payload jsonb,
  response_payload jsonb
);

create index event_sync_log_user_time_idx on public.event_sync_log(user_id, occurred_at desc);
create index event_sync_log_event_idx on public.event_sync_log(event_id, occurred_at desc) where event_id is not null;

alter table public.event_sync_log enable row level security;

create policy "SyncLog: select own or admin"
  on public.event_sync_log for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ============================================================================
-- pgcrypto helpers pro refresh_token (klíč předáván per call, ne přes setting)
-- ============================================================================
-- Combined RPC variants jsou bezpečnější než set_config approach,
-- protože Supabase RPC volání nesdílejí transaction.
-- pgcrypto v Supabase žije v `extensions` schématu — proto prefix.
create or replace function public.encrypt_with_key(token text, key text)
returns text language sql security definer
set search_path = public, extensions, pg_temp
as $$
  select encode(extensions.pgp_sym_encrypt(token, key), 'base64');
$$;

create or replace function public.decrypt_with_key(encrypted text, key text)
returns text language sql security definer
set search_path = public, extensions, pg_temp
as $$
  select extensions.pgp_sym_decrypt(decode(encrypted, 'base64'), key);
$$;

revoke all on function public.encrypt_with_key(text, text) from public;
revoke all on function public.decrypt_with_key(text, text) from public;
grant execute on function public.encrypt_with_key(text, text) to service_role;
grant execute on function public.decrypt_with_key(text, text) to service_role;
