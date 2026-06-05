# Plán implementace — Klient/Firma + Operační centrum

Spec: `docs/superpowers/specs/2026-06-05-klient-firma-operacni-centrum-design.md`

## Fáze 1 — Datový základ (migrace)
- [ ] `supabase/migrations/0028_firmy.sql` — tabulka `firmy`, `firma_id` na invoices/contracts/quotes/projects, backfill, RLS, `is_my_firma()`.
- [ ] `supabase/migrations/0029_client_archive.sql` — `profiles.archived_at`.
- [ ] `supabase/migrations/0030_notification_channels.sql` — `profiles.sms_notifications_enabled`, tabulka `notification_prefs`.
- [ ] (Aplikace na prod `supabase db push` — AŽ po potvrzení uživatele.)

## Fáze 2 — Firmy: actions + UI + napojení do formulářů
- [ ] `lib/actions/firmy.ts` — create/update/archive/delete firma (admin/obchodník, untyped client).
- [ ] `lib/data/firmy.ts` — čtecí helpery (firmy klienta, firma detail).
- [ ] `components/portal/FirmaForm.tsx` (+ dialog) — vytvořit/upravit firmu (IČO ARES lookup reuse).
- [ ] Stránka `app/portal/(app)/crm/firmy/` — seznam všech firem (admin).
- [ ] Picker: do faktury/smlouvy/nabídky formulářů přidat `klient → firma` dropdown; v `createInvoice/createContract/createQuote` přijmout `firma_id`, identitu odběratele brát z firmy.

## Fáze 3 — Strom klientů + mazání
- [ ] `app/portal/(app)/crm/klienti/page.tsx` → strom (osoba → firmy → projekty), jen top-level osoby.
- [ ] `components/portal/ClientTree.tsx` (client component, rozbalování).
- [ ] `lib/actions/users.ts` → `deleteClient(clientId, mode)` (archive | hard), guard na doklady, self/last-admin guard.
- [ ] `components/portal/DeleteClientDialog.tsx` — volby mazání.

## Fáze 4 — 360° operační centrum
- [ ] `lib/data/client-overview.ts` — agregace deadlinů + load všech sekcí jedním místem.
- [ ] `components/portal/klient/DeadlinesTimeline.tsx`, `UpcomingMeetings.tsx`, `FirmyPanel.tsx`.
- [ ] Přestavba `app/portal/(app)/crm/klient/[id]/page.tsx` na operační centrum.

## Fáze 5 — Notifikace + SMS Brána
- [ ] `lib/sms/provider.ts` (interface + types), `lib/sms/smsbrana.ts` (SMSConnect), `lib/sms/noop.ts`, `lib/sms/index.ts` (getSmsProvider), `lib/sms/phone.ts` (normalizace).
- [ ] `lib/notifications/dispatch.ts` — jednotné `notify()` (in-app + e-mail + SMS dle preferencí).
- [ ] `lib/email/templates/generic-notification.tsx` (reuse portal-notification).
- [ ] UI preferencí: `app/portal/(app)/nastaveni/notifikace/` + `lib/actions/notification-prefs.ts`.
- [ ] Zapojit do existujících triggerů (nová faktura po splatnosti, deadline připomínka — cron).
- [ ] Testy: `__tests__/sms-smsbrana.test.ts`, `__tests__/notifications-dispatch.test.ts`.

## Fáze 6 — Kalendář napojení + návod
- [ ] Widget schůzek klienta v 360° (read `events` by client_id).
- [ ] `docs/navody/google-calendar-setup.md` (běží subagent).
- [ ] Odkaz z README na nový návod.

## Verifikace
- [ ] `npm run build` zelené.
- [ ] `npm test` zelené.
- [ ] Manuální smoke (dev server) — strom, firma picker, 360°, notifikace test tlačítko.

## Pořadí commitů
1. Fáze 1 + specs/plán.
2. Fáze 2.
3. Fáze 3.
4. Fáze 4.
5. Fáze 5.
6. Fáze 6 + finální verifikace.
