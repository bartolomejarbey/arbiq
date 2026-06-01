-- ============================================================================
-- 0016: korespondence klienta v zóně + textový update případu na projektu
-- ============================================================================

-- N3: volný update pro klienta — v jaké fázi jsme, co zbývá.
alter table public.projects
  add column if not exists client_update text;

-- N1: e-mailová korespondence napárovaná na klienta (zobrazí se mu v zóně).
-- Tělo ukládáme jako PLAIN TEXT (žádné cizí HTML → žádné XSS při zobrazení).
create table if not exists public.client_emails (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound')),
  from_email text,
  to_email text,
  subject text,
  body text,
  message_id text,
  created_at timestamptz not null default now()
);

create index if not exists client_emails_client_idx
  on public.client_emails(client_id, created_at desc);
-- Dedup příchozích podle message_id (Resend může webhook doručit víckrát).
create unique index if not exists client_emails_msgid_uniq
  on public.client_emails(message_id) where message_id is not null;

alter table public.client_emails enable row level security;

-- Klient čte jen svou korespondenci.
drop policy if exists "client_emails: self read" on public.client_emails;
create policy "client_emails: self read" on public.client_emails
  for select using (client_id = auth.uid());

-- Admin čte vše.
drop policy if exists "client_emails: admin read" on public.client_emails;
create policy "client_emails: admin read" on public.client_emails
  for select using (is_admin());

-- Obchodník čte korespondenci svých přiřazených klientů.
drop policy if exists "client_emails: obchodnik read" on public.client_emails;
create policy "client_emails: obchodnik read" on public.client_emails
  for select using (
    exists (
      select 1 from public.profiles c
      where c.id = public.client_emails.client_id
        and c.assigned_obchodnik = auth.uid()
    )
  );
-- Zápis jen přes service role (admin client) → žádná insert policy pro uživatele.
