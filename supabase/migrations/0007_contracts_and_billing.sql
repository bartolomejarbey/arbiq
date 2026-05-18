-- ============================================================================
-- 0007: Smlouvy (contracts), rozšíření invoices o platební údaje, dodavatel
-- ============================================================================
-- Cíl:
--   1) Tabulka public.contracts pro generování smluv o dílo.
--   2) Rozšíření public.invoices o IBAN, var. symbol, typ (záloha/konečná) a
--      vazbu na smlouvu (zaloha_for_contract_id).
--   3) Dodavatel info v public.app_settings (single source of truth pro PDF).
--   4) next_contract_number RPC (řada YYYY-NNN).

-- ----------------------------------------------------------------------------
-- 1) Invoice billing fields
-- ----------------------------------------------------------------------------
alter table public.invoices
  add column if not exists kind text not null default 'konecna'
    check (kind in ('zaloha','konecna','dobropis','paushal')),
  add column if not exists variable_symbol text,
  add column if not exists constant_symbol text,
  add column if not exists contract_id uuid,
  add column if not exists payment_method text not null default 'bank'
    check (payment_method in ('bank','card','cash')),
  add column if not exists currency text not null default 'CZK',
  add column if not exists qr_payload text,
  add column if not exists items jsonb;

-- contract_id musí být foreign key, ale tabulka contracts se zakládá níže — FK doplníme tam.

-- ----------------------------------------------------------------------------
-- 2) Tabulka contracts
-- ----------------------------------------------------------------------------
create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Kdo a co
  client_id uuid not null references public.profiles(id) on delete restrict,
  project_id uuid references public.projects(id) on delete set null,
  obchodnik_id uuid references public.profiles(id) on delete set null,

  -- Identifikace
  contract_number text not null unique,
  kind text not null default 'smlouva_o_dilo'
    check (kind in ('smlouva_o_dilo','smlouva_paushal','nda','dodatek','jine')),
  title text not null,

  -- Předmět díla
  subject text not null,                -- "Tvorba responzivní webové prezentace"
  scope_html text,                       -- bohatý HTML obsah specifikace (volitelné)
  scope_bullets jsonb,                   -- pole odrážek (jednodušší input než HTML)

  -- Cena
  total_price numeric(12,2) not null,
  currency text not null default 'CZK',
  vat_note text default 'Zhotovitel není plátcem DPH',
  deposit_percent numeric(5,2) default 50,  -- záloha v %
  hourly_rate numeric(10,2) default 900,    -- sazba pro vícepráce
  monthly_fee numeric(10,2),                -- pro paušál (volitelné)

  -- Termíny
  deadline_days integer,                  -- počet dnů od podpisu / zaplacení zálohy
  warranty_months integer default 3,
  late_fee_per_day numeric(5,4) default 0.0005, -- 0.05 % per den default
  penalty_max numeric(10,2),

  -- Místo a datum
  place_of_signing text default 'Bělči',
  signed_at_supplier date,
  signed_at_customer date,

  -- Sankce a klauzule (boolean flags pro zapnutí sekcí)
  has_exclusivity boolean not null default false,
  exclusivity_clause text,
  has_nda boolean not null default true,
  nda_penalty numeric(10,2) default 100000,

  -- Stav
  status text not null default 'koncept'
    check (status in ('koncept','poslano','podepsano','odmítnuto','zruseno')),

  -- Soubory
  pdf_url text,
  docx_url text,

  -- Volný JSON pro speciální parametry konkrétní smlouvy
  metadata jsonb
);

create index contracts_client_idx on public.contracts(client_id);
create index contracts_status_idx on public.contracts(status);
create index contracts_number_idx on public.contracts(contract_number);

-- FK z invoices na contracts (musí být po vytvoření tabulky)
alter table public.invoices
  add constraint invoices_contract_fk
  foreign key (contract_id) references public.contracts(id) on delete set null;

-- Trigger pro updated_at
create or replace function public.touch_contracts_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists trg_contracts_touch on public.contracts;
create trigger trg_contracts_touch
  before update on public.contracts
  for each row execute function public.touch_contracts_updated_at();

-- RLS
alter table public.contracts enable row level security;

create policy "Contracts: client reads own" on public.contracts for select to authenticated
  using (client_id = auth.uid());
create policy "Contracts: obchodnik reads own clients" on public.contracts for select to authenticated
  using (public.is_my_client(client_id));
create policy "Contracts: admin reads all" on public.contracts for select to authenticated
  using (public.is_admin());
create policy "Contracts: obchodnik+admin write" on public.contracts for all to authenticated
  using (public.is_obchodnik_or_admin()) with check (public.is_obchodnik_or_admin());

-- ----------------------------------------------------------------------------
-- 3) next_contract_number RPC (formát SMLA-YYYY-NNN)
-- ----------------------------------------------------------------------------
create or replace function public.next_contract_number() returns text
language plpgsql security definer as $$
declare
  year_part text;
  next_seq integer;
begin
  year_part := to_char(now(), 'YYYY');
  select coalesce(max(
    nullif(regexp_replace(contract_number, '^SMLA-' || year_part || '-', ''), '')::integer
  ), 0) + 1
  into next_seq
  from public.contracts
  where contract_number ~ ('^SMLA-' || year_part || '-\d+$');
  return 'SMLA-' || year_part || '-' || lpad(next_seq::text, 3, '0');
end;
$$;

-- ----------------------------------------------------------------------------
-- 4) Dodavatel info v app_settings (pro PDF generátory)
-- ----------------------------------------------------------------------------
-- app_settings.value je text, takže ukládáme JSON jako string a parsuje TS kód.
insert into public.app_settings (key, value) values
  ('dodavatel', '{"name":"Bartoloměj Rota","brand":"Arbiq.cz","street":"Běleč 30","city":"391 43 Běleč","ico":"21875570","dic":null,"vat_payer":false,"email":"bartolomej@arbiq.cz","phone":"+420 725 932 729","bank_account":"3140419018/3030","bank_name":"Air Bank","iban":"CZ44 3030 0000 0031 4041 9018","bic":"AIRACZPP","website":"arbiq.cz","place":"Bělči","legal_form":"Fyzická osoba podnikající dle živnostenského zákona"}')
on conflict (key) do nothing;

-- ----------------------------------------------------------------------------
-- 5) Rozšíření public.documents — vazba na klienta / fakturu / smlouvu
-- ----------------------------------------------------------------------------
alter table public.documents
  alter column project_id drop not null,
  add column if not exists client_id uuid references public.profiles(id) on delete cascade,
  add column if not exists invoice_id uuid references public.invoices(id) on delete cascade,
  add column if not exists contract_id uuid references public.contracts(id) on delete cascade,
  add column if not exists mime_type text,
  add column if not exists title text,
  add column if not exists storage_path text;

-- Backfill storage_path z file_path pokud chybí.
update public.documents set storage_path = file_path where storage_path is null;
update public.documents set title = name where title is null;

create index if not exists documents_client_idx on public.documents(client_id);
create index if not exists documents_invoice_idx on public.documents(invoice_id);
create index if not exists documents_contract_idx on public.documents(contract_id);

-- Otevřené RLS politiky (pokud chybí) — používáme service-role pro insert ze server actions,
-- takže RLS nemusí povolovat write, jen read pro klienta/obchodníka.
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'documents' and policyname = 'Documents: client reads own') then
    create policy "Documents: client reads own" on public.documents for select to authenticated
      using (client_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where tablename = 'documents' and policyname = 'Documents: obchodnik reads own clients') then
    create policy "Documents: obchodnik reads own clients" on public.documents for select to authenticated
      using (public.is_my_client(client_id));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'documents' and policyname = 'Documents: admin reads all') then
    create policy "Documents: admin reads all" on public.documents for select to authenticated
      using (public.is_admin());
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 6) Profil odběratele — fakturační údaje
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists dic text,
  add column if not exists street text,
  add column if not exists city text,
  add column if not exists representative_name text,
  add column if not exists notes text;
