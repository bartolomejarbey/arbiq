# Klient / Firma + Operační centrum klienta — návrh

**Datum:** 2026-06-05
**Větev:** `feat/klient-firma-operacni-centrum`
**Stav:** schváleno uživatelem (rozhodnutí níže), implementuje se bez review gate na přání uživatele.

## Cíl

Šest provázaných úprav CRM portálu ARBIQ:

| # | Oblast | Cíl |
|---|--------|-----|
| A | Model **Klient vs. Firma** | Firma je samostatná entita (`firmy`), 1 klient-osoba → N firem. Faktury/smlouvy/nabídky/projekty dostanou `firma_id`. |
| B | Rozklikávací **strom klientů** | Seznam Klienti = strom: osoba → rozbalí firmy (+ projekty). |
| C | **Mazání klientů** | Tlačítko Smazat nabídne volby: archivovat (soft) NEBO tvrdě smazat jen když nemá doklady. |
| D | **360° operační centrum** | Detail klienta = jedno místo: komunikace, faktury, smlouvy, nabídky, projekty, **deadliny**, schůzky, úkoly, dokumenty. |
| E | **Notifikace e-mail + SMS** | Jednotná notifikační vrstva; SMS přes SMS Brána (smsbrana.cz); per-typ preference. |
| F | **Kalendář + návod** | Obousměrný Google kalendář už v kódu existuje → napojit do 360° a dodat čistý setup návod. |

## Klíčová rozhodnutí (od uživatele)

1. **Samostatná tabulka `firmy`** (ne ponechání `parent_client_id` hacku).
2. **Vše přes firmu**: fakturační identita (IČO/DIČ/adresa/název/billing_email/contract_email) žije na **firmě**. OSVČ/soukromník = firma s názvem = jméno osoby. Osoba (profil) drží jen kontakt (jméno, e-mail, telefon, login).
3. **Mazání = volby** (archivovat / tvrdě smazat bez dokladů).
4. **Kalendář běží** → jen napojit + návod.
5. **SMS = obecný adaptér + konkrétní SMS Brána implementace** + per-typ preference.
6. **Detail klienta = operační centrum, kde je vidět VŠECHNO** (explicitní přání uživatele). Samostatná stránka Firmy je OK, ale 360° přehled je na klientovi.

## Datový model

### Nová tabulka `firmy`
```
firmy
  id uuid pk
  client_id uuid -> profiles(id) on delete cascade   -- vlastník = osoba
  nazev text not null
  ico, dic, street, city, zip text
  country text default 'CZ'
  billing_email, contract_email text
  representative_name, phone, website_url text
  is_primary boolean default false                    -- výchozí firma klienta
  archived_at timestamptz
  notes text
  created_at, updated_at
```

### `firma_id` na dokladech
`invoices`, `contracts`, `quotes`, `projects` dostanou `firma_id uuid -> firmy(id) on delete set null` (nullable — historická data + jednorázové faktury bez firmy).
PDF faktury/smlouvy zůstává **právním snapshotem** (uloženo ve storage), takže pozdější editace firmy nemění vystavené doklady.

### Migrace stávajících dat (idempotentní, additivní)
- Pro **každý top-level klient profil** (`parent_client_id IS NULL`, role=`klient`): vytvoř `firmy` řádek vlastněný jím (`client_id = profile.id`), `nazev = company || full_name`, převezmi ico/dic/street/city/billing_email/contract_email. `is_primary = true`.
- Pro **child profily** (`parent_client_id IS NOT NULL`): vytvoř `firmy` řádek vlastněný **rodičem** (`client_id = parent_client_id`) z identity child profilu.
- Pro každý existující `invoices/contracts/quotes/projects` nastav `firma_id` = firma odpovídající jeho `client_id`.
- Staré sloupce na `profiles` (`company`, `ico`, `dic`, `street`, `city`, `parent_client_id`) **zůstávají** (zpětná kompatibilita, deprecate později) — migrace nic nemaže.

### Soft-delete klienta
`profiles.archived_at timestamptz` (odlišné od `is_active`, které řídí login/lockout). Archivovaný klient zmizí ze seznamů, data zůstanou, jde obnovit.

### Notifikační kanály
`profiles.sms_notifications_enabled boolean default false`. (E-mail už má `email_notifications_enabled`.) Per-typ preference: tabulka `notification_prefs(user_id, type, email boolean, sms boolean, inapp boolean)` s rozumnými defaulty; chybějící řádek = default zapnuto pro e-mail+in-app, SMS jen pro vybrané typy.

## RLS
- `firmy`: stejný vzor jako `invoices` — klient čte své (`client_id = auth.uid()`), obchodník `is_my_client(client_id)`, admin vše. Zápis admin + obchodník (přes service-role v server actions, scopováno v kódu, konzistentní se zbytkem).
- `is_my_firma(firma uuid)` helper (SECURITY DEFINER) pro čtení dokladů přes firmu.
- `notification_prefs`: self read/write.

## E (Notifikace + SMS) — architektura
```
lib/notifications/dispatch.ts   -> notify({ userId, type, title, body, link, sms? })
   ├─ in-app:  insert do notifications (existující)
   ├─ e-mail:  sendEmail() (Resend, existující) — pokud email_notifications_enabled + pref
   └─ sms:     sendSms() — pokud sms_notifications_enabled + pref + má telefon
lib/sms/provider.ts   -> interface SmsProvider { send(to, text): Promise<SmsResult> }
lib/sms/smsbrana.ts   -> SMSConnect HTTP API (secure auth: time + salt + md5(password+time+salt))
lib/sms/index.ts      -> getSmsProvider(): vybere dle env (SMSBRANA_* → SmsBranaProvider, jinak NoopProvider)
```
- SMS Brána endpoint `https://api.smsbrana.cz/smsconnect/http.php`, `action=send_sms`, secure auth.
- Env: `SMSBRANA_LOGIN`, `SMSBRANA_PASSWORD`, `SMSBRANA_SENDER_ID` (v `.env.local`, nikdy v gitu).
- Telefon normalizace na `+420…` / mezinárodní formát.
- Bez SMSBRANA_* → `NoopProvider` (loguje, nic neposílá) → vrstva je „připravená na vložení API".

## F (Kalendář) — napojení
- 360° přehled načte `events` kde `client_id = <klient>` (nadcházející schůzky) — read-only widget + odkaz na `/portal/crm/kalendar`.
- Deadliny agregace: invoices.due_date (nezaplacené), contracts.deadline/deadline_days, quotes.valid_until, projects.estimated_end_date, crm_tasks.due_date, events.start_at.
- Návod: `docs/navody/google-calendar-setup.md` (řeší prázdné `GOOGLE_OAUTH_CLIENT_ID/SECRET`).

## D (Operační centrum) — sekce
Detail klienta `app/portal/(app)/crm/klient/[id]`:
1. Hlavička: osoba (jméno, kontakt, obchodník, stav) + akce (Upravit, Smazat/Archiv, Pozvat).
2. **Firmy** klienta (karty: název, IČO/DIČ, primární) + „Přidat firmu".
3. **Nadcházející deadliny** (agregovaná časová osa — faktury po/před splatností, deadliny smluv/projektů, platnost nabídek, úkoly, schůzky).
4. Projekty / Nabídky / Smlouvy / Faktury (existující tabulky, rozšířené o firmu).
5. **Komunikace** (e-mailová korespondence — existující, + odpovědní formulář).
6. Úkoly (crm_tasks) + Schůzky (events) + Dokumenty.
Layout: kalmý sepia, sekce ne taby (jedno scroll-místo = „operační centrum"). Sdílené přes lehké komponenty v `components/portal/klient/*`.

## Bezpečnost
- SMS Brána klíče jen v env, server-only (`import 'server-only'` v lib/sms/*).
- Migrace additivní, žádné DROP; aplikace na prod jen po potvrzení uživatele.
- Zod validace nových vstupů (firma form, delete confirm).
- Hard-delete klienta: server-side guard ověří 0 faktur/smluv/nabídek/projektů; jinak zamítne a nabídne archiv. Self/last-admin guard jako u `setUserActive`.

## Testy
- `lib/sms/smsbrana` unit test: secure auth hash, číslo normalizace, parsování XML odpovědi, env gating (Noop fallback).
- `lib/notifications/dispatch` test: respektuje preference a `*_notifications_enabled`.
- Smoke: `next build` + `vitest run` zelené.

## Mimo rozsah (zatím)
- Re-pointing `client_id` legacy child profilů (necháváme, agregujeme).
- Mazání starých sloupců `profiles.company/ico/...` (deprecate později).
- SMS doručenky/DLR webhook, plánované SMS.
