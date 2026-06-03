-- Chat lead capture: ulož, KDO s asistentem mluvil (kontakt + případně přihlášený uživatel).
-- Dřív chat_sessions držel jen anonymní visitor_id → admin nevěděl, kdo psal, a leady
-- se ztrácely (system prompt sliboval "předáme Fideliovi", ale nikam se nic nepředalo).

alter table public.chat_sessions
  add column if not exists captured_name text,
  add column if not exists captured_email text,
  add column if not exists captured_phone text,
  add column if not exists user_id uuid references auth.users(id) on delete set null;
