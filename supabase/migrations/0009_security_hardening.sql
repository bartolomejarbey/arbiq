-- ============================================================================
-- 0009: Security hardening — odstranit příliš permisivní anon UPDATE policy
-- ============================================================================
-- Audit objevil:
-- 1) chat_sessions má anon UPDATE policy s `using (true) with check (true)`
--    → anonymní volání může přepsat libovolný session row. Nahradíme za
--    SECURITY DEFINER RPC (`bump_chat_session` je už definován), žádná
--    přímá UPDATE policy pro anon roli není potřeba.
-- 2) app_settings.app_url default seed je 'http://localhost:3000' — pokud
--    někdo někdy přečte hodnotu z DB (např. budoucí emailing job), poslalo
--    by to klientovi nefunkční link. Updatujeme jen pokud je hodnota
--    legacy 'http://localhost:3000'.

-- 1) Drop anon UPDATE policy na chat_sessions (RPC bump_chat_session bypassuje
--    RLS přes SECURITY DEFINER, takže policy není potřeba).
drop policy if exists "ChatSessions: anon update last_message" on public.chat_sessions;

-- 2) Fix legacy localhost default v app_settings (pokud admin nezměnil ručně).
update public.app_settings
set value = 'https://arbiq.cz'
where key = 'app_url' and value = 'http://localhost:3000';
