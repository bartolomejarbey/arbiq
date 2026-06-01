-- ============================================================================
-- 0017: KRITICKA bezpecnostni oprava — privilege escalation
-- ============================================================================
-- Problem 1 (system takeover): RLS policy "Profiles: self update" (0001:557-558)
--   ma with check (id = auth.uid()) BEZ omezeni sloupcu → klient si pres REST
--   PATCH /profiles?id=eq.<svoje> {"role":"admin"} nastavi roli admin.
-- Problem 2: handle_new_user bere roli z raw_user_meta_data → pokud by byl
--   zapnuty verejny signUp, utocnik se zaregistruje rovnou jako admin.
--
-- Reseni: BEFORE UPDATE trigger blokuje ne-adminum zmenu citlivych poli;
--   handle_new_user vzdy zaklada 'klient' (povyseni jen pres admin/service-role).

create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Service-role (admin client, auth.uid() IS NULL) a admini smi vse.
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  -- Ne-admin (klient/obchodnik) nesmi menit citliva pole sam na sobe.
  if new.role is distinct from old.role
     or new.is_active is distinct from old.is_active
     or new.assigned_obchodnik is distinct from old.assigned_obchodnik
     or new.parent_client_id is distinct from old.parent_client_id then
    raise exception 'Nedostatecna opravneni ke zmene citlivych poli profilu (role/is_active/assigned_obchodnik/parent_client_id).';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_priv_esc on public.profiles;
create trigger profiles_prevent_priv_esc
  before update on public.profiles
  for each row execute function public.prevent_profile_privilege_escalation();

-- handle_new_user: NIKDY neprebirat roli z user_metadata. Vzdy 'klient'.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    'klient'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
