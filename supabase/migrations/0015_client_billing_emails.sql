-- ============================================================================
-- 0015: oddělený fakturační a smluvní e-mail klienta
-- ============================================================================
-- Use-case: klient má jiný e-mail pro faktury a jiný pro smlouvy než svůj
-- hlavní kontaktní e-mail. Při odeslání PDF se použije příslušné pole,
-- fallback na profiles.email. Obě pole jsou nepovinná.

alter table public.profiles
  add column if not exists billing_email text,
  add column if not exists contract_email text;
