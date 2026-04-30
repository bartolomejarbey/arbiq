-- ============================================================================
-- 0005: crm_notes — časosled poznámek pro lead i klienta
-- ============================================================================
-- Notes patří buď leadu nebo klientovi (XOR check). Obchodník vidí svoje +
-- poznámky u nepřiřazených leadů; admin vidí vše. Klient nemá přístup.
-- ============================================================================

create table public.crm_notes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  author_id uuid not null references public.profiles(id),

  -- Právě jedna z těchto dvou musí být vyplněná.
  lead_id uuid references public.landing_leads(id) on delete cascade,
  client_id uuid references public.profiles(id) on delete cascade,

  content text not null check (length(content) between 1 and 4000),

  constraint crm_notes_exactly_one_target check (
    (lead_id is not null)::int + (client_id is not null)::int = 1
  )
);

create index crm_notes_lead_idx on public.crm_notes (lead_id, created_at desc) where lead_id is not null;
create index crm_notes_client_idx on public.crm_notes (client_id, created_at desc) where client_id is not null;
create index crm_notes_author_idx on public.crm_notes (author_id);

alter table public.crm_notes enable row level security;

-- SELECT: admin = vše; obchodník = poznámky u jeho leadů (assigned_to=auth.uid() nebo null)
-- + jeho klientů (klient.assigned_obchodnik = auth.uid()).
create policy "Notes: select"
  on public.crm_notes for select to authenticated
  using (
    public.is_admin()
    or (
      public.is_obchodnik_or_admin()
      and (
        (lead_id is not null and exists (
          select 1 from public.landing_leads l
          where l.id = crm_notes.lead_id
            and (l.assigned_to = auth.uid() or l.assigned_to is null)
        ))
        or (client_id is not null and exists (
          select 1 from public.profiles p
          where p.id = crm_notes.client_id
            and (p.assigned_obchodnik = auth.uid() or p.assigned_obchodnik is null)
        ))
      )
    )
  );

-- INSERT: jakýkoliv obchodník/admin smí přidat (author_id musí být = auth.uid())
create policy "Notes: insert"
  on public.crm_notes for insert to authenticated
  with check (
    public.is_obchodnik_or_admin()
    and author_id = auth.uid()
  );

-- DELETE: jen autor poznámky nebo admin
create policy "Notes: delete"
  on public.crm_notes for delete to authenticated
  using (
    public.is_admin()
    or author_id = auth.uid()
  );

-- UPDATE: nikdo (poznámky jsou append-only audit trail). Admin v dashboardu může smazat.
-- (Žádná update policy = update zamítnut by default.)
