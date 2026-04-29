-- ============================================================================
-- Seed: promote one user to admin + set as default lead assignee
-- ============================================================================
-- Run this AFTER you've created your account through Supabase Auth
-- (Dashboard → Authentication → Users → "Add user").
--
-- 1. Replace 'bartolomej@arbey.cz' below with your real e-mail.
-- 2. Paste this whole script into Supabase Dashboard → SQL Editor → Run.
-- 3. From now on you can sign in to /portal/login as admin.
-- ============================================================================

-- Promote to admin
update public.profiles
set role = 'admin', is_active = true
where email = 'bartolomej@arbey.cz';

-- Use this admin as the default assignee for new leads / Rentgen orders
update public.app_settings
set value = (
  select id::text from public.profiles
  where email = 'bartolomej@arbey.cz'
  limit 1
)
where key = 'default_lead_assignee';

-- Verify
select id, email, full_name, role, is_active from public.profiles where role = 'admin';
select * from public.app_settings;
