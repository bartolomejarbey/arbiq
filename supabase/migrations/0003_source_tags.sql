-- ============================================================================
-- 0003: source_tag — odkud lead přišel (Meta Ads, cold call, LinkedIn, ...)
-- ============================================================================
-- Účel: rozlišit zdroj leadu v CRM nezávisle na utm_source / kampan.
-- Přidá `source_tag text` na 3 intake tabulky a backfill pro existující řádky.
--
-- Hodnoty:
--   meta_ads        — placená reklama Meta (FB/IG)
--   google_ads      — placená reklama Google
--   cold_call       — telefonický cold outreach
--   email_outreach  — emailový cold outreach
--   linkedin        — LinkedIn (organic / DM / scrape)
--   doporuceni      — referral od existujícího klienta
--   organic         — SEO / přímá návštěva
--   imported_db     — nahraný kontakt z databáze (úkol 4B)
--   jine            — ostatní / neurčené
-- ============================================================================

alter table public.landing_leads
  add column if not exists source_tag text
  check (source_tag in (
    'meta_ads','google_ads','cold_call','email_outreach',
    'linkedin','doporuceni','organic','imported_db','jine'
  ));

create index if not exists landing_leads_source_tag_idx
  on public.landing_leads(source_tag);

alter table public.rentgen_orders
  add column if not exists source_tag text
  check (source_tag in (
    'meta_ads','google_ads','cold_call','email_outreach',
    'linkedin','doporuceni','organic','imported_db','jine'
  ));

create index if not exists rentgen_orders_source_tag_idx
  on public.rentgen_orders(source_tag);

alter table public.contact_messages
  add column if not exists source_tag text
  check (source_tag in (
    'meta_ads','google_ads','cold_call','email_outreach',
    'linkedin','doporuceni','organic','imported_db','jine'
  ));

create index if not exists contact_messages_source_tag_idx
  on public.contact_messages(source_tag);

-- Backfill landing_leads: odhadnout zdroj z utm_source / kampan.
update public.landing_leads
set source_tag = case
  when utm_source ilike '%meta%' or utm_source ilike '%facebook%'
    or utm_source ilike '%instagram%' then 'meta_ads'
  when utm_source ilike '%google%' or utm_source ilike '%adwords%' then 'google_ads'
  when utm_source ilike '%linkedin%' then 'linkedin'
  when kampan is not null and kampan <> '' then 'meta_ads'
  else 'organic'
end
where source_tag is null;

-- Backfill rentgen_orders: stejná logika.
update public.rentgen_orders
set source_tag = case
  when utm_source ilike '%meta%' or utm_source ilike '%facebook%'
    or utm_source ilike '%instagram%' then 'meta_ads'
  when utm_source ilike '%google%' or utm_source ilike '%adwords%' then 'google_ads'
  when utm_source ilike '%linkedin%' then 'linkedin'
  else 'organic'
end
where source_tag is null;

-- Backfill contact_messages: většinou organic (kontaktní formulář na webu).
update public.contact_messages
set source_tag = 'organic'
where source_tag is null;
