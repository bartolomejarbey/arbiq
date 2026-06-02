-- ============================================================================
-- 0023: oprava regresi z 0019/0020 (nalezeno adversarialni verifikaci)
-- ============================================================================
-- 0020/0019 pool politiky byly 'to authenticated' bez gate na obchodnik/admin →
-- klient cetl PII vsech neprirazenych klientu i leadu. Tady gateujeme na roli.
-- Plus messages INSERT a crm_contacts write scoping + bump_chat_session definer.
-- POZN: shared_at gate ZAMERNE neresime — faktury/smlouvy maji byt auto-viditelne klientovi.

-- #1 profiles pool — jen obchodnik/admin (klient at vidi jen sebe)
drop policy if exists "Profiles: obchodnik reads own + pool" on public.profiles;
create policy "Profiles: obchodnik reads own + pool" on public.profiles for select to authenticated
  using (
    public.is_obchodnik_or_admin() and (
      assigned_obchodnik = auth.uid()
      or (assigned_obchodnik is null and role = 'klient')
    )
  );

-- #2 leady — pool jen pro obchodnik/admin (admin vidi vse)
drop policy if exists "Leads: hybrid read" on public.landing_leads;
create policy "Leads: hybrid read" on public.landing_leads for select to authenticated
  using (public.is_admin() or (public.is_obchodnik_or_admin() and (assigned_to = auth.uid() or assigned_to is null)));

drop policy if exists "Leads: scoped update" on public.landing_leads;
create policy "Leads: scoped update" on public.landing_leads for update to authenticated
  using (public.is_admin() or (public.is_obchodnik_or_admin() and (assigned_to = auth.uid() or assigned_to is null)))
  with check (public.is_admin() or (public.is_obchodnik_or_admin() and assigned_to = auth.uid()));

-- #4 messages INSERT — scopovat na projekty svych/nepřiřazených klientů
drop policy if exists "Messages: obchodnik+admin inserts" on public.messages;
create policy "Messages: staff inserts scoped" on public.messages for insert to authenticated
  with check (
    author_id = auth.uid() and (
      public.is_admin() or exists (
        select 1 from public.projects p
        where p.id = messages.project_id
          and (p.obchodnik_id = auth.uid() or public.is_my_client(p.client_id))
      )
    )
  );

-- #10 crm_contacts write — scopovat na vlastnictvi klienta
drop policy if exists "CRMContacts: obchodnik+admin write" on public.crm_contacts;
create policy "CRMContacts: scoped write" on public.crm_contacts for all to authenticated
  using (public.is_admin() or (obchodnik_id = auth.uid() and public.is_my_client(client_id)))
  with check (public.is_admin() or (obchodnik_id = auth.uid() and public.is_my_client(client_id)));

-- #8 bump_chat_session: SECURITY DEFINER (po 0019 dropu UPDATE policy jinak tise selze)
create or replace function public.bump_chat_session(s_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.chat_sessions
  set last_message_at = now(), message_count = message_count + 1
  where id = s_id;
$$;
