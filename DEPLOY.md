# Deploy ARBIQ na arbiq.cz

Projekt nasadíte do produkce přes **Vercel + Supabase + Resend**. Free tier všech tří služeb pokrývá běžný provoz pro start (~10k návštěv/měsíc, 500 MB DB, 3 000 e-mailů/měsíc). Plný setup zabere **60–90 minut**.

---

## 1) Příprava repozitáře (10 min)

Projekt zatím není v gitu. Inicializace + push na GitHub:

```bash
cd C:\Users\HP\arbiq-cz

git init
git add .
git commit -m "Initial commit: ARBIQ web + portal + CRM + admin"
```

Vytvořte si soukromý repo na **github.com/new** (název např. `arbiq-cz`, **Private**), pak:

```bash
git remote add origin https://github.com/<vaše-username>/arbiq-cz.git
git branch -M main
git push -u origin main
```

> `.gitignore` už chrání `.env.local` a `node_modules/` — žádné secrety se nahrají.

---

## 2) Supabase projekt (15 min)

1. **Sign-up** na <https://supabase.com/dashboard> (zdarma).
2. **New project** →
   - Name: `arbiq-prod`
   - Database password: vygenerujte silné, **uložte do password manageru** (potřebujete ho pak občas).
   - Region: **Frankfurt (eu-central-1)** — nejblíž ČR.
   - Plan: Free.
3. Po vytvoření (~2 min) → **Settings → API** zkopírujte:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` *(tajné, nikdy do gitu)*

### 2a) Aplikovat migraci

**Dashboard → SQL Editor → New query** → vložte celý obsah souboru `supabase/migrations/0001_init.sql` → **Run**. Vytvoří se 14 tabulek + triggery + RLS policies + Storage bucket `documents`.

### 2b) Vytvořit Vás jako admin

**Dashboard → Authentication → Users → Add user** (manuální):
- Email: `bartolomej@arbiq.cz`
- Password: vlastní (nebo "Send invite link")
- ✅ Auto Confirm User

Vrátí se zpět do **SQL Editor → New query** → vložte `supabase/seed-admin.sql` (přepište e-mail pokud jste použil jiný) → **Run**. Tím se Vám přiřadí role `admin` a stanete se výchozí osoba pro nové leady.

---

## 3) Resend (e-maily) (15 min)

1. **Sign-up** na <https://resend.com/signup> (zdarma do 3 000 e-mailů/měsíc).
2. **Domains → Add Domain → `arbiq.cz`**.
3. Resend Vám ukáže **3 DNS záznamy** (SPF / DKIM / DMARC). Přidejte je u registrátora domény (viz krok 5).
4. Po propagaci DNS (15 min – pár hodin) → tlačítko **Verify** v Resendu změní stav na ✅.
5. **API Keys → Create API Key** → typ `Sending access` → zkopírujte do `RESEND_API_KEY`.

---

## 4) Vercel deploy (15 min)

1. **Sign-up** na <https://vercel.com/signup> přes GitHub účet.
2. **Add New → Project → Import** repo `arbiq-cz`.
3. Framework: **Next.js** (auto-detect).
4. **Environment Variables** — vložte všechny:

   | Klíč | Hodnota |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | z Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | z Supabase |
   | `SUPABASE_SERVICE_ROLE_KEY` | z Supabase (**tajné**) |
   | `RESEND_API_KEY` | z Resend |
   | `RESEND_FROM` | `ARBIQ <noreply@arbiq.cz>` |
   | `RESEND_BCC_ADMIN` | `bartolomej@arbiq.cz` |
   | `APP_URL` | `https://arbiq.cz` |
   | `CRON_SECRET` | náhodný 32znakový řetězec (např. `openssl rand -hex 16`) |

5. **Deploy** → ~2 min build. Po dokončení Vám Vercel přidělí dočasnou URL `arbiq-cz-xxx.vercel.app` — otevřete a ověřte, že web funguje.

> Cron jobs (`overdue-invoices` denně v 6:00, `stale-clients` v pondělí v 7:00) se aktivují automaticky díky `vercel.json` v repu.

---

## 5) Doména arbiq.cz (15 min)

### 5a) Vercel custom domain

**Vercel projekt → Settings → Domains → Add → `arbiq.cz`**.

Vercel Vám ukáže **2 DNS záznamy** k přidání:
- `A` záznam pro root (`@`) → `76.76.21.21`
- `CNAME` pro `www` → `cname.vercel-dns.com`

### 5b) DNS u registrátora

Přihlaste se k registrátorovi domény `arbiq.cz` (Forpsi, Wedos, Active24, ...) a přidejte:

| Typ | Host | Hodnota | TTL |
|---|---|---|---|
| `A` | `@` | `76.76.21.21` | 3600 |
| `CNAME` | `www` | `cname.vercel-dns.com` | 3600 |
| **Resend SPF** (z kroku 3) | `@` | `v=spf1 include:_spf.resend.com ~all` | 3600 |
| **Resend DKIM** (z kroku 3) | `resend._domainkey` | dlouhý řetězec | 3600 |
| **Resend DMARC** *(volitelné)* | `_dmarc` | `v=DMARC1; p=none;` | 3600 |

Propagace 15 min – 24 h. Po propagaci:
- `https://arbiq.cz` ukáže váš web (Vercel mu udělá HTTPS automaticky přes Let's Encrypt).
- Resend si ověří doménu a začne posílat e-maily z `noreply@arbiq.cz`.

> Pokud máte u domény nějaké původní A/MX/TXT záznamy, **necháte je**. Přidáte jen tyhle nové. MX (e-mail příjem) Resendu nepoškozuje.

---

## 6) Ověřovací smoke test po deploy (5 min)

Otevřete `https://arbiq.cz` a zkuste:

1. **Homepage** → klik na "Klientská zóna" v navbaru → otevře se `/portal/login`.
2. **Přihlášení** s Vaším e-mailem + heslem → přesměruje na `/portal/admin/statistiky` (default pro admin).
3. **`/pripad/webove-stranky`** → projít 5-step → submit. Vám i klientovi přijde e-mail. V Supabase Table Editor vidíte nový řádek v `landing_leads` + auto-task v `crm_tasks`.
4. **`/rentgen`** → submit objednávku → přijde e-mail.
5. **`/portal/admin/uzivatele`** → vytvořte test obchodníka. Mělo by mu dorazit zvací e-mail s heslem.
6. **`/portal/admin/faktury`** → vytvořte test fakturu → CSV export.

Pokud cokoliv selže, prvním krokem je **Vercel → Deployments → poslední → Logs**. 90 % chyb tam najdete (chybějící env var, nesprávný klíč, atd.).

---

## 7) Co potom (volitelné)

- **Vlastní `noreply@arbiq.cz` e-mailovou schránku** přes Resend forwarding (Inbound) nebo přidat MX záznam k Vašemu mail providerovi.
- **Generování typů Database** pro lepší DX:
  ```bash
  npm i -g supabase
  npx supabase login
  npx supabase link --project-ref <váš-ref>
  npx supabase gen types typescript --linked > lib/types/database.ts
  git commit -am "Add generated DB types"
  git push
  ```
- **Plausible / GA4** — v `lib/analytics.ts` doplnit script + skript do `app/layout.tsx`. Cookie banner už máme.
- **Sentry** pro production error tracking — `npm i @sentry/nextjs && npx @sentry/wizard`.
- **Subdoména pro portál** (`portal.arbiq.cz`) — Vercel custom domain + rewrite v `next.config.ts`. Aktuálně portál žije pod `/portal/*` a to stačí.

---

## Stav po deploy — co bude fungovat

✅ Veřejný web na `arbiq.cz`
✅ 9 kampaňových landing pages s funkčním 5-step dotazníkem → DB + e-mail
✅ Rentgen objednávkový flow → DB + e-mail
✅ Kontaktní formulář → DB + e-mail
✅ Klientská zóna `/portal/*` (klient/obchodník/admin role)
✅ CRM s kanban pipeline, leady, úkoly, konverze leadu na klienta
✅ Admin panel: uživatelé, projekty, faktury, doporučení, statistiky
✅ E-mailové notifikace pro klienty (nová zpráva, faktura, doporučení)
✅ Cron jobs (po splatnosti, neaktivní klienti)
✅ Cookie banner s GDPR souhlasy

❌ Co chybí dodat:
- Foto Václava Plachejdy do `public/tym/vaclav.jpg` (zatím avatar s "V")
- Screenshot Wood&Steak (`woodandsteak.jpg`) je staré — můžete dodat nový
- OG image pro social sharing (`public/og-image.png`, 1200×630)
- Cal.com / Calendly link pokud chcete real booking u "Schůzka"
