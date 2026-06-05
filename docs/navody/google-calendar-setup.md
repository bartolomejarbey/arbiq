# Propojení Google Kalendáře s ARBIQ CRM

Tento návod tě krok za krokem provede tím, jak propojit Google Kalendář s CRM v aplikaci ARBIQ. Funkce kalendáře je **už hotová v kódu** — jediné, co chybí, je vytvořit OAuth aplikaci v Google Cloud Console a doplnit dvě prázdné hodnoty do `.env.local`. Po dokončení bude kalendář fungovat obousměrně.

> **Aktuální stav:** v souboru `.env.local` jsou `GOOGLE_OAUTH_CLIENT_ID` a `GOOGLE_OAUTH_CLIENT_SECRET` **prázdné**, takže napojení na Google zatím nefunguje. Klíč `GOOGLE_OAUTH_ENCRYPTION_KEY` už nastavený **je** a **nesmí se měnit** (viz krok 6). Smyslem tohoto návodu je doplnit ty dvě chybějící hodnoty.

---

## 1. Přehled / co tím získáš

ARBIQ CRM má hotovou obousměrnou synchronizaci s Google Kalendářem:

- **Z CRM do Googlu:** událost, kterou vytvoříš v `/portal/crm/kalendar`, se zapíše do tvého Google Kalendáře.
- **Z Googlu do CRM:** událost vytvořená nebo upravená přímo v Google Kalendáři se promítne zpět do CRM.
- **Real-time webhooky:** Google posílá oznámení o změnách přes tzv. watch kanály (na produkci nebo přes ngrok v devu).
- **Záložní polling:** pokud webhook selže nebo neběží, cron `/api/cron/calendar-poll` každých 5 minut dorovná stav, aby nic neuteklo.

Co už je v kódu hotové (nemusíš nic programovat):

- Route `/portal/crm/kalendar` (samotný kalendář) a `/portal/nastaveni/kalendar` (připojení účtu).
- Knihovny `lib/google/oauth.ts`, `lib/google/calendar.ts`, `lib/google/encryption.ts`.
- OAuth callback `/api/google/oauth/callback`.
- DB migrace `supabase/migrations/0006_calendar.sql` (tabulky `events`, `google_oauth_connections`, `event_sync_log`).
- Cron joby ve `vercel.json`:
  - `/api/cron/calendar-poll` — každých 5 minut (záložní synchronizace),
  - `/api/cron/calendar-watch-renew` — denně v 03:00 (obnova watch kanálů),
  - `/api/cron/calendar-retry` — každých 5 minut (opakování neúspěšných synchronizací).
  - Všechny crony vyžadují parametr `?token=$CRON_SECRET`.

**Chybí jen jedno:** napojení na Google (OAuth Client ID a Secret). To vyřešíš v krocích 2 až 6.

---

## 2. Google Cloud Console — vytvoření projektu

1. Otevři [Google Cloud Console](https://console.cloud.google.com/).
2. Přihlas se účtem, pod kterým chceš aplikaci spravovat (ideálně firemní účet ARBIQ).
3. Nahoře v liště klikni na **přepínač projektů** (vedle loga Google Cloud).
4. V dialogu klikni vpravo nahoře na **New project** / **Nový projekt**.
5. Vyplň:
   - **Project name / Název projektu:** např. `ARBIQ CRM`
   - **Organization / Location:** ponech výchozí (nebo vyber organizaci ARBIQ, pokud ji máš).
6. Klikni na **Create / Vytvořit** a počkej pár sekund.
7. Po vytvoření znovu otevři přepínač projektů a ujisti se, že je **vybraný nově vytvořený projekt** (jeho název musí být vidět nahoře v liště). Všechny další kroky musíš dělat v tomto projektu.

---

## 3. Povolení Google Calendar API

1. V levém menu (hamburger vlevo nahoře) jdi do **APIs & Services → Library** (Knihovna).
   - Přímý odkaz: <https://console.cloud.google.com/apis/library>
2. Do vyhledávacího pole napiš `Google Calendar API`.
3. Klikni na výsledek **Google Calendar API**.
4. Klikni na modré tlačítko **Enable / Povolit**.
5. Žádné další API povolovat nemusíš — e-mail uživatele se získává přes scope `userinfo.email`, který je součástí OAuth.

> Pokud Calendar API nepovolíš, připojení projde, ale synchronizace skončí chybou „API not enabled".

---

## 4. OAuth consent screen (souhlasná obrazovka)

Tady definuješ, co uvidí uživatel při přihlašování přes Google.

1. V levém menu jdi do **APIs & Services → OAuth consent screen**.
   - Přímý odkaz: <https://console.cloud.google.com/apis/credentials/consent>
2. Jako **User Type** vyber **External** a klikni **Create**.
   - (Možnost *Internal* je dostupná jen u Google Workspace organizací a omezila by přístup na účty ze stejné domény. Pro běžný účet vyber **External**.)
3. **App information:**
   - **App name:** `ARBIQ`
   - **User support email:** `info@arbiq.cz`
   - **App logo:** volitelné.
4. **App domain** (volitelné, ale vyplň, pokud chceš později žádat o ověření):
   - **Application home page:** `https://arbiq.cz`
   - **Authorized domains:** přidej `arbiq.cz`
5. **Developer contact information:** `info@arbiq.cz`
6. Klikni **Save and Continue**.
7. **Scopes:** klikni **Add or remove scopes** a přidej přesně tyto tři (najdeš je vyhledáním podle názvu API nebo vložením do filtru):
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/userinfo.email`

   Potvrď **Update** a pak **Save and Continue**.
8. **Test users:** klikni **Add users** a přidej **e-mailovou adresu každého, kdo bude kalendář připojovat** (např. svůj vlastní e-mail a `info@arbiq.cz`). Toto je důležité — viz vysvětlení níže.
9. **Save and Continue** a na souhrnu **Back to Dashboard**.

### Publikováno vs. Testing — důležité!

OAuth consent screen má dva režimy:

- **Testing (výchozí):** aplikaci může použít **jen** ten, koho přidáš mezi *test users*. Velká nevýhoda: **refresh tokeny vyprší po 7 dnech**. To znamená, že po týdnu se připojení rozpadne a uživatel musí účet připojit znovu (v aplikaci to vypadá jako chyba `invalid_grant`).
- **In production / Publikováno:** aplikaci může použít kdokoliv a refresh tokeny **nevyprší** (drží, dokud uživatel přístup neodvolá). U citlivých scopes (což `calendar` je) ale Google může vyžadovat **ověření aplikace (verification)** — to je proces, kde Google kontroluje, jak data používáš. Bez ověření se uživatelům zobrazí varování o neověřené aplikaci (viz krok 10) a u některých scopes nemusí pustit dál.

**Doporučení:**

- **Pro testování / interní použití pár lidí:** nech režim **Testing** a přidej všechny uživatele jako *test users*. Počítej s tím, že připojení je potřeba každých 7 dní obnovit (znovu kliknout na připojení Google v `/portal/nastaveni/kalendar`).
- **Pro produkční nasazení:** klikni na **Publish app** (tlačítko na obrazovce OAuth consent screen) a projdi případným ověřením. Po publikaci refresh tokeny nevyprší.

---

## 5. Vytvoření OAuth 2.0 Client ID

1. V levém menu jdi do **APIs & Services → Credentials**.
   - Přímý odkaz: <https://console.cloud.google.com/apis/credentials>
2. Nahoře klikni **+ Create Credentials → OAuth client ID**.
3. **Application type:** vyber **Web application**.
4. **Name:** např. `ARBIQ CRM Web`.
5. **Authorized JavaScript origins** — klikni **Add URI** a přidej obě (každou zvlášť):
   - `http://localhost:3000` (vývoj)
   - `https://arbiq.cz` (produkce)
6. **Authorized redirect URIs** — klikni **Add URI** a přidej (každou zvlášť, přesně, včetně cesty):
   - `http://localhost:3000/api/google/oauth/callback` (vývoj)
   - `https://arbiq.cz/api/google/oauth/callback` (produkce)

   > Cesta `/api/google/oauth/callback` musí sedět **přesně** — je to ta, kterou používá kód v `lib/google/oauth.ts` ve tvaru `{APP_URL}/api/google/oauth/callback`. Když se URI neshodne, Google vrátí chybu `redirect_uri_mismatch`.

   > Pokud budeš testovat webhooky lokálně přes ngrok (krok 7), přidej sem ještě i `https://<tvoje-ngrok-domena>/api/google/oauth/callback`.
7. Klikni **Create**.
8. Objeví se okno s **Client ID** a **Client secret**. **Zkopíruj si obě hodnoty** (Client secret později najdeš i přes ikonu u klienta v seznamu Credentials, případně si stáhni JSON). Tyto dvě hodnoty potřebuješ v dalším kroku.

---

## 6. Vyplnění `.env.local`

Otevři soubor `.env.local` v kořeni projektu (`C:\Users\HP\arbiq-cz\.env.local`) a doplň dvě prázdné hodnoty z kroku 5:

```dotenv
# OAuth credentials z Google Cloud Console (krok 5) — TADY DOPLŇ
GOOGLE_OAUTH_CLIENT_ID=tvuj-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=tvuj-client-secret

# Šifrovací klíč pro uložené refresh tokeny — UŽ JE NASTAVENÝ, NESAHAT!
GOOGLE_OAUTH_ENCRYPTION_KEY=...uz-nastaveno-nemenit...

# URL aplikace — v devu localhost, v produkci https://arbiq.cz
APP_URL=http://localhost:3000
```

Důležité:

- **`GOOGLE_OAUTH_CLIENT_ID`** = Client ID z kroku 5 (končí na `.apps.googleusercontent.com`).
- **`GOOGLE_OAUTH_CLIENT_SECRET`** = Client secret z kroku 5.
- **`GOOGLE_OAUTH_ENCRYPTION_KEY` UŽ JE NASTAVENÝ — NEMĚŇ HO A NEGENERUJ ZNOVU.** Tímto klíčem jsou šifrované refresh tokeny uložené v databázi. Když ho změníš, **všechny dříve uložené tokeny se stanou nečitelnými** a každý uživatel bude muset připojit účet znovu.
- **`APP_URL`** musí odpovídat redirect URI v Googlu. V devu `http://localhost:3000` (případně ngrok URL — krok 7), v produkci `https://arbiq.cz`.

Po úpravě **restartuj dev server**, aby se nové proměnné načetly:

```bash
# zastav bezici "npm run dev" (Ctrl+C) a spust znovu
npm run dev
```

> Proměnné v `.env.local` se načítají jen při startu. Bez restartu zůstanou Client ID a Secret prázdné a připojení selže.

---

## 7. Lokální vývoj s ngrok (webhooky / HTTPS)

Google posílá real-time oznámení o změnách kalendáře (watch kanály) **jen na veřejnou HTTPS adresu**. `http://localhost:3000` z internetu není dostupný, takže webhooky lokálně bez tunelu fungovat nemůžou.

**Kdy ngrok potřebuješ:**

- Chceš lokálně testovat **okamžitou** synchronizaci z Googlu do CRM (real-time webhooky).

**Kdy ngrok nepotřebuješ:**

- Stačí ti samotné připojení účtu a synchronizace **z CRM do Googlu**, plus záložní **poll každých 5 minut**. Bez ngroku jen nedostáváš okamžité webhooky — změny z Googlu se projeví se zpožděním až 5 minut přes `/api/cron/calendar-poll`. (Cron v lokálním devu sám neběží, musel bys ho spustit ručně dotazem na `/api/cron/calendar-poll?token=$CRON_SECRET`.)

**Postup s ngrok:**

1. Nainstaluj a přihlas [ngrok](https://ngrok.com/download).
2. Spusť tunel na port dev serveru:

   ```bash
   ngrok http 3000
   ```

3. Zkopíruj vygenerovanou HTTPS adresu, např. `https://abcd-1234.ngrok-free.app`.
4. V `.env.local` nastav `APP_URL` na tuto adresu:

   ```dotenv
   APP_URL=https://abcd-1234.ngrok-free.app
   ```

5. V Google Cloud Console (krok 5) přidej do **Authorized redirect URIs** novou hodnotu:

   ```text
   https://abcd-1234.ngrok-free.app/api/google/oauth/callback
   ```

   a do **Authorized JavaScript origins** přidej `https://abcd-1234.ngrok-free.app`.
6. **Restartuj dev server** (kvůli změně `APP_URL`).
7. Připoj účet podle kroku 9. Watch kanál se teď zaregistruje na ngrok URL a webhooky budou chodit.

> Ngrok URL se u free plánu mění při každém spuštění — po novém startu ngroku musíš znovu aktualizovat `APP_URL` i redirect URI v Googlu a připojit účet znovu.

---

## 8. Produkce na Vercelu

V produkci se používají stejné proměnné, jen nastavené ve Vercelu (ne v `.env.local`).

1. Otevři projekt ve [Vercel Dashboard](https://vercel.com/) → **Settings → Environment Variables**.
2. Přidej (pro prostředí **Production**, případně i **Preview**) tyto proměnné:

   ```text
   GOOGLE_OAUTH_CLIENT_ID       = <Client ID z kroku 5>
   GOOGLE_OAUTH_CLIENT_SECRET   = <Client secret z kroku 5>
   GOOGLE_OAUTH_ENCRYPTION_KEY  = <stejna hodnota jako v .env.local — nemenit!>
   APP_URL                      = https://arbiq.cz
   CRON_SECRET                  = <tajny retezec pro cron joby>
   ```

   - `GOOGLE_OAUTH_ENCRYPTION_KEY` musí být **identický** s tím v `.env.local`, jinak by produkce nepřečetla tokeny zašifrované jinde (a naopak). Drž jeden klíč napříč prostředími.
   - `APP_URL` v produkci je `https://arbiq.cz` — proto musí být v Googlu povolené redirect URI `https://arbiq.cz/api/google/oauth/callback` (krok 5).
   - `CRON_SECRET` chrání cron endpointy. Vercel ho posílá automaticky, endpointy ho vyžadují jako `?token=$CRON_SECRET`.
3. Po přidání proměnných **udělej nový deploy** (Vercel je načte až při dalším buildu / deployi).
4. **Cron joby běží automaticky** podle `vercel.json` — nemusíš nic nastavovat ručně:
   - `/api/cron/calendar-poll` — `*/5 * * * *` (každých 5 min),
   - `/api/cron/calendar-watch-renew` — `0 3 * * *` (denně 03:00),
   - `/api/cron/calendar-retry` — `*/5 * * * *` (každých 5 min).

   Všechny tři potřebují ke spuštění platný `CRON_SECRET`. Pokud `CRON_SECRET` chybí nebo nesedí, crony skončí chybou a synchronizace na pozadí nepoběží.

---

## 9. Připojení účtu v aplikaci

Když máš vyplněné Client ID a Secret a restartovaný server (krok 6):

1. Otevři v prohlížeči `/portal/nastaveni/kalendar` (v devu `http://localhost:3000/portal/nastaveni/kalendar`).
2. Klikni na tlačítko **Připojit Google** (Connect Google Calendar).
3. Přesměruje tě to na **Google OAuth souhlasnou obrazovku**. Přihlas se účtem, který je mezi *test users* (pokud je aplikace v režimu Testing).
4. Pokud uvidíš varování, že Google aplikaci neověřil (anglicky „Google has not verified this app"), klikni na **Advanced → Go to ARBIQ (unsafe)** — u nepublikované aplikace je to normální (viz krok 10).
5. Odsouhlas požadovaná oprávnění ke kalendáři.
6. Google tě přesměruje zpět na `/api/google/oauth/callback` a dál do aplikace.
7. Ověř, že stav připojení je **„connected"** (připojeno) — na stránce `/portal/nastaveni/kalendar` se zobrazí připojený účet a jeho e-mail.
8. Otevři `/portal/crm/kalendar`, vytvoř testovací událost a zkontroluj, že se objeví v Google Kalendáři (a obráceně, že se událost z Google Kalendáře objeví v CRM).

---

## 10. Troubleshooting

### `redirect_uri_mismatch`
Redirect URI, kterou aplikace posílá, není v Googlu povolená.
- Zkontroluj, že `APP_URL` v `.env.local` (nebo ve Vercelu) přesně odpovídá doméně v **Authorized redirect URIs**.
- URI se musí shodovat **na znak**, včetně `http` vs `https`, portu a cesty `/api/google/oauth/callback`. Žádné lomítko navíc na konci.
- Po změně redirect URI v Googlu počkej chvíli (změny se občas propisují s drobným zpožděním) a restartuj dev server.

### `access_blocked` / aplikace není ověřená Googlem
Aplikace je v režimu **Testing** nebo není ověřená Googlem.
- Přidej daný e-mail mezi **test users** (krok 4, bod 8).
- Pro vývoj na varovné obrazovce klikni na **Advanced → Go to ARBIQ (unsafe)** a pokračuj.
- Pro produkci aplikaci **publikuj** (Publish app) a případně projdi ověřením scopes.

### `invalid_grant` po cca 7 dnech
Refresh token vypršel — typické pro **nepublikovanou External** aplikaci v režimu Testing (tokeny tam platí jen 7 dní).
- Krátkodobé řešení: znovu klikni na **Připojit Google** v `/portal/nastaveni/kalendar` (vystaví se nový token).
- Trvalé řešení: **publikuj** aplikaci (krok 4) — pak refresh tokeny nevyprší.

### Připojení vůbec nezačne nebo hned spadne (prázdné Client ID / Secret)
- Zkontroluj, že `GOOGLE_OAUTH_CLIENT_ID` a `GOOGLE_OAUTH_CLIENT_SECRET` v `.env.local` **nejsou prázdné** (to je výchozí problém, kvůli kterému je tento návod).
- Po jejich doplnění **restartuj dev server** — bez restartu se nové hodnoty nenačtou.
- Ve Vercelu po přidání proměnných spusť **nový deploy**.

### `No refresh_token returned`
Google nevrátil refresh token (vrací ho jen při prvním souhlasu nebo s parametrem `prompt=consent`).
- Kód už `prompt=consent` posílá, takže by se to stávat nemělo. Když nastane, **odpoj a znovu připoj** účet, případně v Google účtu (Zabezpečení → Aplikace třetích stran, <https://myaccount.google.com/connections>) odeber přístup ARBIQ a připoj znovu.

### Synchronizace z Googlu nechodí v reálném čase (jen se zpožděním)
- V lokálním devu bez **ngroku** webhooky nefungují — viz krok 7. Spusť ngrok a nastav `APP_URL` na ngrok URL.
- V produkci ověř, že běží cron `calendar-watch-renew` a že watch kanály jsou platné.

### Změnil se `GOOGLE_OAUTH_ENCRYPTION_KEY`
Pokud někdo klíč přegeneroval, **všechny dříve uložené refresh tokeny jsou nečitelné**.
- Vrať původní hodnotu klíče, pokud ji máš zálohovanou.
- Pokud původní klíč není k dispozici, musí **každý uživatel znovu připojit účet** (`/portal/nastaveni/kalendar` → Připojit Google).
- Do budoucna: tento klíč drž stejný napříč `.env.local` i Vercelem a **nikdy ho neměň** za běhu.

### Cron joby nic nedělají
- Zkontroluj, že je ve Vercelu nastavený `CRON_SECRET` a že endpointy dostávají `?token=$CRON_SECRET`.
- Cron běží jen na **deploynuté** aplikaci ve Vercelu, ne v lokálním devu (lokálně si poll spustíš ručně dotazem na `/api/cron/calendar-poll?token=<tvuj CRON_SECRET>`).

---

**Hotovo.** Po doplnění Client ID a Secret, restartu serveru a připojení účtu v `/portal/nastaveni/kalendar` (status „connected") máš obousměrný sync Google Kalendáře plně funkční.
