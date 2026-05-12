# Google Calendar v ARBIQ CRM — design spec

**Datum:** 2026-05-12
**Autor:** Bartoloměj Rota (s asistencí Claude Opus 4.7)
**Status:** approved (brainstorming hotový, čeká se na implementační plán)

---

## 1. Cíl

Vlastní, high-end, "Google-inspired" kalendář v portálu ARBIQ (`/portal/(app)/crm/kalendar`), který je **obousměrně synchronizovaný** s Google Calendarem každého obchodníka/admina. Sepia design system (espresso/coffee/tobacco/caramel), klidná typografie portálu, ostré 0px rohy.

## 2. Klíčová rozhodnutí

| # | Otázka | Volba | Důsledek |
|---|---|---|---|
| Q1 | Kdo používá kalendář? | **D — hybrid per-uživatel + sdílené eventy** | Per-user OAuth tokeny, RLS na eventech, `visibility` flag (`private` \| `shared`) |
| Q2 | Co se synchronizuje? | **A — jen `events`** | Žádné `crm_tasks` / `milestones` / invoice dates do Google; čistá separace todo vs schedule |
| Q3 | Který Google kalendář? | **A — vždy primární** | Žádný picker. Osobní eventy (zubař, gym) tečou do ARBIQ → vizuálně se odliší jako "🔒 soukromé" bez detailu |
| Q4 | Shape eventu | **B — meeting-ready** | title, description, start/end, location, attendees (email list), Google Meet toggle; **žádné recurring** v1 |
| Q5 | Sdílené eventy v Google | **B — Google attendees + `sendUpdates: 'none'`** | Sdílení = autor přidá ostatní obchodníky jako Google attendees → event se zjeví v jejich primárním Google kalendáři |

### Autonomní defaults (industry standard)

| Téma | Volba |
|---|---|
| Sync mechanismus | `events.watch` webhooky + 5min safety poll + 24h full re-sync |
| Konfliktní zápis | ETag optimistic concurrency, 412 → fetch Google verze → UI merge "Vaše \| Google" |
| Token storage | `pgp_sym_encrypt` (pgcrypto), refresh long-lived, access on-demand |
| Initial sync window | budoucnost + posledních 30 dní, dál inkrementálně přes `syncToken` |
| Timezone | UTC v DB, render `Europe/Prague` |
| Reminders | Google's nativní (per-user settings), v1 bez custom |

## 3. MVP cut

**v1 (tato spec):**
- OAuth flow (per-user, primary calendar)
- Bidirectional sync (outbound write-through, inbound webhook + poll)
- Views: Den, Týden, Měsíc, Agenda
- CRUD eventů s drag-and-drop, resize, click-to-edit side-panel
- Attendees (free email list), Google Meet auto-generation toggle
- Linky na lead / klient / projekt (max jeden)
- `visibility: private | shared`, sharing přes Google attendees
- Sync status bar + connection management UI
- Klávesnice: ←/→ nav, T dnes, D/W/M/A pohledy, N nová, Esc panel

**v2 (later, mimo tuto spec):**
- Recurring events (RRULE)
- Custom per-event reminders
- Multi-calendar (uživatel připojí víc Google kalendářů)
- Mobile gesture polish (long-press, swipe)
- Read-receipt / response status UI pro attendees

## 4. Architektura

**Local mirror + bidirectional sync.** UI čte výhradně z Supabase. Sync engine řeší push i pull. Důvody: rychlé UI (žádná Google API latence per render), funguje při Google outage, RLS jednoduché, CRM linky jako foreign keys.

```
┌─────────────────┐   write   ┌────────────┐   API   ┌────────────────┐
│  Server Action  │──────────▶│  Supabase  │────────▶│ Google Calendar│
│ (createEvent…)  │           │   events   │         │    primary     │
└─────────────────┘           └────────────┘         └────────────────┘
                                    ▲                        │
                                    │                        │ events.watch
                                    │           webhook      │ push notif
                              ┌─────┴──────┐  ◀─────────────┘
                              │  /api/...  │
                              │  webhook   │
                              └────────────┘
                                    ▲
                                    │ safety net (5 min)
                                    │
                              ┌─────┴──────┐
                              │ Vercel Cron│
                              └────────────┘
```

## 5. Datový model

Migrace `supabase/migrations/0006_calendar.sql`:

```sql
-- pgcrypto pro šifrování refresh tokenů
create extension if not exists pgcrypto;

-- ============================================================================
-- TABLE: google_oauth_connections
-- ============================================================================
create table public.google_oauth_connections (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- OAuth tokens (refresh_token vždy šifrovaný)
  encrypted_refresh_token text not null,
  access_token text,
  access_token_expires_at timestamptz,

  -- Calendar config
  google_user_email text not null,
  calendar_id text not null default 'primary',

  -- Incremental sync state
  sync_token text,                          -- z events.list, NULL = potřeba full re-sync
  last_sync_at timestamptz,

  -- Watch (push notifications) channel
  watch_channel_id text,                    -- UUID, posíláme v X-Goog-Channel-Id
  watch_resource_id text,                   -- od Google, identifikuje resource
  watch_expires_at timestamptz,

  -- Connection state
  status text not null default 'connected'
    check (status in ('connected','revoked','error')),
  last_error text
);

create trigger google_oauth_connections_updated
  before update on public.google_oauth_connections
  for each row execute function public.set_updated_at();

alter table public.google_oauth_connections enable row level security;

-- Jen vlastník vidí + edituje (a admin pro support)
create policy "OAuth: select own or admin"
  on public.google_oauth_connections for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "OAuth: upsert own"
  on public.google_oauth_connections for insert to authenticated
  with check (user_id = auth.uid());

create policy "OAuth: update own"
  on public.google_oauth_connections for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "OAuth: delete own"
  on public.google_oauth_connections for delete to authenticated
  using (user_id = auth.uid());

-- ============================================================================
-- TABLE: events
-- ============================================================================
create table public.events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  owner_id uuid not null references public.profiles(id) on delete cascade,

  -- Google sync handles
  google_event_id text,                     -- unique per (owner_id, google_event_id)
  google_calendar_id text default 'primary',
  etag text,                                -- pro optimistic concurrency

  -- Obsah
  title text not null check (length(title) between 1 and 1024),
  description text,
  location text,

  -- Čas
  start_at timestamptz not null,
  end_at timestamptz not null,
  all_day boolean not null default false,
  timezone text not null default 'Europe/Prague',
  check (end_at > start_at),

  -- Visibility a sdílení
  visibility text not null default 'private'
    check (visibility in ('private','shared')),
  attendees jsonb not null default '[]'::jsonb,  -- [{email, response_status, optional}]

  -- Google Meet
  meet_link text,
  conference_data jsonb,                     -- raw Google conferenceData

  -- CRM linky (max jeden)
  lead_id uuid references public.landing_leads(id) on delete set null,
  client_id uuid references public.profiles(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  check (
    (lead_id is not null)::int +
    (client_id is not null)::int +
    (project_id is not null)::int <= 1
  ),

  -- Sync state
  sync_status text not null default 'pending'
    check (sync_status in ('pending','synced','error')),
  sync_error text,
  last_synced_at timestamptz,

  -- Soft delete (Google smazal event → držíme audit)
  deleted_at timestamptz,

  unique (owner_id, google_event_id)
);

create index events_owner_start_idx on public.events(owner_id, start_at);
create index events_start_idx on public.events(start_at) where deleted_at is null;
create index events_sync_pending_idx on public.events(sync_status) where sync_status in ('pending','error');
create index events_lead_idx on public.events(lead_id) where lead_id is not null;
create index events_client_idx on public.events(client_id) where client_id is not null;
create index events_project_idx on public.events(project_id) where project_id is not null;

create trigger events_updated
  before update on public.events
  for each row execute function public.set_updated_at();

alter table public.events enable row level security;

-- SELECT: owner, shared eventy pro obchodniky+adminy, admin vše
create policy "Events: select"
  on public.events for select to authenticated
  using (
    deleted_at is null and (
      owner_id = auth.uid()
      or public.is_admin()
      or (visibility = 'shared' and public.is_obchodnik_or_admin())
    )
  );

-- INSERT/UPDATE/DELETE: jen owner (a admin)
create policy "Events: insert own"
  on public.events for insert to authenticated
  with check (owner_id = auth.uid() and public.is_obchodnik_or_admin());

create policy "Events: update own"
  on public.events for update to authenticated
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

create policy "Events: delete own"
  on public.events for delete to authenticated
  using (owner_id = auth.uid() or public.is_admin());

-- ============================================================================
-- TABLE: event_sync_log (audit trail)
-- ============================================================================
create table public.event_sync_log (
  id bigserial primary key,
  occurred_at timestamptz not null default now(),
  user_id uuid references public.profiles(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  direction text not null check (direction in ('outbound','inbound')),
  action text not null check (action in ('insert','update','delete','watch_renew','full_resync')),
  status text not null check (status in ('ok','error','retry')),
  error text,
  request_payload jsonb,
  response_payload jsonb
);

create index event_sync_log_user_time_idx on public.event_sync_log(user_id, occurred_at desc);
create index event_sync_log_event_idx on public.event_sync_log(event_id, occurred_at desc) where event_id is not null;

alter table public.event_sync_log enable row level security;

create policy "SyncLog: select own or admin"
  on public.event_sync_log for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
```

### Šifrování refresh tokenů

ENV `GOOGLE_OAUTH_ENCRYPTION_KEY` (32 random bytes, base64) je server-only. Server kód volá pgcrypto helpers, key se předává přes `set_config('app.google_oauth_key', $1, true)` per request transaction:

```sql
create or replace function public.encrypt_refresh_token(token text)
returns text language sql security definer as $$
  select encode(pgp_sym_encrypt(token, current_setting('app.google_oauth_key')), 'base64');
$$;

create or replace function public.decrypt_refresh_token(encrypted text)
returns text language sql security definer as $$
  select pgp_sym_decrypt(decode(encrypted, 'base64'), current_setting('app.google_oauth_key'));
$$;
```

## 6. OAuth flow

### 6.1 Connect

1. **`GET /api/google/oauth/start`** — Route Handler:
   - Vygeneruje signed CSRF state (HMAC-SHA256 user_id + timestamp + nonce, TTL 5 min)
   - 302 na Google authorize URL:
     - `client_id` = `$GOOGLE_OAUTH_CLIENT_ID`
     - `redirect_uri` = `$APP_URL/api/google/oauth/callback`
     - `response_type=code`
     - `access_type=offline` (vynutí refresh_token)
     - `prompt=consent` (refresh_token i při re-connect)
     - `scope` = `calendar.events` + `calendar.readonly`
     - `state` = signed CSRF

2. **`GET /api/google/oauth/callback?code=...&state=...`**:
   - Ověří CSRF state
   - `POST https://oauth2.googleapis.com/token` → access_token, refresh_token, expires_in
   - `GET https://www.googleapis.com/oauth2/v2/userinfo` → email
   - UPSERT `google_oauth_connections` s encrypted_refresh_token
   - Spustí **initial sync** (sekce 7.3) — non-blocking, vrátí redirect na `/portal/(app)/nastaveni/kalendar?ok=1`
   - Registruje **events.watch** (sekce 7.4)

### 6.2 Disconnect

`POST /api/google/oauth/disconnect`:
- `POST https://oauth2.googleapis.com/revoke?token=...` (zruší u Google)
- `channels.stop` (zruší webhook channel)
- DELETE z `google_oauth_connections`
- **Nechává `events`** — eventy zůstávají v ARBIQ jako historický záznam, ale dál se nesync

### 6.3 Settings UI

`/portal/(app)/nastaveni/kalendar/page.tsx`:
- Stav: ✅ Připojen (email, posledni sync) / ⚠️ Chyba (last_error) / ⚪ Nepřipojen
- Tlačítka: "Připojit Google Calendar" / "Synchronizovat teď" / "Odpojit"
- Sync log (posledních 20 řádků z `event_sync_log`)

## 7. Sync engine

### 7.1 Outbound (ARBIQ → Google)

Server Actions v `lib/actions/calendar.ts`:

```ts
'use server';

export async function createEvent(input: CreateEventInput) {
  // 1. Zod validate input
  // 2. Insert do DB s sync_status='pending'
  const event = await supabase.from('events').insert({...}).select().single();

  // 3. Push do Google (best-effort, nezasahuje do response)
  try {
    const googleEvent = await googleCalendar.events.insert({
      calendarId: 'primary',
      sendUpdates: 'none',
      conferenceDataVersion: input.with_meet ? 1 : 0,
      requestBody: toGooglePayload(event, input.with_meet),
    });
    await supabase.from('events').update({
      google_event_id: googleEvent.id,
      etag: googleEvent.etag,
      meet_link: googleEvent.hangoutLink,
      conference_data: googleEvent.conferenceData,
      sync_status: 'synced',
      last_synced_at: new Date(),
    }).eq('id', event.id);
  } catch (err) {
    await supabase.from('events').update({
      sync_status: 'error',
      sync_error: err.message,
    }).eq('id', event.id);
    await logSync({event_id: event.id, direction: 'outbound', action: 'insert', status: 'error', error: err.message});
  }
  return event;
}
```

Stejný pattern pro `updateEvent` (s `If-Match: etag` headerem) a `deleteEvent` (`events.delete`).

**Retry queue:** Vercel Cron `/api/cron/calendar-retry` à 5 min projde `events` s `sync_status='error'` mladší než 1 den a zkusí znovu (max 3 pokusy, exponential backoff).

### 7.2 Inbound — webhook

`POST /api/google/calendar/webhook`:

```ts
export async function POST(req: Request) {
  const channelId = req.headers.get('x-goog-channel-id');
  const channelToken = req.headers.get('x-goog-channel-token');  // HMAC user_id
  const resourceState = req.headers.get('x-goog-resource-state'); // 'sync' | 'exists' | 'not_exists'

  if (resourceState === 'sync') return new Response(null, {status: 200}); // ack pre-init

  // 1. Najdi user_id přes channel_id
  const conn = await adminClient.from('google_oauth_connections')
    .select('user_id, sync_token, calendar_id')
    .eq('watch_channel_id', channelId)
    .single();

  // 2. Verify HMAC
  if (!verifyChannelToken(channelToken, conn.user_id)) return new Response('forbidden', {status: 403});

  // 3. Pull changes via events.list?syncToken
  await pullChanges(conn);

  return new Response(null, {status: 200});
}

async function pullChanges(conn: Connection) {
  let pageToken: string | undefined;
  let nextSyncToken: string | undefined;
  do {
    const resp = await googleCalendar.events.list({
      calendarId: conn.calendar_id,
      syncToken: conn.sync_token,
      pageToken,
      showDeleted: true,
      singleEvents: true,
    });
    for (const ev of resp.items) await upsertFromGoogle(conn.user_id, ev);
    pageToken = resp.nextPageToken;
    nextSyncToken = resp.nextSyncToken;
  } while (pageToken);

  await adminClient.from('google_oauth_connections')
    .update({sync_token: nextSyncToken, last_sync_at: new Date()})
    .eq('user_id', conn.user_id);
}
```

`upsertFromGoogle` rozhoduje:
- `status === 'cancelled'` (Google smazáno) → soft-delete v DB (`deleted_at`)
- Existující `google_event_id` u ownera → UPDATE (jen pokud `etag` se liší, jinak no-op)
- Nový event → INSERT s `owner_id = conn.user_id`, `sync_status='synced'`
- **Konflikt** (ARBIQ má `sync_status='pending'` pro tento event) → priorita: pokud ARBIQ je novější (`updated_at > google.updated`), nech ARBIQ verzi a propagation; jinak Google wins a UI ukáže diff banner.

### 7.3 Initial sync (po OAuth callback)

```ts
async function initialSync(userId: string) {
  const timeMin = subDays(new Date(), 30).toISOString();
  // Vynechej syncToken → full list
  let pageToken: string | undefined;
  let nextSyncToken: string | undefined;
  do {
    const resp = await googleCalendar.events.list({
      calendarId: 'primary',
      timeMin,
      maxResults: 250,
      singleEvents: true,
      pageToken,
    });
    for (const ev of resp.items) await upsertFromGoogle(userId, ev);
    pageToken = resp.nextPageToken;
    nextSyncToken = resp.nextSyncToken;
  } while (pageToken);

  await adminClient.from('google_oauth_connections')
    .update({sync_token: nextSyncToken, last_sync_at: new Date()})
    .eq('user_id', userId);
}
```

Pokud více než 1000 eventů → background job (Vercel cron picks up `status='initial_syncing'`, paginuje pomalu).

### 7.4 Watch channel

```ts
async function startWatch(userId: string) {
  const channelId = crypto.randomUUID();
  const channelToken = signChannelToken(userId);  // HMAC-SHA256

  const resp = await googleCalendar.events.watch({
    calendarId: 'primary',
    requestBody: {
      id: channelId,
      type: 'web_hook',
      address: `${process.env.APP_URL}/api/google/calendar/webhook`,
      token: channelToken,
      expiration: (Date.now() + 7 * 86400 * 1000).toString(), // 7 dní (max u Google calendar)
    },
  });

  await adminClient.from('google_oauth_connections').update({
    watch_channel_id: channelId,
    watch_resource_id: resp.data.resourceId,
    watch_expires_at: new Date(parseInt(resp.data.expiration)),
  }).eq('user_id', userId);
}
```

**Renewal cron** `/api/cron/calendar-watch-renew` à 24 h: pro každý `connected` connection s `watch_expires_at < now() + interval '48 hours'`:
1. `channels.stop` na starý
2. `events.watch` nový (s novým channel_id)

### 7.5 Safety poll

Cron `/api/cron/calendar-poll?token=$CRON_SECRET` à 5 min:
- Pro každý `status='connected'` connection: `pullChanges(conn)` (idempotentní, využívá syncToken)
- Pokud syncToken vrátil 410 Gone → vynuluj sync_token, spusť `initialSync(userId)` znovu

Safety poll chytá: webhooky které nepřišly, channely které expirovaly před renewal, network errory.

## 8. UI

### Route a layout

`/portal/(app)/crm/kalendar/`:
- `page.tsx` — server component, načte initial range eventů + connection status
- `CalendarClient.tsx` — client component, state management (view, currentDate, selectedEvent)
- Layout = existující portal layout (Sidebar + main)

### Komponenty

```
components/portal/calendar/
├── CalendarShell.tsx        // Toolbar + view + side-panel container
├── CalendarToolbar.tsx      // Title, view switcher, "Dnes", arrows, "+ Nová schůzka"
├── DayView.tsx
├── WeekView.tsx             // Default
├── MonthView.tsx
├── AgendaView.tsx
├── EventBlock.tsx           // Renderuje jeden event v gridu
├── EventSidePanel.tsx       // Detail + edit form (slide-in z prava)
├── SyncStatusBar.tsx        // Pásek dole: stav sync + counter
└── CreateEventQuickForm.tsx // Inline form po drag-create
```

### Vizuální slovník (potvrzen mockupem)

| Stav | Border | BG | Text | Označení |
|---|---|---|---|---|
| Vlastní | `border-caramel` | `bg-caramel/18` | `text-parchment-gold` | — |
| Sdílený (visibility=shared) | `border-parchment-gold` | `bg-parchment-gold/14` | `text-parchment-gold` | `◈ TEAM` label |
| Soukromý Google (no CRM link) | `border-sandstone` | `bg-sandstone/12` | `text-sandstone italic` | `🔒 soukromé · Google` |
| Chyba sync | `border-rust` | `bg-rust/15` | `text-rust` | `⚠ Chyba synchronizace` |

CRM linky se renderují jako dashed underline mono badge dole v event blocku: `→ LEAD #023`, `→ KLIENT #014`, `→ PROJEKT #007`. Klik vede na CRM kartu.

### Interakce

- **Drag na prázdné místo v gridu** → vytvoří se 30-minutový event na daném slotu, side-panel se otevře pro doplnění
- **Drag eventu** → přesun (na drop: optimistic UI + outbound sync)
- **Resize horní/dolní hrana** → změna `start_at` / `end_at`
- **Klik na event** → side-panel: detail + edit form + delete + CRM link
- **Klávesnice:**
  - `←` / `→` — předchozí/další období
  - `T` — dnes
  - `D` / `W` / `M` / `A` — Den / Týden / Měsíc / Agenda
  - `N` — nová schůzka (otevře prázdný side-panel)
  - `Esc` — zavřít side-panel
- **Mobile (< 768px):** Agenda view jako default. Tap → full-screen sheet (Radix Dialog) místo side-panelu. "+ Nová" je FAB v rohu.

### Sync status bar

Dole pásek, font-mono uppercase:
- ✅ `Google sync · OK · poslední pull před 12 s` (olivový dot)
- 🔄 `SYNCING… 3/12 eventů` (caramel pulse)
- ⚠️ `CHYBA · refresh token revoked` + link "Připojit znovu" (rust dot)
- Counter vpravo: `5 vlastních · 2 sdílené · 3 soukromé`

## 9. Sdílení (visibility=shared)

Při uložení eventu s `visibility='shared'`:

```ts
async function buildSharedAttendees(ownerId: string, manualAttendees: string[]) {
  // Načti všechny obchodník + admin profily kromě ownera
  const team = await supabase.from('profiles')
    .select('email')
    .in('role', ['obchodnik', 'admin'])
    .eq('is_active', true)
    .neq('id', ownerId);

  return [
    ...team.data.map(p => ({email: p.email, optional: false, responseStatus: 'needsAction'})),
    ...manualAttendees.map(email => ({email, optional: false, responseStatus: 'needsAction'})),
  ];
}
```

Při `events.insert` / `events.patch`:
- `attendees: [...]`
- `sendUpdates: 'none'` — žádné e-mailové pozvánky, klidná distribuce
- Google rozdistribuuje event do primárních kalendářů všech attendees → uvidí v Google appce, telefonu, hodinkách

V ARBIQ vidí všichni obchodníci/admini shared event díky RLS policy `visibility = 'shared' and is_obchodnik_or_admin()`.

**Edge case:** pokud sdílený event přijde inbound (jiný obchodník vytvořil) → owner zůstává původní autor; ostatní vidí read-only přes RLS. Edit by museli udělat přes svůj klient Google Calendaru. v1 necháváme Google `guestsCanModify = false`.

## 10. Error handling a edge cases

| Scénář | Detekce | Reakce |
|---|---|---|
| Refresh token revoked | 400 invalid_grant při refresh | `status='revoked'`, banner "Připojte znovu", outbound vypnut |
| Access token expired | 401 z API | Refresh + retry (transparentní) |
| Webhook channel expired | safety poll dostane 410 Gone | Re-watch při dalším cronu |
| Webhook signature mismatch | HMAC fail v webhook handleru | 403, log |
| 412 conflict na update | If-Match etag mismatch | Fetch Google verze → side-panel `Vaše \| Google` diff, user vybere |
| Google event mazaný | resourceState='not_exists' nebo status='cancelled' | soft-delete v DB (`deleted_at = now()`) |
| Soukromý Google event (no link) | `summary` neobsahuje CRM marker, no extendedProperties | Render fade + 🔒, žádné editable kontroly |
| Recurring od Google | `recurrence` non-null, `singleEvents=true` ho expanduje | Read-only render, edit otevře v Google Web (link out) |
| Rate limit od Google | 403 userRateLimitExceeded | Exponential backoff, max 3 pokusy |
| 1000+ initial events | resp.nextPageToken non-null po 4 cyklech | Pokračování v background cronu (status='initial_syncing') |

## 11. Závislosti

Přidat do `package.json`:

```json
"googleapis": "^148.0.0"
```

(Official Google APIs Node.js client. Obsahuje OAuth2 client + Calendar API typings.)

**Žádné** nové npm pro drag-and-drop — využijeme existující `@hello-pangea/dnd` a custom resize handles na pointer events.

**Env vars** přidat do `.env.example`:

```
# --- Google Calendar OAuth ---
# Z Google Cloud Console > Credentials > OAuth 2.0 Client IDs
GOOGLE_OAUTH_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-...
# 32-byte base64 secret pro pgcrypto šifrování refresh tokenů
GOOGLE_OAUTH_ENCRYPTION_KEY=<base64-32-bytes>
```

**Vercel Cron** přidat do `vercel.json`:

```json
{
  "crons": [
    {"path": "/api/cron/calendar-poll", "schedule": "*/5 * * * *"},
    {"path": "/api/cron/calendar-watch-renew", "schedule": "0 3 * * *"},
    {"path": "/api/cron/calendar-retry", "schedule": "*/5 * * * *"}
  ]
}
```

## 12. Testing

### Unit
- `lib/google/calendar.ts` — `toGooglePayload`, `fromGooglePayload`, `mergeAttendees`, `conflictResolver`
- Sync engine: idempotence (stejný eventy 2× = no-op), syncToken handling (410 → full re-sync), etag check

### Integration
- `/api/google/oauth/callback` s mocked Google token endpoint
- `/api/google/calendar/webhook` se signature validation
- Retry queue: pending → error → retry → synced trajectory

### E2E (Playwright + Google sandbox accounts)
1. Connect flow: OAuth → expect connection row in DB + initial sync → expect events tabulka populated
2. Create v ARBIQ → assert event v Google sandbox calendar
3. Modify v Google sandbox → wait for webhook (or fast-forward to safety poll) → assert ARBIQ reflects
4. Delete v Google → assert ARBIQ soft-delete + UI hide
5. Revoke v Google account UI → assert ARBIQ banner se objeví do 5 min

## 13. Co je mimo scope této speci

- Recurring events (RRULE) — v2
- Custom per-event reminders UI — v2 (Google native reminders fungují)
- Multi-calendar (uživatel připojí víc Google kalendářů) — v2
- iCal export/import — v2+
- Group calendars (firemní "ARBIQ Team" Google calendar) — v2 nebo nikdy
- Read-receipt UI pro attendee responses — v2
- Calendar pro `klient` role (klient by viděl jen svůj projekt-related schedule) — v2+
- Public booking link à la Calendly — out of scope
- Push notifikace v ARBIQ portálu (browser notifications) — v2

## 14. Otevřené body pro plán

- **Encryption key rotation strategy** — jak vyrotovat `GOOGLE_OAUTH_ENCRYPTION_KEY` bez ztráty existujících tokenů (re-encrypt batch). Plán musí naplánovat migraci.
- **Webhook endpoint must be HTTPS** — lokální dev přes ngrok / Vercel preview deployment. Dev/test instrukce v README.
- **Service role boundary** — webhook a cron handlery běží jako admin client (service_role). Musí být striktně server-only, žádný import z client componentů.
- **Soft-delete cleanup** — eventy s `deleted_at < now() - interval '90 days'` purge cron (low priority).

---

**Connecting back to brainstorming:** Tato spec naplňuje rozhodnutí Q1=D, Q2=A, Q3=A, Q4=B, Q5=B z dnešní session. Architektura volena local-mirror + bidi sync (varianta 1 ze tří uvažovaných). MVP cut záměrně neobsahuje recurring a multi-calendar, aby v1 byla shippable za rozumný čas.
