-- ============================================================================
-- 0010: Cenové nabídky (quotes / nabidky)
-- ============================================================================
-- Pre-smluvní dokument: obchodák vytvoří nabídku, klient akceptuje emailem,
-- následně se vystaví smlouva o dílo + zálohová faktura. Nabídka má vlastní
-- číselnou řadu NAB-YYYY-NNN a 30denní platnost.

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Vazby
  client_id uuid not null references public.profiles(id) on delete restrict,
  project_id uuid references public.projects(id) on delete set null,
  obchodnik_id uuid references public.profiles(id) on delete set null,
  -- Pokud bude nabídka akceptována → ID vytvořené smlouvy
  contract_id uuid references public.contracts(id) on delete set null,

  -- Identifikace
  quote_number text not null unique,  -- NAB-YYYY-NNN
  title text not null,
  intro_text text,                     -- volitelný sales intro

  -- Obsah
  items jsonb not null default '[]'::jsonb,
  total_price numeric(12,2) not null,
  currency text not null default 'CZK',
  vat_note text default 'Zhotovitel není plátcem DPH',

  -- Podmínky
  valid_until date not null default (current_date + interval '30 days'),
  payment_terms text default '50 % záloha při akceptaci, 50 % po předání díla',
  deadline_days integer default 14,

  -- Stav
  status text not null default 'koncept'
    check (status in ('koncept','poslano','akceptovano','odmitnuto','expirovano','zruseno')),
  accepted_at date,
  rejected_at date,
  reject_reason text,

  -- Soubory
  pdf_url text,

  metadata jsonb
);

create index if not exists quotes_client_idx on public.quotes(client_id);
create index if not exists quotes_status_idx on public.quotes(status);
create index if not exists quotes_number_idx on public.quotes(quote_number);
create index if not exists quotes_valid_idx on public.quotes(valid_until);

-- updated_at trigger
drop trigger if exists trg_quotes_touch on public.quotes;
create trigger trg_quotes_touch
  before update on public.quotes
  for each row execute function public.touch_contracts_updated_at();

-- RLS
alter table public.quotes enable row level security;

create policy "Quotes: client reads own" on public.quotes for select to authenticated
  using (client_id = auth.uid());
create policy "Quotes: obchodnik reads own clients" on public.quotes for select to authenticated
  using (public.is_my_client(client_id));
create policy "Quotes: admin reads all" on public.quotes for select to authenticated
  using (public.is_admin());
create policy "Quotes: obchodnik+admin write" on public.quotes for all to authenticated
  using (public.is_obchodnik_or_admin()) with check (public.is_obchodnik_or_admin());

-- ----------------------------------------------------------------------------
-- next_quote_number RPC (NAB-YYYY-NNN)
-- ----------------------------------------------------------------------------
create or replace function public.next_quote_number() returns text
language plpgsql security definer as $$
declare
  year_part text;
  next_seq integer;
begin
  year_part := to_char(now(), 'YYYY');
  select coalesce(max(
    nullif(regexp_replace(quote_number, '^NAB-' || year_part || '-', ''), '')::integer
  ), 0) + 1
  into next_seq
  from public.quotes
  where quote_number ~ ('^NAB-' || year_part || '-\d+$');
  return 'NAB-' || year_part || '-' || lpad(next_seq::text, 3, '0');
end;
$$;

-- ----------------------------------------------------------------------------
-- documents.quote_id (linkage)
-- ----------------------------------------------------------------------------
alter table public.documents
  add column if not exists quote_id uuid references public.quotes(id) on delete cascade;
create index if not exists documents_quote_idx on public.documents(quote_id);

-- Doplnit 'nabidka' a 'nabidka_pdf' do allowed type enum (původní 0001 už má 'nabidka').
