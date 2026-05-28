-- ============================================================================
-- 0013: jednorázová faktura (bez klienta v systému) + customer_override
-- ============================================================================
-- Use-case: admin/obchodník chce vystavit fakturu komukoliv, kdo není
-- registrovaný klient v profilech. Vyplní si všechno ručně (jméno, IČO, DIČ,
-- adresa) a faktura žije v systému s client_id=NULL.

alter table public.invoices
  alter column client_id drop not null,
  add column if not exists customer_override jsonb;

-- Index pro filtraci jednorázových faktur (klient null).
create index if not exists invoices_oneoff_idx on public.invoices(issued_at desc) where client_id is null;
