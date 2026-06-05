-- ============================================================================
-- 0028: firmy — samostatná entita FIRMA (odběratel). 1 klient(osoba) → N firem.
-- ----------------------------------------------------------------------------
-- Model: profiles = OSOBA (klient: jméno, e-mail, telefon, login).
--        firmy    = FIRMA (fakturační identita: název, IČO, DIČ, adresa, e-maily).
-- Faktury/smlouvy/nabídky/projekty dostanou firma_id (koho fakturuju) vedle
-- existujícího client_id (osoba). firma_id je NULLABLE — historická data a
-- jednorázové faktury (customer_override) firmu nemají.
--
-- Migrace je ADITIVNÍ a IDEMPOTENTNÍ: nic nemaže, lze spustit opakovaně.
-- Staré sloupce profiles.company/ico/dic/... a parent_client_id ZŮSTÁVAJÍ.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLE: firmy
-- ----------------------------------------------------------------------------
create table if not exists public.firmy (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  nazev text not null,
  ico text,
  dic text,
  street text,
  city text,
  zip text,
  country text not null default 'CZ',
  billing_email text,
  contract_email text,
  representative_name text,
  phone text,
  website_url text,
  is_primary boolean not null default false,
  archived_at timestamptz,
  notes text
);

drop trigger if exists firmy_updated on public.firmy;
create trigger firmy_updated
  before update on public.firmy
  for each row execute function public.set_updated_at();

create index if not exists firmy_client_idx on public.firmy(client_id);
create index if not exists firmy_ico_idx on public.firmy(ico);
-- Max jedna primární firma na klienta.
create unique index if not exists firmy_one_primary_per_client
  on public.firmy(client_id) where is_primary;

-- ----------------------------------------------------------------------------
-- RLS HELPER: is_my_firma
-- ----------------------------------------------------------------------------
create or replace function public.is_my_firma(firma uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.firmy f
    where f.id = firma
      and (
        f.client_id = auth.uid()
        or public.is_my_client(f.client_id)
        or public.is_admin()
      )
  )
$$;

-- ----------------------------------------------------------------------------
-- RLS: firmy  (stejný vzor jako invoices/projects)
-- ----------------------------------------------------------------------------
alter table public.firmy enable row level security;

drop policy if exists "Firmy: client reads own" on public.firmy;
create policy "Firmy: client reads own" on public.firmy for select to authenticated
  using (client_id = auth.uid());

drop policy if exists "Firmy: obchodnik reads own clients" on public.firmy;
create policy "Firmy: obchodnik reads own clients" on public.firmy for select to authenticated
  using (public.is_my_client(client_id));

drop policy if exists "Firmy: admin reads all" on public.firmy;
create policy "Firmy: admin reads all" on public.firmy for select to authenticated
  using (public.is_admin());

drop policy if exists "Firmy: obchodnik+admin write" on public.firmy;
create policy "Firmy: obchodnik+admin write" on public.firmy for all to authenticated
  using (public.is_obchodnik_or_admin()) with check (public.is_obchodnik_or_admin());

-- ----------------------------------------------------------------------------
-- firma_id na dokladech (nullable, on delete set null — doklad nezmizí)
-- ----------------------------------------------------------------------------
alter table public.invoices  add column if not exists firma_id uuid references public.firmy(id) on delete set null;
alter table public.contracts add column if not exists firma_id uuid references public.firmy(id) on delete set null;
alter table public.quotes    add column if not exists firma_id uuid references public.firmy(id) on delete set null;
alter table public.projects  add column if not exists firma_id uuid references public.firmy(id) on delete set null;

create index if not exists invoices_firma_idx  on public.invoices(firma_id);
create index if not exists contracts_firma_idx on public.contracts(firma_id);
create index if not exists quotes_firma_idx    on public.quotes(firma_id);
create index if not exists projects_firma_idx  on public.projects(firma_id);

-- ----------------------------------------------------------------------------
-- BACKFILL: z existujících profilů založ firmy a napoj doklady.
--   * top-level klient (parent_client_id IS NULL) → primární firma vlastněná jím
--   * child profil (parent_client_id != NULL)     → firma vlastněná RODIČEM
--   * doklady (invoices/contracts/quotes/projects) dostanou firma_id odpovídající
--     jejich client_id (jen tam, kde je firma_id zatím NULL)
-- Idempotentní: re-run nezaloží duplicitní firmy ani nepřepíše už nastavené firma_id.
-- ----------------------------------------------------------------------------
do $$
declare
  r record;
  fid uuid;
  fname text;
  owner_id uuid;
begin
  for r in
    select id, full_name, company, ico, dic, street, city, billing_email, contract_email,
           representative_name, phone, website_url, parent_client_id
    from public.profiles
    where role = 'klient'
    order by parent_client_id nulls first   -- rodiče dřív než děti
  loop
    owner_id := coalesce(r.parent_client_id, r.id);
    fname := coalesce(nullif(btrim(r.company), ''), r.full_name);

    select f.id into fid
    from public.firmy f
    where f.client_id = owner_id and f.nazev = fname
    limit 1;

    if fid is null then
      insert into public.firmy (
        client_id, nazev, ico, dic, street, city,
        billing_email, contract_email, representative_name, phone, website_url, is_primary
      )
      values (
        owner_id, fname, r.ico, r.dic, r.street, r.city,
        r.billing_email, r.contract_email, r.representative_name, r.phone, r.website_url,
        (r.parent_client_id is null)
      )
      returning id into fid;
    end if;

    update public.invoices  set firma_id = fid where client_id = r.id and firma_id is null;
    update public.contracts set firma_id = fid where client_id = r.id and firma_id is null;
    update public.quotes    set firma_id = fid where client_id = r.id and firma_id is null;
    update public.projects  set firma_id = fid where client_id = r.id and firma_id is null;
  end loop;
end $$;
