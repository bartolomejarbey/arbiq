-- ============================================================================
-- 0011: invoices.supplier_override — fakturovat za jinou firmu než výchozí
-- ============================================================================
-- Když obchodák potřebuje vystavit fakturu z jiné identity (např. dceřinka,
-- jiné OSVČ), uloží se override JSON s `name`, `street`, `city`, `ico`, `dic`,
-- `iban`, `bank_account`, `bank_name`, `bic`, `email`, `phone`, `website`,
-- `vat_payer`. PDF renderer a SPAYD QR vezmou hodnotu z override pokud
-- existuje, jinak fallback na `app_settings.dodavatel`.

alter table public.invoices
  add column if not exists supplier_override jsonb;
