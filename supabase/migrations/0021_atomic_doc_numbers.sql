-- ============================================================================
-- 0021: atomicka cisla nabidek/smluv (odstraneni max()+1 race)
-- ============================================================================
-- next_contract_number / next_quote_number pouzivaly coalesce(max()+1) → dva
-- soubezne inserty dostaly stejne cislo. Resime per-(typ,rok) counter tabulkou
-- s atomickym "insert ... on conflict do update returning" (row lock).

create table if not exists public.doc_counters (
  doc_type text not null,
  year int not null,
  n int not null default 0,
  primary key (doc_type, year)
);
alter table public.doc_counters enable row level security;
drop policy if exists "doc_counters: admin read" on public.doc_counters;
create policy "doc_counters: admin read" on public.doc_counters for select using (public.is_admin());

-- Seed aktualnim maximem pro letosni rok, aby nova cisla nekolidovala se stavajicimi.
insert into public.doc_counters(doc_type, year, n)
select 'contract', extract(year from now())::int,
  coalesce(max(nullif(regexp_replace(contract_number, '^SMLA-' || to_char(now(),'YYYY') || '-', ''), '')::int), 0)
from public.contracts
where contract_number ~ ('^SMLA-' || to_char(now(),'YYYY') || '-\d+$')
on conflict (doc_type, year) do nothing;

insert into public.doc_counters(doc_type, year, n)
select 'quote', extract(year from now())::int,
  coalesce(max(nullif(regexp_replace(quote_number, '^NAB-' || to_char(now(),'YYYY') || '-', ''), '')::int), 0)
from public.quotes
where quote_number ~ ('^NAB-' || to_char(now(),'YYYY') || '-\d+$')
on conflict (doc_type, year) do nothing;

create or replace function public.next_contract_number()
returns text language plpgsql security definer set search_path = public as $$
declare yr int := extract(year from now())::int; seq int;
begin
  insert into public.doc_counters(doc_type, year, n) values ('contract', yr, 1)
    on conflict (doc_type, year) do update set n = public.doc_counters.n + 1
    returning n into seq;
  return 'SMLA-' || yr::text || '-' || lpad(seq::text, 3, '0');
end;
$$;

create or replace function public.next_quote_number()
returns text language plpgsql security definer set search_path = public as $$
declare yr int := extract(year from now())::int; seq int;
begin
  insert into public.doc_counters(doc_type, year, n) values ('quote', yr, 1)
    on conflict (doc_type, year) do update set n = public.doc_counters.n + 1
    returning n into seq;
  return 'NAB-' || yr::text || '-' || lpad(seq::text, 3, '0');
end;
$$;
