-- ============================================================================
-- 0004: databaze_kontaktu — pre-CRM seznam (LinkedIn / Firmy.cz / cold outreach)
-- ============================================================================
-- Tito kontakti NEJSOU leady — jsou to "potenciální leady". Když jim obchodník
-- zavolá / napíše a zjistí zájem → "Importovat jako lead" → vytvoří záznam
-- v landing_leads s source_tag='imported_db'.
-- ============================================================================

create table public.databaze_kontaktu (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  full_name text not null,
  email text,
  phone text,
  company text,
  position text,
  ico text,

  industry text,
  source text,        -- LinkedIn, Firmy.cz, manualne, scrape, atd.
  notes text,

  contacted boolean not null default false,
  contacted_at timestamptz,
  contacted_by uuid references public.profiles(id),

  outcome text
    check (outcome in ('nezvedl','nezajem','zajem','pozdeji','spam','imported_to_leads')),
  outcome_at timestamptz,

  imported_to_leads boolean not null default false,
  imported_lead_id uuid references public.landing_leads(id),

  assigned_to uuid references public.profiles(id)
);

create index databaze_kontaktu_assigned_idx on public.databaze_kontaktu(assigned_to);
create index databaze_kontaktu_outcome_idx on public.databaze_kontaktu(outcome);
create index databaze_kontaktu_industry_idx on public.databaze_kontaktu(industry);
create index databaze_kontaktu_email_idx on public.databaze_kontaktu(lower(email));
create index databaze_kontaktu_imported_idx on public.databaze_kontaktu(imported_to_leads);

create trigger databaze_kontaktu_updated
  before update on public.databaze_kontaktu
  for each row execute function public.set_updated_at();

alter table public.databaze_kontaktu enable row level security;

-- Obchodnik vidí svoje kontakty + nepřiřazené (může si vzít).
-- Admin vidí vše.
-- Klient nemá přístup vůbec.
create policy "databaze select"
  on public.databaze_kontaktu for select
  using (
    public.is_admin()
    or (public.is_obchodnik_or_admin() and (assigned_to = auth.uid() or assigned_to is null))
  );

create policy "databaze insert"
  on public.databaze_kontaktu for insert
  with check (public.is_obchodnik_or_admin());

create policy "databaze update"
  on public.databaze_kontaktu for update
  using (
    public.is_admin()
    or (public.is_obchodnik_or_admin() and (assigned_to = auth.uid() or assigned_to is null))
  )
  with check (public.is_obchodnik_or_admin());

create policy "databaze delete admin only"
  on public.databaze_kontaktu for delete
  using (public.is_admin());
