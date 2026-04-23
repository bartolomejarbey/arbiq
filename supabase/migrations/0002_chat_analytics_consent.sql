-- ============================================================================
-- ARBIQ — round 2: chat, analytics, cookie consent + onboarding columns
-- ============================================================================

-- ============================================================================
-- 1) ONBOARDING extensions to landing_leads
-- ============================================================================
alter table public.landing_leads
  add column if not exists wants jsonb default '[]'::jsonb,
  add column if not exists budget text;

create index if not exists landing_leads_budget_idx on public.landing_leads(budget) where budget is not null;

-- ============================================================================
-- 2) CHAT SESSIONS + MESSAGES (AI assistant)
-- ============================================================================
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  visitor_id text,
  page_path text,
  user_agent text,
  ip_hash text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  started_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  message_count integer not null default 0,
  converted_at timestamptz,
  conversion_kind text check (conversion_kind in ('rentgen','kontakt','pripad','none'))
);

create index if not exists chat_sessions_started_idx on public.chat_sessions(started_at desc);
create index if not exists chat_sessions_visitor_idx on public.chat_sessions(visitor_id);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  tokens_in integer,
  tokens_out integer,
  model text,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_session_idx on public.chat_messages(session_id, created_at);

-- ============================================================================
-- 3) ANALYTICS EVENTS (lightweight pageview + click tracker)
-- ============================================================================
create table if not exists public.analytics_events (
  id bigserial primary key,
  visitor_id text,
  session_id text,
  event text not null,
  page text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  user_agent text,
  ip_hash text,
  props jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_event_idx on public.analytics_events(event);
create index if not exists analytics_events_page_idx on public.analytics_events(page);
create index if not exists analytics_events_created_idx on public.analytics_events(created_at desc);
create index if not exists analytics_events_visitor_idx on public.analytics_events(visitor_id);

-- ============================================================================
-- 4) COOKIE CONSENT LOG (GDPR audit trail)
-- ============================================================================
create table if not exists public.cookie_consent_log (
  id bigserial primary key,
  anon_id text not null,
  ip_hash text,
  user_agent text,
  necessary boolean not null default true,
  analytics boolean not null default false,
  marketing boolean not null default false,
  source text,  -- 'banner_accept_all', 'banner_necessary', 'banner_custom', 'portal_settings'
  created_at timestamptz not null default now()
);

create index if not exists cookie_consent_anon_idx on public.cookie_consent_log(anon_id);
create index if not exists cookie_consent_created_idx on public.cookie_consent_log(created_at desc);

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.chat_sessions       enable row level security;
alter table public.chat_messages       enable row level security;
alter table public.analytics_events    enable row level security;
alter table public.cookie_consent_log  enable row level security;

-- chat_sessions: anon insert (start session), admin read
create policy "ChatSessions: anon insert" on public.chat_sessions for insert to anon with check (true);
create policy "ChatSessions: anon update last_message" on public.chat_sessions for update to anon
  using (true) with check (true);
create policy "ChatSessions: auth insert" on public.chat_sessions for insert to authenticated with check (true);
create policy "ChatSessions: auth update" on public.chat_sessions for update to authenticated using (true) with check (true);
create policy "ChatSessions: admin read" on public.chat_sessions for select to authenticated
  using (public.is_admin());

-- chat_messages: anon insert, admin read
create policy "ChatMessages: anon insert" on public.chat_messages for insert to anon with check (true);
create policy "ChatMessages: auth insert" on public.chat_messages for insert to authenticated with check (true);
create policy "ChatMessages: admin read" on public.chat_messages for select to authenticated
  using (public.is_admin());

-- analytics_events: anon insert (web tracking), admin read
create policy "Analytics: anon insert" on public.analytics_events for insert to anon with check (true);
create policy "Analytics: auth insert" on public.analytics_events for insert to authenticated with check (true);
create policy "Analytics: admin read" on public.analytics_events for select to authenticated
  using (public.is_admin());

-- cookie_consent_log: anon insert, admin read
create policy "Consent: anon insert" on public.cookie_consent_log for insert to anon with check (true);
create policy "Consent: auth insert" on public.cookie_consent_log for insert to authenticated with check (true);
create policy "Consent: admin read" on public.cookie_consent_log for select to authenticated
  using (public.is_admin());

-- ============================================================================
-- HELPER: increment message_count atomically
-- ============================================================================
create or replace function public.bump_chat_session(s_id uuid)
returns void language sql as $$
  update public.chat_sessions
  set last_message_at = now(),
      message_count = message_count + 1
  where id = s_id;
$$;

grant execute on function public.bump_chat_session(uuid) to anon, authenticated;
