-- ============================================================================
-- ARBIQ portal / CRM / admin -- initial schema
-- ============================================================================
-- Conventions:
--   * All tables in `public` schema unless noted.
--   * RLS is enabled on every table.
--   * Helper functions (is_admin, is_obchodnik_or_admin, is_my_client) are
--     SECURITY DEFINER so they bypass RLS when checking the caller's role --
--     this prevents infinite recursion in profile policies.
--   * Czech enum values are kept (status: 'novy', 'v_priprave', ...) per spec.
-- ============================================================================

create extension if not exists pgcrypto;

-- ============================================================================
-- SHARED TRIGGER FUNCTIONS
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- TABLE: profiles  (extends auth.users)
-- ============================================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  full_name text not null,
  email text not null,
  phone text,
  company text,
  ico text,
  website_url text,
  role text not null default 'klient'
    check (role in ('klient', 'obchodnik', 'admin')),
  assigned_obchodnik uuid references public.profiles(id),
  avatar_url text,
  is_active boolean not null default true,
  email_notifications_enabled boolean not null default true
);

create trigger profiles_updated
  before update on public.profiles
  for each row execute function public.set_updated_at();

create index profiles_role_idx on public.profiles(role);
create index profiles_assigned_obchodnik_idx on public.profiles(assigned_obchodnik);

-- ============================================================================
-- TABLE: landing_leads
-- ============================================================================
create table public.landing_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kampan text not null,
  obor text,
  velikost_firmy text,
  step3_odpoved text,
  name text not null,
  email text not null,
  phone text,
  website_url text,
  popis text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  status text not null default 'new'
    check (status in ('new','contacted','qualified','unqualified','converted','lost')),
  pipeline_stage text not null default 'novy_lead',
  case_number text unique,
  assigned_to uuid references public.profiles(id),
  converted_to_client uuid references public.profiles(id),
  notes text
);

create index landing_leads_status_idx on public.landing_leads(status);
create index landing_leads_pipeline_idx on public.landing_leads(pipeline_stage);
create index landing_leads_assigned_idx on public.landing_leads(assigned_to);
create index landing_leads_kampan_idx on public.landing_leads(kampan);
create index landing_leads_created_idx on public.landing_leads(created_at desc);

-- ============================================================================
-- TABLE: rentgen_orders
-- ============================================================================
create table public.rentgen_orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  phone text,
  company text,
  website_url text not null,
  problem_description text,
  status text not null default 'new'
    check (status in ('new','paid','in_progress','delivered','cancelled')),
  paid_at timestamptz,
  delivered_at timestamptz,
  assigned_to uuid references public.profiles(id),
  utm_source text,
  utm_medium text,
  utm_campaign text
);

create index rentgen_status_idx on public.rentgen_orders(status);
create index rentgen_created_idx on public.rentgen_orders(created_at desc);

-- ============================================================================
-- TABLE: contact_messages
-- ============================================================================
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  phone text,
  message text not null,
  type text not null default 'general'
    check (type in ('general','project','consultation','product')),
  status text not null default 'new'
    check (status in ('new','replied','archived'))
);

create index contact_status_idx on public.contact_messages(status);

-- ============================================================================
-- TABLE: projects
-- ============================================================================
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  client_id uuid not null references public.profiles(id) on delete restrict,
  obchodnik_id uuid references public.profiles(id),
  name text not null,
  description text,
  status text not null default 'novy'
    check (status in ('novy','v_priprave','ve_vyvoji','k_revizi','dokoncen','pozastaven','zruseny')),
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  start_date date,
  estimated_end_date date,
  actual_end_date date,
  total_value numeric(10,2),
  notes text
);

create trigger projects_updated
  before update on public.projects
  for each row execute function public.set_updated_at();

create index projects_client_idx on public.projects(client_id);
create index projects_obchodnik_idx on public.projects(obchodnik_id);
create index projects_status_idx on public.projects(status);

-- ============================================================================
-- TABLE: milestones
-- ============================================================================
create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  name text not null,
  description text,
  status text not null default 'ceka'
    check (status in ('ceka','aktivni','dokoncen','preskocen')),
  due_date date,
  completed_at timestamptz,
  sort_order integer not null default 0
);

create index milestones_project_idx on public.milestones(project_id, sort_order);

-- ============================================================================
-- TABLE: invoices
-- ============================================================================
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  client_id uuid not null references public.profiles(id) on delete restrict,
  project_id uuid references public.projects(id) on delete set null,
  invoice_number text not null unique,
  amount numeric(10,2) not null,
  description text,
  issued_at date not null default current_date,
  due_date date not null,
  paid_at date,
  status text not null default 'ceka'
    check (status in ('ceka','zaplaceno','po_splatnosti','zruseno')),
  pdf_url text
);

create index invoices_client_idx on public.invoices(client_id);
create index invoices_status_idx on public.invoices(status);
create index invoices_due_idx on public.invoices(due_date);

-- ============================================================================
-- TABLE: documents
-- ============================================================================
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  project_id uuid not null references public.projects(id) on delete cascade,
  uploaded_by uuid references public.profiles(id),
  name text not null,
  type text not null default 'other'
    check (type in ('brief','nabidka','smlouva','faktura','design','screenshot','report','other')),
  file_path text not null,
  file_size integer
);

create index documents_project_idx on public.documents(project_id);

-- ============================================================================
-- TABLE: messages
-- ============================================================================
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  project_id uuid not null references public.projects(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  content text not null,
  is_internal boolean not null default false,
  read_at timestamptz
);

create index messages_project_created_idx on public.messages(project_id, created_at);

-- ============================================================================
-- TABLE: recommendations
-- ============================================================================
create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  service_name text not null,
  description text not null,
  estimated_price text,
  status text not null default 'nova'
    check (status in ('nova','zobrazena','zajem','odmitnuta','realizovana')),
  interested_at timestamptz
);

create index recommendations_client_idx on public.recommendations(client_id);

-- ============================================================================
-- TABLE: crm_contacts
-- ============================================================================
create table public.crm_contacts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  obchodnik_id uuid not null references public.profiles(id),
  type text not null
    check (type in ('telefon','email','schuzka','zprava','jine')),
  note text not null,
  next_followup date
);

create index crm_contacts_client_idx on public.crm_contacts(client_id, created_at desc);

-- ============================================================================
-- TABLE: crm_tasks
-- ============================================================================
create table public.crm_tasks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  assigned_to uuid not null references public.profiles(id),
  client_id uuid references public.profiles(id) on delete cascade,
  lead_id uuid references public.landing_leads(id) on delete cascade,
  title text not null,
  description text,
  priority text not null default 'normal'
    check (priority in ('low','normal','high','urgent')),
  status text not null default 'todo'
    check (status in ('todo','in_progress','done','cancelled')),
  due_date date,
  completed_at timestamptz
);

create index crm_tasks_assignee_status_idx on public.crm_tasks(assigned_to, status);
create index crm_tasks_due_idx on public.crm_tasks(due_date);

-- ============================================================================
-- TABLE: metrics
-- ============================================================================
create table public.metrics (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  recorded_for date not null,
  metric text not null
    check (metric in ('navstevnost','konverze','leady','roi','custom')),
  metric_label text,
  value numeric not null,
  unique (client_id, recorded_for, metric, metric_label)
);

create index metrics_client_date_idx on public.metrics(client_id, recorded_for desc);

-- ============================================================================
-- TABLE: app_settings
-- ============================================================================
create table public.app_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

create trigger app_settings_updated
  before update on public.app_settings
  for each row execute function public.set_updated_at();

-- ============================================================================
-- SEQUENCES & GENERATORS
-- ============================================================================
create sequence public.lead_seq start 1;

create or replace function public.next_case_number()
returns text language plpgsql as $$
declare yr text := to_char(now(), 'YYYY'); n bigint;
begin
  n := nextval('public.lead_seq');
  return 'LEAD-' || yr || '-' || lpad(n::text, 5, '0');
end;
$$;

create sequence public.invoice_seq start 1;

create or replace function public.next_invoice_number()
returns text language plpgsql as $$
declare yr text := to_char(now(), 'YYYY'); n bigint;
begin
  n := nextval('public.invoice_seq');
  return 'F' || yr || lpad(n::text, 5, '0');
end;
$$;

-- ============================================================================
-- RLS HELPER FUNCTIONS  (SECURITY DEFINER -> bypass RLS internally)
-- ============================================================================
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_active = true
  )
$$;

create or replace function public.is_obchodnik_or_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('obchodnik','admin') and is_active = true
  )
$$;

create or replace function public.is_my_client(client uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles c
    where c.id = client
      and (
        c.assigned_obchodnik = auth.uid()
        or exists (
          select 1 from public.profiles me
          where me.id = auth.uid() and me.role = 'admin' and me.is_active
        )
      )
  )
$$;

-- ============================================================================
-- TRIGGER: auto-create profile on new auth.users insert
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'klient')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- TRIGGER: auto-create CRM task for new landing lead
-- ============================================================================
create or replace function public.create_task_for_new_lead()
returns trigger language plpgsql security definer set search_path = public as $$
declare assignee uuid;
begin
  begin
    select nullif(value,'')::uuid into assignee
    from public.app_settings where key = 'default_lead_assignee';
  exception when others then assignee := null; end;

  if assignee is null then
    select id into assignee
    from public.profiles
    where role = 'admin' and is_active = true
    order by created_at asc limit 1;
  end if;

  if assignee is null then return new; end if;

  insert into public.crm_tasks (assigned_to, lead_id, title, priority, due_date)
  values (
    assignee, new.id,
    'Kontaktovat ' || new.name || ' do 24h',
    'high',
    (current_date + interval '1 day')::date
  );
  return new;
end;
$$;

create trigger landing_leads_create_task
  after insert on public.landing_leads
  for each row execute function public.create_task_for_new_lead();

-- ============================================================================
-- TRIGGER: auto-create CRM task for new rentgen order
-- ============================================================================
create or replace function public.create_task_for_new_rentgen()
returns trigger language plpgsql security definer set search_path = public as $$
declare assignee uuid;
begin
  begin
    select nullif(value,'')::uuid into assignee
    from public.app_settings where key = 'default_lead_assignee';
  exception when others then assignee := null; end;

  if assignee is null then
    select id into assignee
    from public.profiles
    where role = 'admin' and is_active = true
    order by created_at asc limit 1;
  end if;

  if assignee is null then return new; end if;

  insert into public.crm_tasks (assigned_to, title, priority, due_date)
  values (
    assignee,
    'Zpracovat Rentgen pro ' || new.name,
    'high',
    (current_date + interval '1 day')::date
  );
  return new;
end;
$$;

create trigger rentgen_orders_create_task
  after insert on public.rentgen_orders
  for each row execute function public.create_task_for_new_rentgen();

-- ============================================================================
-- RPC: klient marks recommendation as 'zajem'
-- ============================================================================
create or replace function public.mark_recommendation_interested(rec_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare rec record; obchodnik uuid;
begin
  select r.id, r.client_id, r.status, r.service_name, p.assigned_obchodnik as ass
    into rec
  from public.recommendations r
  join public.profiles p on p.id = r.client_id
  where r.id = rec_id and r.client_id = auth.uid();

  if not found then raise exception 'Recommendation not found'; end if;
  if rec.status not in ('nova','zobrazena') then
    raise exception 'Recommendation already actioned';
  end if;

  update public.recommendations
    set status = 'zajem', interested_at = now()
    where id = rec_id;

  obchodnik := rec.ass;
  if obchodnik is null then
    select id into obchodnik
    from public.profiles
    where role = 'admin' and is_active = true
    order by created_at asc limit 1;
  end if;

  if obchodnik is not null then
    insert into public.crm_tasks (assigned_to, client_id, title, priority, due_date)
    values (
      obchodnik, rec.client_id,
      'Klient ma zajem o: ' || rec.service_name,
      'high',
      (current_date + interval '2 days')::date
    );
  end if;
end;
$$;

revoke execute on function public.mark_recommendation_interested(uuid) from public;
grant  execute on function public.mark_recommendation_interested(uuid) to authenticated;

create or replace function public.dismiss_recommendation(rec_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.recommendations
  set status = 'odmitnuta'
  where id = rec_id and client_id = auth.uid()
    and status in ('nova','zobrazena');
  if not found then raise exception 'Recommendation not found or already actioned'; end if;
end;
$$;

revoke execute on function public.dismiss_recommendation(uuid) from public;
grant  execute on function public.dismiss_recommendation(uuid) to authenticated;

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================
alter table public.profiles            enable row level security;
alter table public.landing_leads       enable row level security;
alter table public.rentgen_orders      enable row level security;
alter table public.contact_messages    enable row level security;
alter table public.projects            enable row level security;
alter table public.milestones          enable row level security;
alter table public.invoices            enable row level security;
alter table public.documents           enable row level security;
alter table public.messages            enable row level security;
alter table public.recommendations     enable row level security;
alter table public.crm_contacts        enable row level security;
alter table public.crm_tasks           enable row level security;
alter table public.metrics             enable row level security;
alter table public.app_settings        enable row level security;

-- ============================================================================
-- POLICIES: profiles
-- ============================================================================
create policy "Profiles: self read" on public.profiles for select to authenticated
  using (id = auth.uid());
create policy "Profiles: obchodnik reads own clients" on public.profiles for select to authenticated
  using (assigned_obchodnik = auth.uid());
create policy "Profiles: admin reads all" on public.profiles for select to authenticated
  using (public.is_admin());
create policy "Profiles: self update" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy "Profiles: admin update all" on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
-- INSERT/DELETE only via service-role (admin client)

-- ============================================================================
-- POLICIES: landing_leads
-- ============================================================================
create policy "Leads: anon insert" on public.landing_leads for insert to anon with check (true);
create policy "Leads: auth insert" on public.landing_leads for insert to authenticated with check (true);
create policy "Leads: obchodnik+admin read" on public.landing_leads for select to authenticated
  using (public.is_obchodnik_or_admin());
create policy "Leads: obchodnik+admin update" on public.landing_leads for update to authenticated
  using (public.is_obchodnik_or_admin()) with check (public.is_obchodnik_or_admin());
create policy "Leads: admin delete" on public.landing_leads for delete to authenticated
  using (public.is_admin());

-- ============================================================================
-- POLICIES: rentgen_orders
-- ============================================================================
create policy "Rentgen: anon insert" on public.rentgen_orders for insert to anon with check (true);
create policy "Rentgen: auth insert" on public.rentgen_orders for insert to authenticated with check (true);
create policy "Rentgen: obchodnik+admin read" on public.rentgen_orders for select to authenticated
  using (public.is_obchodnik_or_admin());
create policy "Rentgen: obchodnik+admin update" on public.rentgen_orders for update to authenticated
  using (public.is_obchodnik_or_admin()) with check (public.is_obchodnik_or_admin());
create policy "Rentgen: admin delete" on public.rentgen_orders for delete to authenticated
  using (public.is_admin());

-- ============================================================================
-- POLICIES: contact_messages
-- ============================================================================
create policy "Contact: anon insert" on public.contact_messages for insert to anon with check (true);
create policy "Contact: auth insert" on public.contact_messages for insert to authenticated with check (true);
create policy "Contact: obchodnik+admin read" on public.contact_messages for select to authenticated
  using (public.is_obchodnik_or_admin());
create policy "Contact: obchodnik+admin update" on public.contact_messages for update to authenticated
  using (public.is_obchodnik_or_admin()) with check (public.is_obchodnik_or_admin());
create policy "Contact: admin delete" on public.contact_messages for delete to authenticated
  using (public.is_admin());

-- ============================================================================
-- POLICIES: projects
-- ============================================================================
create policy "Projects: client reads own" on public.projects for select to authenticated
  using (client_id = auth.uid());
create policy "Projects: obchodnik reads assigned" on public.projects for select to authenticated
  using (obchodnik_id = auth.uid() or public.is_my_client(client_id));
create policy "Projects: admin reads all" on public.projects for select to authenticated
  using (public.is_admin());
create policy "Projects: obchodnik+admin write" on public.projects for all to authenticated
  using (public.is_obchodnik_or_admin()) with check (public.is_obchodnik_or_admin());

-- ============================================================================
-- POLICIES: milestones
-- ============================================================================
create policy "Milestones: read via project" on public.milestones for select to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = milestones.project_id
        and (
          p.client_id = auth.uid()
          or p.obchodnik_id = auth.uid()
          or public.is_admin()
          or public.is_my_client(p.client_id)
        )
    )
  );
create policy "Milestones: obchodnik+admin write" on public.milestones for all to authenticated
  using (public.is_obchodnik_or_admin()) with check (public.is_obchodnik_or_admin());

-- ============================================================================
-- POLICIES: invoices
-- ============================================================================
create policy "Invoices: client reads own" on public.invoices for select to authenticated
  using (client_id = auth.uid());
create policy "Invoices: obchodnik reads own clients" on public.invoices for select to authenticated
  using (public.is_my_client(client_id));
create policy "Invoices: admin reads all" on public.invoices for select to authenticated
  using (public.is_admin());
create policy "Invoices: admin write" on public.invoices for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- POLICIES: documents
-- ============================================================================
create policy "Documents: read via project" on public.documents for select to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = documents.project_id
        and (
          p.client_id = auth.uid()
          or p.obchodnik_id = auth.uid()
          or public.is_admin()
          or public.is_my_client(p.client_id)
        )
    )
  );
create policy "Documents: obchodnik+admin write" on public.documents for all to authenticated
  using (public.is_obchodnik_or_admin()) with check (public.is_obchodnik_or_admin());

-- ============================================================================
-- POLICIES: messages
-- ============================================================================
create policy "Messages: client reads non-internal of own project"
  on public.messages for select to authenticated
  using (
    not is_internal
    and exists (
      select 1 from public.projects p
      where p.id = messages.project_id and p.client_id = auth.uid()
    )
  );
create policy "Messages: obchodnik+admin reads all"
  on public.messages for select to authenticated
  using (public.is_obchodnik_or_admin());
create policy "Messages: client inserts non-internal of own project"
  on public.messages for insert to authenticated
  with check (
    author_id = auth.uid()
    and not is_internal
    and exists (
      select 1 from public.projects p
      where p.id = messages.project_id and p.client_id = auth.uid()
    )
  );
create policy "Messages: obchodnik+admin inserts"
  on public.messages for insert to authenticated
  with check (author_id = auth.uid() and public.is_obchodnik_or_admin());
create policy "Messages: admin update"
  on public.messages for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- POLICIES: recommendations
-- ============================================================================
create policy "Recommendations: client reads own (visible)"
  on public.recommendations for select to authenticated
  using (client_id = auth.uid() and status != 'nova');
create policy "Recommendations: obchodnik+admin reads all"
  on public.recommendations for select to authenticated
  using (public.is_obchodnik_or_admin());
create policy "Recommendations: admin write"
  on public.recommendations for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
-- Klient changes status only via mark_recommendation_interested() RPC.

-- ============================================================================
-- POLICIES: crm_contacts
-- ============================================================================
create policy "CRMContacts: obchodnik reads own" on public.crm_contacts for select to authenticated
  using (obchodnik_id = auth.uid());
create policy "CRMContacts: admin reads all" on public.crm_contacts for select to authenticated
  using (public.is_admin());
create policy "CRMContacts: obchodnik+admin write" on public.crm_contacts for all to authenticated
  using (public.is_obchodnik_or_admin())
  with check (public.is_obchodnik_or_admin() and obchodnik_id = auth.uid());

-- ============================================================================
-- POLICIES: crm_tasks
-- ============================================================================
create policy "CRMTasks: obchodnik reads own" on public.crm_tasks for select to authenticated
  using (assigned_to = auth.uid());
create policy "CRMTasks: admin reads all" on public.crm_tasks for select to authenticated
  using (public.is_admin());
create policy "CRMTasks: obchodnik+admin write" on public.crm_tasks for all to authenticated
  using (public.is_obchodnik_or_admin()) with check (public.is_obchodnik_or_admin());

-- ============================================================================
-- POLICIES: metrics
-- ============================================================================
create policy "Metrics: client reads own" on public.metrics for select to authenticated
  using (client_id = auth.uid());
create policy "Metrics: obchodnik reads own clients" on public.metrics for select to authenticated
  using (public.is_my_client(client_id));
create policy "Metrics: admin reads all" on public.metrics for select to authenticated
  using (public.is_admin());
create policy "Metrics: obchodnik+admin write" on public.metrics for all to authenticated
  using (public.is_obchodnik_or_admin()) with check (public.is_obchodnik_or_admin());

-- ============================================================================
-- POLICIES: app_settings
-- ============================================================================
create policy "AppSettings: admin only" on public.app_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- STORAGE: documents bucket (private)
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Klient never reads storage.objects directly. Server hands them
-- short-lived signed URLs from server code instead.
create policy "DocumentsBucket: obchodnik+admin manage"
  on storage.objects for all to authenticated
  using (bucket_id = 'documents' and public.is_obchodnik_or_admin())
  with check (bucket_id = 'documents' and public.is_obchodnik_or_admin());

-- ============================================================================
-- SEED
-- ============================================================================
insert into public.app_settings (key, value) values
  ('default_lead_assignee', null),
  ('app_url',               'http://localhost:3000')
on conflict (key) do nothing;
