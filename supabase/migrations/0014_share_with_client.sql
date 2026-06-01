-- ============================================================================
-- 0014: sdílení faktur a smluv do klientské zóny (shared_at gate)
-- ============================================================================
-- Use-case: klient v zóně NESMÍ vidět každou fakturu/smlouvu automaticky.
-- Admin/obchodník je musí výslovně "poslat do zóny" tlačítkem. Až poté se
-- klientovi zobrazí. shared_at = časová značka okamžiku sdílení (NULL = skryté).

alter table public.invoices
  add column if not exists shared_at timestamptz;

alter table public.contracts
  add column if not exists shared_at timestamptz;

-- Indexy pro rychlý filtr "co je sdílené" v klientské zóně.
create index if not exists invoices_shared_idx on public.invoices(client_id, shared_at)
  where shared_at is not null;

create index if not exists contracts_shared_idx on public.contracts(client_id, shared_at)
  where shared_at is not null;
