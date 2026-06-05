-- ============================================================================
-- 0029: profiles.archived_at — soft delete (archivace) klienta.
-- ----------------------------------------------------------------------------
-- Odlišné od is_active (to řídí login/lockout). archived_at = klient je
-- "smazaný" z CRM pohledu: zmizí ze seznamů, ale data (faktury, smlouvy,
-- projekty) zůstávají kvůli zákonné archivační povinnosti. Lze obnovit
-- (archived_at = null). Tvrdé smazání bez dokladů řeší server action.
-- ============================================================================

alter table public.profiles add column if not exists archived_at timestamptz;

create index if not exists profiles_archived_idx
  on public.profiles(archived_at) where archived_at is not null;
