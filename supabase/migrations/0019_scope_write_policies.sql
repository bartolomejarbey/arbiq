-- ============================================================================
-- 0019: zacelit cross-tenant WRITE IDOR — scopovat zapis na vlastnictvi
-- ============================================================================
-- Problem: tabulky mely "ALL ... using/check is_obchodnik_or_admin()" → kazdy
-- obchodnik mohl INSERT/UPDATE/DELETE libovolny radek napric vsemi klienty
-- (uprava/smazani cizich projektu, smluv, nabidek, ukolu...). Read uz scopovan
-- pres is_my_client; tady scopujeme ZAPIS. Admin (is_admin()) ma vzdy plny pristup.
-- Read-hybrid (messages/recommendations/profiles pool) zamerne resen jinde po testu.

-- ---- projects ----
drop policy if exists "Projects: obchodnik+admin write" on public.projects;
create policy "Projects: scoped write" on public.projects for all to authenticated
  using (public.is_admin() or obchodnik_id = auth.uid() or public.is_my_client(client_id))
  with check (public.is_admin() or obchodnik_id = auth.uid() or public.is_my_client(client_id));

-- ---- contracts ----
drop policy if exists "Contracts: obchodnik+admin write" on public.contracts;
create policy "Contracts: scoped write" on public.contracts for all to authenticated
  using (public.is_admin() or obchodnik_id = auth.uid() or public.is_my_client(client_id))
  with check (public.is_admin() or obchodnik_id = auth.uid() or public.is_my_client(client_id));

-- ---- quotes ----
drop policy if exists "Quotes: obchodnik+admin write" on public.quotes;
create policy "Quotes: scoped write" on public.quotes for all to authenticated
  using (public.is_admin() or obchodnik_id = auth.uid() or public.is_my_client(client_id))
  with check (public.is_admin() or obchodnik_id = auth.uid() or public.is_my_client(client_id));

-- ---- metrics ----
drop policy if exists "Metrics: obchodnik+admin write" on public.metrics;
create policy "Metrics: scoped write" on public.metrics for all to authenticated
  using (public.is_admin() or public.is_my_client(client_id))
  with check (public.is_admin() or public.is_my_client(client_id));

-- ---- documents ----
drop policy if exists "Documents: obchodnik+admin write" on public.documents;
create policy "Documents: scoped write" on public.documents for all to authenticated
  using (public.is_admin() or public.is_my_client(client_id))
  with check (public.is_admin() or public.is_my_client(client_id));

-- ---- crm_tasks ----
drop policy if exists "CRMTasks: obchodnik+admin write" on public.crm_tasks;
create policy "CRMTasks: scoped write" on public.crm_tasks for all to authenticated
  using (public.is_admin() or assigned_to = auth.uid())
  with check (public.is_admin() or assigned_to = auth.uid());

-- ---- milestones (scope pres rodicovsky projekt) ----
drop policy if exists "Milestones: obchodnik+admin write" on public.milestones;
create policy "Milestones: scoped write" on public.milestones for all to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.projects p
      where p.id = milestones.project_id
        and (p.obchodnik_id = auth.uid() or public.is_my_client(p.client_id))
    )
  )
  with check (
    public.is_admin() or exists (
      select 1 from public.projects p
      where p.id = milestones.project_id
        and (p.obchodnik_id = auth.uid() or public.is_my_client(p.client_id))
    )
  );

-- ---- landing_leads: hybrid (svoje + nepřiřazený pool) read + scoped write ----
drop policy if exists "Leads: obchodnik+admin read" on public.landing_leads;
create policy "Leads: hybrid read" on public.landing_leads for select to authenticated
  using (public.is_admin() or assigned_to = auth.uid() or assigned_to is null);

drop policy if exists "Leads: obchodnik+admin update" on public.landing_leads;
create policy "Leads: scoped update" on public.landing_leads for update to authenticated
  using (public.is_admin() or assigned_to = auth.uid() or assigned_to is null)
  with check (public.is_admin() or assigned_to = auth.uid());

-- ---- chat_sessions: zrusit wildcard authenticated UPDATE (using(true)) ----
-- Aktualizace probiha pres SECURITY DEFINER RPC; primy zapis uzivatelem neni treba.
drop policy if exists "ChatSessions: auth update" on public.chat_sessions;
