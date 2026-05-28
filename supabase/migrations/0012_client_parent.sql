-- ============================================================================
-- 0012: profiles.parent_client_id — jedna osoba = víc firem
-- ============================================================================
-- Use-case: Jan Novák má firmu ABC a později i firmu XYZ. Místo duplikace
-- osoby založí admin druhý klient profil (firma XYZ) a propojí ho přes
-- parent_client_id na první klient (firma ABC), který nese identitu osoby.
-- Foreign key je self-reference s ON DELETE SET NULL — když se smaže parent,
-- "child" firmy zůstanou, jen se odpojí.

alter table public.profiles
  add column if not exists parent_client_id uuid references public.profiles(id) on delete set null;

create index if not exists profiles_parent_client_idx on public.profiles(parent_client_id);

-- Sanity: zabraň přiřadit profilu sám sebe jako parent.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_parent_not_self'
  ) then
    alter table public.profiles
      add constraint profiles_parent_not_self check (parent_client_id is null or parent_client_id <> id);
  end if;
end $$;
