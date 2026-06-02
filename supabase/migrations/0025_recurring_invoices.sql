-- ============================================================================
-- 0025: pravidelná (recurring) fakturace — konfigurace per klient
-- ============================================================================
create table if not exists public.recurring_invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  description text not null,
  kind text not null default 'paushal' check (kind in ('zaloha','konecna','dobropis','paushal')),
  due_days int not null default 14 check (due_days between 1 and 90),
  payment_method text not null default 'bank' check (payment_method in ('bank','card','cash')),
  interval_months int not null default 1 check (interval_months in (1,3,6,12)),
  day_of_month int not null default 1 check (day_of_month between 1 and 28),
  auto_send boolean not null default true,
  active boolean not null default true,
  next_run date not null,
  last_run date,
  last_invoice_id uuid references public.invoices(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists recurring_client_idx on public.recurring_invoices(client_id);
create index if not exists recurring_due_idx on public.recurring_invoices(next_run) where active;

alter table public.recurring_invoices enable row level security;
-- Čtení: admin vše, obchodník svého klienta. Zápis přes service role (akce s guardem).
drop policy if exists "recurring: admin read" on public.recurring_invoices;
create policy "recurring: admin read" on public.recurring_invoices for select to authenticated
  using (public.is_admin());
drop policy if exists "recurring: obchodnik read" on public.recurring_invoices;
create policy "recurring: obchodnik read" on public.recurring_invoices for select to authenticated
  using (public.is_my_client(client_id));
