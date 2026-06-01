-- ============================================================================
-- 0018: admin_audit_log — accountability pro citlive admin akce
-- ============================================================================
-- Zaznam kdo/co/kdy/na kom: reset hesla, zmena role, (de)aktivace, prirazeni,
-- pozvani do zony. Append-only (zapis jen pres service role), cte jen admin.

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_id uuid,
  target_type text,
  detail jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_idx on public.admin_audit_log(created_at desc);
create index if not exists admin_audit_log_actor_idx on public.admin_audit_log(actor_id, created_at desc);

alter table public.admin_audit_log enable row level security;

drop policy if exists "audit: admin read" on public.admin_audit_log;
create policy "audit: admin read" on public.admin_audit_log
  for select using (public.is_admin());
-- Zapis vyhradne pres service role (createAdminClient) — zadna user policy.
