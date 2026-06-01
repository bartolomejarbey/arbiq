-- ============================================================================
-- 0020: read-hybrid RLS — dokonceni cross-tenant scopingu (READ)
-- ============================================================================
-- messages/recommendations: obchodnik cetl VSE napric klienty → scopovat.
-- profiles: obchodnik vidi sve prirazene + neprirazeny POOL klientu (hybrid).
-- Admin (is_admin()) vsude plny pristup; klient sve.

-- ---- messages: obchodnik jen zpravy projektu svych/nepřiřazených klientů ----
drop policy if exists "Messages: obchodnik+admin reads all" on public.messages;
create policy "Messages: scoped read" on public.messages for select to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.projects p
      where p.id = messages.project_id
        and (p.obchodnik_id = auth.uid() or public.is_my_client(p.client_id))
    )
  );

-- ---- recommendations: obchodnik jen sve klienty ----
drop policy if exists "Recommendations: obchodnik+admin reads all" on public.recommendations;
create policy "Recommendations: scoped read" on public.recommendations for select to authenticated
  using (public.is_admin() or public.is_my_client(client_id));

-- ---- profiles: obchodnik vidi sve prirazene + neprirazeny pool (jen klienti) ----
drop policy if exists "Profiles: obchodnik reads own clients" on public.profiles;
create policy "Profiles: obchodnik reads own + pool" on public.profiles for select to authenticated
  using (
    assigned_obchodnik = auth.uid()
    or (assigned_obchodnik is null and role = 'klient')
  );
