This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## Google Calendar (CRM)

`/portal/crm/kalendar` poskytuje obousměrně synchronizovaný kalendář napojený na primární Google Calendar každého obchodníka/admina. Spec a plán: `docs/superpowers/specs/2026-05-12-google-calendar-crm-design.md`, `docs/superpowers/plans/2026-05-12-google-calendar-crm.md`.

> **Zprovoznění (Google Cloud Console + `.env`):** krok-za-krokem návod je v [`docs/navody/google-calendar-setup.md`](docs/navody/google-calendar-setup.md). Pozor: `GOOGLE_OAUTH_CLIENT_ID` a `GOOGLE_OAUTH_CLIENT_SECRET` jsou zatím prázdné — dokud je nevyplníš podle návodu, kalendář se k Googlu nepřipojí.

### Google Cloud Console setup (jednou per environment)

1. https://console.cloud.google.com → vytvořit projekt `ARBIQ Calendar` (nebo použít existující).
2. **APIs & Services → Enabled APIs** → enable **Google Calendar API**.
3. **OAuth consent screen:**
   - User Type: **External** (Workspace = Internal)
   - App name: ARBIQ
   - User support email: `info@arbiq.cz`
   - Scopes: `.../auth/calendar.events`, `.../auth/calendar.readonly`, `.../auth/userinfo.email`
   - Test users (External + nepublikovaný): všichni obchodníci
4. **Credentials → Create OAuth 2.0 Client ID:**
   - Type: **Web application**
   - Authorized JavaScript origins:
     - `http://localhost:3000` (dev)
     - `https://arbiq.cz` (prod)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/google/oauth/callback` (dev)
     - `https://arbiq.cz/api/google/oauth/callback` (prod)
5. Zkopírovat Client ID + Secret → `.env.local`:
   ```
   GOOGLE_OAUTH_CLIENT_ID=xxx.apps.googleusercontent.com
   GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-...
   ```
6. Encryption key (generuj jednou, NEMĚNIT po prvním connectu — invalidovaly by se zašifrované refresh tokeny):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
   Hodnotu → `GOOGLE_OAUTH_ENCRYPTION_KEY` v `.env.local`.

### Webhooky v lokálním devu

Google `events.watch` vyžaduje **HTTPS endpoint**. Pro lokální dev použijte `ngrok`:

```bash
ngrok http 3000
# Zkopírujte HTTPS URL (např. https://abc123.ngrok.io)
# Nastavte v .env.local:
APP_URL=https://abc123.ngrok.io
# A v Google Console přidejte tu URL do Authorized redirect URIs:
# https://abc123.ngrok.io/api/google/oauth/callback
```

Bez ngrok inbound sync nebude fungovat real-time — bude jen safety poll každých 5 min.

### Co je v v1

- OAuth flow (per-user, primary calendar)
- Bidirectional sync (outbound write-through + inbound webhook + 5min poll)
- 4 views: Den, Týden (default), Měsíc, Agenda (mobile default)
- CRUD eventů přes UI: vytvořit / upravit / smazat
- Drag-to-move + resize hran (snap na 15 min)
- Google Meet auto-generation (toggle u create)
- Attendees (volný email seznam)
- Sdílení s týmem (`visibility=shared` → Google attendees s `sendUpdates:'none'`)
- CRM linky: lead / klient / projekt (max 1 na event, raw UUID input)
- Klávesnice: `←`/`→` nav, `T` dnes, `D`/`W`/`M`/`A` pohledy, `N` nová, `Esc` zavřít
- Conflict detection (412) + banner v side-panelu

### Co není v v1 (plánováno)

- Recurring events (RRULE)
- Custom per-event reminders (Google native funguje)
- Multi-calendar (jen primární)
- CRM link picker UI (zatím UUID)
- Drag-to-create na prázdné grid (zatím +Nová schůzka button)
- iCal export

### Vercel Cron jobs

V `vercel.json`:
- `/api/cron/calendar-poll` — každých 5 min, safety net pull
- `/api/cron/calendar-watch-renew` — denně 03:00, prodlouží watch channely
- `/api/cron/calendar-retry` — každých 5 min, retry eventů se `sync_status='error'`

Všechny vyžadují `?token=$CRON_SECRET`.

### Supabase CLI

Binárka v `~/bin/supabase.exe` (winget package neexistuje, npm distribuce ukončena). Pro bash session:

```bash
export PATH="$HOME/bin:$PATH"
export SUPABASE_ACCESS_TOKEN=$(grep '^SUPABASE_ACCESS_TOKEN=' .env.local | cut -d= -f2-)
supabase migration list --linked
supabase db push --linked
supabase gen types typescript --linked > lib/types/database.ts
```

Pozor: `supabase gen types` emituje `Initialising login role...` na stdout — strip první řádek před uložením. Plugin také může injectovat `<claude-code-hint>` tag na konec — strip taky.

