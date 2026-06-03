-- Dobropis (opravný daňový doklad) navázaný na původní fakturu.
alter table public.invoices
  add column if not exists corrected_invoice_id uuid references public.invoices(id) on delete set null;
