# Google Calendar v CRM — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vlastní obousměrný Google Calendar v portálu ARBIQ (`/portal/(app)/crm/kalendar`) s per-user OAuth, sepia Google-inspired UI a sdílenými eventy přes Google attendees.

**Architecture:** Local mirror v Supabase `events` + bidirectional sync (outbound write-through, inbound `events.watch` webhook + 5min safety poll + 24h watch renewal). UI čte výhradně z DB.

**Tech Stack:** Next.js 16 App Router, React 19, Supabase (Postgres + RLS), `googleapis` v148, Vitest, Tailwind 4, `@hello-pangea/dnd`, framer-motion, date-fns.

**Spec:** `docs/superpowers/specs/2026-05-12-google-calendar-crm-design.md`

---

## File Structure

### Nově vytvořené

```
supabase/migrations/0006_calendar.sql

lib/google/
├── oauth.ts             # OAuth2 client + token refresh
├── calendar.ts          # Calendar API wrapper + transformations (to/from Google)
├── encryption.ts        # pgcrypto wrappers (server-only)
├── webhook.ts           # HMAC channel token sign/verify
└── types.ts             # CalendarEvent, GoogleEvent, ConnectionStatus shared types

lib/actions/
├── calendar.ts          # Server Actions: createEvent, updateEvent, deleteEvent, moveEvent, resizeEvent
└── google-oauth.ts      # Server Actions: triggerSyncNow, disconnectGoogle

lib/services/
└── calendar-sync.ts     # pullChanges, initialSync, upsertFromGoogle, watch start/renew

app/api/google/oauth/start/route.ts
app/api/google/oauth/callback/route.ts
app/api/google/oauth/disconnect/route.ts
app/api/google/calendar/webhook/route.ts
app/api/cron/calendar-poll/route.ts
app/api/cron/calendar-watch-renew/route.ts
app/api/cron/calendar-retry/route.ts

app/portal/(app)/nastaveni/kalendar/
├── page.tsx
└── SettingsClient.tsx

app/portal/(app)/crm/kalendar/
├── page.tsx
└── CalendarClient.tsx

components/portal/calendar/
├── CalendarShell.tsx
├── CalendarToolbar.tsx
├── WeekView.tsx
├── DayView.tsx
├── MonthView.tsx
├── AgendaView.tsx
├── EventBlock.tsx
├── EventSidePanel.tsx
├── CreateEventQuickForm.tsx
└── SyncStatusBar.tsx

__tests__/
├── lib/google/oauth.test.ts
├── lib/google/calendar.test.ts
├── lib/google/encryption.test.ts
├── lib/google/webhook.test.ts
└── lib/services/calendar-sync.test.ts

vitest.config.ts
```

### Modifikované

```
package.json                       # +googleapis, +vitest, +@vitest/ui, +test scripts
.env.example                       # +GOOGLE_OAUTH_* vars
vercel.json                        # +3 crony (calendar-poll, watch-renew, retry)
components/portal/Sidebar.tsx      # +link "Kalendář"
lib/types/database.ts              # regenerated po migraci
README.md                          # Google OAuth setup + ngrok dev instrukce
```

---

## Fáze a milestones

| Fáze | Outcome | Tasků |
|---|---|---|
| **Phase 0** Test infrastructure | Vitest běží, `npm test` passuje | 3 |
| **Phase 1** DB migration | Migrace `0006` aplikovaná, types regenerated, encryption helpers testované | 6 |
| **Phase 2** Google OAuth library | Pure-logic moduly (encryption, HMAC, transformace) všechny testované | 8 |
| **Phase 3** Settings UI | User se může připojit k Google, vidí stav, může se odpojit | 7 |
| **Phase 4** Outbound sync | Server Action `createEvent` v ARBIQ → event v Google sandbox | 8 |
| **Phase 5** Inbound sync + crony | Modify v Google sandbox → reflekce v ARBIQ do 5 min | 9 |
| **Phase 6** Calendar route + shell | `/crm/kalendar` zobrazí prázdnou kostru + toolbar | 5 |
| **Phase 7** Week view (read-only) | Events z DB se renderují v týdenním gridu | 6 |
| **Phase 8** Day/Month/Agenda | Všechny 4 views fungují | 5 |
| **Phase 9** Side panel + CRUD | Klik na event otevře panel, edit/delete funguje | 7 |
| **Phase 10** Drag/Resize/Keyboard | DnD vytváří/přesouvá eventy, šipky navigují | 6 |
| **Phase 11** Sharing | Toggle "Sdílet s týmem" rozšíří attendees | 4 |
| **Phase 12** Polish | SyncStatusBar, Sidebar link, mobile agenda, conflict UI, README | 6 |

**Celkem ≈ 80 tasků.** Každý 2–5 min, plus testy. Phases lze shippovat samostatně.

---

## Phase 0 — Test infrastructure

### Task 1: Přidat Vitest do package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Instalace dev dependencies**

```bash
npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 2: Přidat test scripts do package.json**

V `package.json` doplnit do `"scripts"`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "test: add vitest + RTL deps for unit testing"
```

### Task 2: Vitest config

**Files:**
- Create: `vitest.config.ts`

- [ ] **Step 1: Napsat config**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['__tests__/**/*.test.ts', '__tests__/**/*.test.tsx'],
    setupFiles: [],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add vitest.config.ts
git commit -m "test: vitest config with @ alias"
```

### Task 3: Sanity test passes

**Files:**
- Create: `__tests__/sanity.test.ts`

- [ ] **Step 1: Napsat triviální test**

```ts
// __tests__/sanity.test.ts
import { describe, it, expect } from 'vitest';

describe('sanity', () => {
  it('vitest is wired up', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 2: Run + ověřit PASS**

```bash
npm test
```

Expected: `Test Files  1 passed (1)`, `Tests  1 passed (1)`.

- [ ] **Step 3: Commit**

```bash
git add __tests__/sanity.test.ts
git commit -m "test: sanity check vitest works"
```

---

## Phase 1 — DB migration + encryption helpers

### Task 4: Migrace 0006_calendar.sql

**Files:**
- Create: `supabase/migrations/0006_calendar.sql`

- [ ] **Step 1: Napsat migraci**

Kompletní SQL ze spec sekce 5 (`google_oauth_connections`, `events`, `event_sync_log` + RLS policies + indexy). Plus pgcrypto helpery z konce sekce 5:

```sql
-- supabase/migrations/0006_calendar.sql
-- ============================================================================
-- 0006: Google Calendar integration
-- ============================================================================
-- Tabulky pro per-user Google Calendar OAuth tokens + lokální mirror events
-- + audit log sync operací. RLS na všech třech.

create extension if not exists pgcrypto;

-- ============================================================================
-- TABLE: google_oauth_connections
-- ============================================================================
create table public.google_oauth_connections (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  encrypted_refresh_token text not null,
  access_token text,
  access_token_expires_at timestamptz,
  google_user_email text not null,
  calendar_id text not null default 'primary',
  sync_token text,
  last_sync_at timestamptz,
  watch_channel_id text,
  watch_resource_id text,
  watch_expires_at timestamptz,
  status text not null default 'connected'
    check (status in ('connected','revoked','error')),
  last_error text
);

create trigger google_oauth_connections_updated
  before update on public.google_oauth_connections
  for each row execute function public.set_updated_at();

alter table public.google_oauth_connections enable row level security;

create policy "OAuth: select own or admin"
  on public.google_oauth_connections for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "OAuth: insert own"
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
  google_event_id text,
  google_calendar_id text default 'primary',
  etag text,
  title text not null check (length(title) between 1 and 1024),
  description text,
  location text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  all_day boolean not null default false,
  timezone text not null default 'Europe/Prague',
  check (end_at > start_at),
  visibility text not null default 'private'
    check (visibility in ('private','shared')),
  attendees jsonb not null default '[]'::jsonb,
  meet_link text,
  conference_data jsonb,
  lead_id uuid references public.landing_leads(id) on delete set null,
  client_id uuid references public.profiles(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  check (
    (lead_id is not null)::int +
    (client_id is not null)::int +
    (project_id is not null)::int <= 1
  ),
  sync_status text not null default 'pending'
    check (sync_status in ('pending','synced','error')),
  sync_error text,
  last_synced_at timestamptz,
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

create policy "Events: select"
  on public.events for select to authenticated
  using (
    deleted_at is null and (
      owner_id = auth.uid()
      or public.is_admin()
      or (visibility = 'shared' and public.is_obchodnik_or_admin())
    )
  );

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
-- TABLE: event_sync_log
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

-- ============================================================================
-- pgcrypto helpers pro refresh_token (klíč nastavený přes set_config per req)
-- ============================================================================
create or replace function public.encrypt_refresh_token(token text)
returns text language sql security definer as $$
  select encode(pgp_sym_encrypt(token, current_setting('app.google_oauth_key')), 'base64');
$$;

create or replace function public.decrypt_refresh_token(encrypted text)
returns text language sql security definer as $$
  select pgp_sym_decrypt(decode(encrypted, 'base64'), current_setting('app.google_oauth_key'));
$$;

revoke all on function public.encrypt_refresh_token(text) from public;
revoke all on function public.decrypt_refresh_token(text) from public;
grant execute on function public.encrypt_refresh_token(text) to service_role;
grant execute on function public.decrypt_refresh_token(text) to service_role;
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/0006_calendar.sql
git commit -m "feat(db): migration 0006 — calendar tables + RLS + pgcrypto helpers"
```

### Task 5: Aplikovat migraci na lokální Supabase

- [ ] **Step 1: Spustit migraci**

Pokud používáte `supabase` CLI:

```bash
supabase db push
```

Nebo pokud aplikujete přímo přes SQL editor v Supabase Studio, zkopírujte obsah `0006_calendar.sql` a spusťte.

- [ ] **Step 2: Ověřit tabulky existují**

```bash
psql $DATABASE_URL -c "\d public.events"
psql $DATABASE_URL -c "\d public.google_oauth_connections"
psql $DATABASE_URL -c "\d public.event_sync_log"
```

Expected: každá vrátí structure listing s columns, types, indexes.

- [ ] **Step 3: Ověřit RLS je enabled**

```bash
psql $DATABASE_URL -c "select tablename, rowsecurity from pg_tables where schemaname='public' and tablename in ('events','google_oauth_connections','event_sync_log');"
```

Expected: všechny tři mají `rowsecurity = t`.

- [ ] **Step 4: (žádný commit — migrace už je v repo)**

### Task 6: Regenerovat database.ts types

**Files:**
- Modify: `lib/types/database.ts`

- [ ] **Step 1: Spustit Supabase type generation**

```bash
supabase gen types typescript --project-id YOUR-PROJECT-ID > lib/types/database.ts
```

Nebo pokud používáte lokální Supabase:

```bash
supabase gen types typescript --local > lib/types/database.ts
```

- [ ] **Step 2: Ověřit, že nové tabulky jsou v types**

```bash
grep -E "events|google_oauth_connections|event_sync_log" lib/types/database.ts
```

Expected: výskyty všech tří jmen.

- [ ] **Step 3: Build pass**

```bash
npm run build
```

Expected: build prochází bez TypeScript chyb.

- [ ] **Step 4: Commit**

```bash
git add lib/types/database.ts
git commit -m "chore(types): regenerate database.ts after calendar migration"
```

### Task 7: ENV vars do .env.example

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Přidat na konec souboru**

```bash
# --- Google Calendar OAuth ---
# Z Google Cloud Console > APIs & Services > Credentials > OAuth 2.0 Client IDs
# Authorized redirect URI: {APP_URL}/api/google/oauth/callback
GOOGLE_OAUTH_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-...
# 32-byte base64 secret pro pgcrypto šifrování refresh tokenů
# Generuj: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
GOOGLE_OAUTH_ENCRYPTION_KEY=
```

- [ ] **Step 2: Vygenerovat klíč a doplnit do `.env.local`**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Hodnotu vložit do `.env.local` (NE do `.env.example`).

- [ ] **Step 3: Commit**

```bash
git add .env.example
git commit -m "chore(env): document Google OAuth env vars"
```

### Task 8: lib/google/encryption.ts — wrapper

**Files:**
- Create: `lib/google/encryption.ts`
- Test: `__tests__/lib/google/encryption.test.ts`

- [ ] **Step 1: Napsat test (TDD)**

```ts
// __tests__/lib/google/encryption.test.ts
import { describe, it, expect } from 'vitest';
import { validateEncryptionKey } from '@/lib/google/encryption';

describe('validateEncryptionKey', () => {
  it('passes for valid 32-byte base64', () => {
    const key = Buffer.alloc(32).toString('base64');
    expect(() => validateEncryptionKey(key)).not.toThrow();
  });

  it('throws for empty string', () => {
    expect(() => validateEncryptionKey('')).toThrow(/missing/i);
  });

  it('throws for non-base64', () => {
    expect(() => validateEncryptionKey('not-base64!@#$')).toThrow(/base64/i);
  });

  it('throws for < 32 bytes decoded', () => {
    const short = Buffer.alloc(16).toString('base64');
    expect(() => validateEncryptionKey(short)).toThrow(/32 bytes/i);
  });
});
```

- [ ] **Step 2: Run test → FAIL**

```bash
npm test -- encryption
```

Expected: FAIL — `validateEncryptionKey is not a function`.

- [ ] **Step 3: Implementace**

```ts
// lib/google/encryption.ts
import 'server-only';

/**
 * Validuje, že env var GOOGLE_OAUTH_ENCRYPTION_KEY je 32 bytes base64.
 * Hází throw při startupu pokud key chybí — selže celý import.
 */
export function validateEncryptionKey(key: string): void {
  if (!key || key.length === 0) {
    throw new Error('GOOGLE_OAUTH_ENCRYPTION_KEY missing');
  }
  let decoded: Buffer;
  try {
    decoded = Buffer.from(key, 'base64');
  } catch {
    throw new Error('GOOGLE_OAUTH_ENCRYPTION_KEY is not valid base64');
  }
  if (decoded.length !== 32) {
    throw new Error(
      `GOOGLE_OAUTH_ENCRYPTION_KEY must decode to 32 bytes (got ${decoded.length})`,
    );
  }
}

/**
 * Lazy-loaded validated key. Volej z server-only kódu.
 */
let cachedKey: string | undefined;
export function getEncryptionKey(): string {
  if (cachedKey) return cachedKey;
  const key = process.env.GOOGLE_OAUTH_ENCRYPTION_KEY ?? '';
  validateEncryptionKey(key);
  cachedKey = key;
  return key;
}
```

- [ ] **Step 4: Run test → PASS**

```bash
npm test -- encryption
```

Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add lib/google/encryption.ts __tests__/lib/google/encryption.test.ts
git commit -m "feat(google): encryption key validation helper"
```

### Task 9: lib/google/encryption.ts — pg-side helpers (server)

**Files:**
- Modify: `lib/google/encryption.ts`

- [ ] **Step 1: Doplnit funkce, které volají SQL pgcrypto helpers**

Připojit za `getEncryptionKey()`:

```ts
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Šifruje refresh token přes pgcrypto helper v Postgresu.
 * Klíč se nastavuje per request přes set_config('app.google_oauth_key', ...).
 */
export async function encryptToken(plainText: string): Promise<string> {
  const admin = createAdminClient();
  const key = getEncryptionKey();
  await admin.rpc('set_config', {
    name: 'app.google_oauth_key',
    value: key,
    is_local: true,
  });
  const { data, error } = await admin.rpc('encrypt_refresh_token', { token: plainText });
  if (error) throw error;
  return data as string;
}

export async function decryptToken(encrypted: string): Promise<string> {
  const admin = createAdminClient();
  const key = getEncryptionKey();
  await admin.rpc('set_config', {
    name: 'app.google_oauth_key',
    value: key,
    is_local: true,
  });
  const { data, error } = await admin.rpc('decrypt_refresh_token', { encrypted });
  if (error) throw error;
  return data as string;
}
```

> **Pozor:** `set_config` a `pgp_sym_encrypt` musí běžet ve stejné transaction (parametr `is_local: true`). Pokud Supabase RPC volání nesdílí transaction, bude potřeba RPC, která dělá obojí najednou — viz Task 9b níže.

- [ ] **Step 2: Ověřit, že `admin.rpc('set_config', ...)` funguje**

V Supabase SQL editoru otestovat:

```sql
select set_config('app.test_key', 'hello', true);
select current_setting('app.test_key');
```

Pokud druhý select vrátí prázdno — RPC neudrží transaction, použijte fallback (Task 9b).

- [ ] **Step 3: Commit (může selhat, fallback v Task 9b)**

```bash
git add lib/google/encryption.ts
git commit -m "feat(google): encrypt/decrypt token wrappers"
```

### Task 9b: Fallback — combined RPC pokud set_config nedrží

**Files:**
- Modify: `supabase/migrations/0006_calendar.sql` (přidat funkce na konec) NEBO nová migrace `0007_encrypt_helpers.sql`

> **Pozor:** Pokud Task 9 Step 2 ukázal, že `set_config` přes RPC nefunguje, použij tento Task. Jinak skip.

- [ ] **Step 1: Nová migrace**

```sql
-- supabase/migrations/0007_encrypt_helpers.sql
create or replace function public.encrypt_with_key(token text, key text)
returns text language sql security definer as $$
  select encode(pgp_sym_encrypt(token, key), 'base64');
$$;

create or replace function public.decrypt_with_key(encrypted text, key text)
returns text language sql security definer as $$
  select pgp_sym_decrypt(decode(encrypted, 'base64'), key);
$$;

revoke all on function public.encrypt_with_key(text, text) from public;
revoke all on function public.decrypt_with_key(text, text) from public;
grant execute on function public.encrypt_with_key(text, text) to service_role;
grant execute on function public.decrypt_with_key(text, text) to service_role;
```

- [ ] **Step 2: Upravit `lib/google/encryption.ts`**

Nahradit `encryptToken` / `decryptToken`:

```ts
export async function encryptToken(plainText: string): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('encrypt_with_key', {
    token: plainText,
    key: getEncryptionKey(),
  });
  if (error) throw error;
  return data as string;
}

export async function decryptToken(encrypted: string): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('decrypt_with_key', {
    encrypted,
    key: getEncryptionKey(),
  });
  if (error) throw error;
  return data as string;
}
```

- [ ] **Step 3: Aplikovat migraci, commit**

```bash
supabase db push
git add supabase/migrations/0007_encrypt_helpers.sql lib/google/encryption.ts
git commit -m "feat(db): combined RPC encrypt/decrypt helpers (key passed per call)"
```

---

## Phase 2 — Google OAuth library

### Task 10: Přidat googleapis dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Instalace**

```bash
npm install googleapis@^148
```

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): add googleapis v148"
```

### Task 11: lib/google/oauth.ts — OAuth2 client factory

**Files:**
- Create: `lib/google/oauth.ts`
- Test: `__tests__/lib/google/oauth.test.ts`

- [ ] **Step 1: Test**

```ts
// __tests__/lib/google/oauth.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { buildAuthUrl, parseStateToken, signStateToken } from '@/lib/google/oauth';

describe('OAuth state token', () => {
  beforeEach(() => {
    process.env.GOOGLE_OAUTH_CLIENT_ID = 'test-client';
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = 'test-secret';
    process.env.APP_URL = 'http://localhost:3000';
    process.env.GOOGLE_OAUTH_STATE_SECRET = 'state-secret-for-tests';
  });

  it('round-trip: sign + parse returns userId', () => {
    const signed = signStateToken('user-123');
    const result = parseStateToken(signed);
    expect(result.userId).toBe('user-123');
  });

  it('parse fails for tampered token', () => {
    const signed = signStateToken('user-123');
    const tampered = signed.slice(0, -2) + 'xx';
    expect(() => parseStateToken(tampered)).toThrow();
  });

  it('parse fails for expired token (>5min)', () => {
    const signed = signStateToken('user-123', Date.now() - 6 * 60 * 1000);
    expect(() => parseStateToken(signed)).toThrow(/expired/i);
  });
});

describe('buildAuthUrl', () => {
  beforeEach(() => {
    process.env.GOOGLE_OAUTH_CLIENT_ID = 'test-client';
    process.env.APP_URL = 'http://localhost:3000';
  });

  it('includes required params', () => {
    const url = buildAuthUrl('user-123');
    expect(url).toContain('client_id=test-client');
    expect(url).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fgoogle%2Foauth%2Fcallback');
    expect(url).toContain('access_type=offline');
    expect(url).toContain('prompt=consent');
    expect(url).toContain('scope=');
    expect(url).toContain('state=');
  });
});
```

- [ ] **Step 2: Run → FAIL**

```bash
npm test -- oauth
```

- [ ] **Step 3: Implementace**

```ts
// lib/google/oauth.ts
import 'server-only';
import crypto from 'node:crypto';
import { google } from 'googleapis';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
];

const STATE_TTL_MS = 5 * 60 * 1000; // 5 minut

function stateSecret(): string {
  const s = process.env.GOOGLE_OAUTH_STATE_SECRET ?? process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? '';
  if (!s) throw new Error('GOOGLE_OAUTH_STATE_SECRET (nebo CLIENT_SECRET) missing');
  return s;
}

export function signStateToken(userId: string, nowMs = Date.now()): string {
  const payload = `${userId}.${nowMs}.${crypto.randomBytes(8).toString('hex')}`;
  const hmac = crypto.createHmac('sha256', stateSecret()).update(payload).digest('hex');
  return Buffer.from(`${payload}.${hmac}`).toString('base64url');
}

export function parseStateToken(state: string): { userId: string; ts: number } {
  let decoded: string;
  try {
    decoded = Buffer.from(state, 'base64url').toString('utf8');
  } catch {
    throw new Error('Invalid state token (base64)');
  }
  const parts = decoded.split('.');
  if (parts.length !== 4) throw new Error('Invalid state token (format)');
  const [userId, tsStr, nonce, hmac] = parts;
  const expected = crypto
    .createHmac('sha256', stateSecret())
    .update(`${userId}.${tsStr}.${nonce}`)
    .digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expected))) {
    throw new Error('Invalid state token (HMAC mismatch)');
  }
  const ts = parseInt(tsStr, 10);
  if (Date.now() - ts > STATE_TTL_MS) throw new Error('State token expired');
  return { userId, ts };
}

export function buildAuthUrl(userId: string): string {
  const state = signStateToken(userId);
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
    redirect_uri: `${process.env.APP_URL}/api/google/oauth/callback`,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES.join(' '),
    state,
    include_granted_scopes: 'true',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID!,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
    `${process.env.APP_URL}/api/google/oauth/callback`,
  );
}

export async function exchangeCodeForTokens(code: string) {
  const client = createOAuth2Client();
  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token) {
    throw new Error('No refresh_token returned — uživatel musí znovu povolit access (prompt=consent)');
  }
  return {
    refreshToken: tokens.refresh_token,
    accessToken: tokens.access_token!,
    expiresAt: new Date(tokens.expiry_date!),
  };
}

export async function fetchUserEmail(accessToken: string): Promise<string> {
  const client = createOAuth2Client();
  client.setCredentials({ access_token: accessToken });
  const oauth2 = google.oauth2({ version: 'v2', auth: client });
  const me = await oauth2.userinfo.get();
  if (!me.data.email) throw new Error('Google userinfo did not return email');
  return me.data.email;
}
```

- [ ] **Step 4: Run → PASS**

```bash
npm test -- oauth
```

Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add lib/google/oauth.ts __tests__/lib/google/oauth.test.ts
git commit -m "feat(google): OAuth state HMAC + auth URL builder"
```

### Task 12: lib/google/webhook.ts — channel token HMAC

**Files:**
- Create: `lib/google/webhook.ts`
- Test: `__tests__/lib/google/webhook.test.ts`

- [ ] **Step 1: Test**

```ts
// __tests__/lib/google/webhook.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { signChannelToken, verifyChannelToken } from '@/lib/google/webhook';

beforeEach(() => {
  process.env.GOOGLE_OAUTH_CLIENT_SECRET = 'test-secret';
});

describe('channel token HMAC', () => {
  it('round-trip: sign + verify returns true', () => {
    const token = signChannelToken('user-abc');
    expect(verifyChannelToken(token, 'user-abc')).toBe(true);
  });

  it('verify fails for wrong user', () => {
    const token = signChannelToken('user-abc');
    expect(verifyChannelToken(token, 'user-xyz')).toBe(false);
  });

  it('verify fails for tampered token', () => {
    const token = signChannelToken('user-abc');
    expect(verifyChannelToken(token.slice(0, -2) + 'xx', 'user-abc')).toBe(false);
  });
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implementace**

```ts
// lib/google/webhook.ts
import 'server-only';
import crypto from 'node:crypto';

function secret(): string {
  const s = process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? '';
  if (!s) throw new Error('GOOGLE_OAUTH_CLIENT_SECRET missing');
  return s;
}

/**
 * HMAC-SHA256(userId) hex digest. Posíláme do Google jako `token` u events.watch.
 * Google při pingu pošle zpět v X-Goog-Channel-Token headeru.
 */
export function signChannelToken(userId: string): string {
  return crypto.createHmac('sha256', secret()).update(userId).digest('hex');
}

export function verifyChannelToken(token: string, userId: string): boolean {
  const expected = signChannelToken(userId);
  if (token.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add lib/google/webhook.ts __tests__/lib/google/webhook.test.ts
git commit -m "feat(google): webhook channel token HMAC sign/verify"
```

### Task 13: lib/google/types.ts — shared types

**Files:**
- Create: `lib/google/types.ts`

- [ ] **Step 1: Napsat types**

```ts
// lib/google/types.ts
import type { calendar_v3 } from 'googleapis';
import type { Database } from '@/lib/types/database';

export type EventRow = Database['public']['Tables']['events']['Row'];
export type EventInsert = Database['public']['Tables']['events']['Insert'];
export type EventUpdate = Database['public']['Tables']['events']['Update'];

export type ConnectionRow = Database['public']['Tables']['google_oauth_connections']['Row'];

export type GoogleEvent = calendar_v3.Schema$Event;

export type EventAttendee = {
  email: string;
  responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  optional?: boolean;
  displayName?: string;
};

export type EventVisibility = 'private' | 'shared';

export type CalendarConnectionStatus =
  | { state: 'not_connected' }
  | { state: 'connected'; email: string; lastSyncAt: string | null }
  | { state: 'error'; email: string; error: string }
  | { state: 'revoked'; email: string };
```

- [ ] **Step 2: Build pass**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add lib/google/types.ts
git commit -m "feat(google): shared types for events + connection"
```

### Task 14: lib/google/calendar.ts — toGooglePayload

**Files:**
- Create: `lib/google/calendar.ts`
- Test: `__tests__/lib/google/calendar.test.ts` (jen pro toGooglePayload v tomto tasku)

- [ ] **Step 1: Test**

```ts
// __tests__/lib/google/calendar.test.ts
import { describe, it, expect } from 'vitest';
import { toGooglePayload } from '@/lib/google/calendar';
import type { EventRow } from '@/lib/google/types';

const base: EventRow = {
  id: 'ev-1',
  created_at: '2026-05-12T10:00:00Z',
  updated_at: '2026-05-12T10:00:00Z',
  owner_id: 'owner-1',
  google_event_id: null,
  google_calendar_id: 'primary',
  etag: null,
  title: 'Schůzka s klientem',
  description: 'Pravidelný catch-up',
  location: 'Praha',
  start_at: '2026-05-13T09:00:00Z',
  end_at: '2026-05-13T10:00:00Z',
  all_day: false,
  timezone: 'Europe/Prague',
  visibility: 'private',
  attendees: [],
  meet_link: null,
  conference_data: null,
  lead_id: null,
  client_id: null,
  project_id: null,
  sync_status: 'pending',
  sync_error: null,
  last_synced_at: null,
  deleted_at: null,
};

describe('toGooglePayload', () => {
  it('maps basic fields', () => {
    const g = toGooglePayload(base, { withMeet: false });
    expect(g.summary).toBe('Schůzka s klientem');
    expect(g.description).toBe('Pravidelný catch-up');
    expect(g.location).toBe('Praha');
    expect(g.start?.dateTime).toBe('2026-05-13T09:00:00Z');
    expect(g.end?.dateTime).toBe('2026-05-13T10:00:00Z');
    expect(g.start?.timeZone).toBe('Europe/Prague');
  });

  it('attaches attendees', () => {
    const ev = { ...base, attendees: [{ email: 'a@b.cz' }, { email: 'c@d.cz' }] };
    const g = toGooglePayload(ev, { withMeet: false });
    expect(g.attendees).toHaveLength(2);
    expect(g.attendees?.[0].email).toBe('a@b.cz');
  });

  it('with Meet → conferenceData with createRequest', () => {
    const g = toGooglePayload(base, { withMeet: true });
    expect(g.conferenceData?.createRequest?.conferenceSolutionKey?.type).toBe('hangoutsMeet');
    expect(g.conferenceData?.createRequest?.requestId).toBeTruthy();
  });

  it('without Meet → no conferenceData', () => {
    const g = toGooglePayload(base, { withMeet: false });
    expect(g.conferenceData).toBeUndefined();
  });

  it('all_day event → date instead of dateTime', () => {
    const ev = { ...base, all_day: true, start_at: '2026-05-13T00:00:00Z', end_at: '2026-05-14T00:00:00Z' };
    const g = toGooglePayload(ev, { withMeet: false });
    expect(g.start?.date).toBe('2026-05-13');
    expect(g.start?.dateTime).toBeUndefined();
  });

  it('embeds ARBIQ extendedProperties', () => {
    const ev = { ...base, lead_id: 'lead-9' };
    const g = toGooglePayload(ev, { withMeet: false });
    expect(g.extendedProperties?.private?.arbiq_event_id).toBe('ev-1');
    expect(g.extendedProperties?.private?.arbiq_lead_id).toBe('lead-9');
  });
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implementace `toGooglePayload`**

```ts
// lib/google/calendar.ts
import 'server-only';
import crypto from 'node:crypto';
import type { EventRow, GoogleEvent } from './types';

export function toGooglePayload(
  event: EventRow,
  opts: { withMeet: boolean },
): GoogleEvent {
  const payload: GoogleEvent = {
    summary: event.title,
    description: event.description ?? undefined,
    location: event.location ?? undefined,
    start: event.all_day
      ? { date: event.start_at.slice(0, 10) }
      : { dateTime: event.start_at, timeZone: event.timezone },
    end: event.all_day
      ? { date: event.end_at.slice(0, 10) }
      : { dateTime: event.end_at, timeZone: event.timezone },
    attendees: (Array.isArray(event.attendees) && event.attendees.length > 0)
      ? (event.attendees as { email: string }[]).map(a => ({ email: a.email }))
      : undefined,
    extendedProperties: {
      private: {
        arbiq_event_id: event.id,
        arbiq_owner_id: event.owner_id,
        ...(event.lead_id ? { arbiq_lead_id: event.lead_id } : {}),
        ...(event.client_id ? { arbiq_client_id: event.client_id } : {}),
        ...(event.project_id ? { arbiq_project_id: event.project_id } : {}),
        arbiq_visibility: event.visibility,
      },
    },
  };
  if (opts.withMeet) {
    payload.conferenceData = {
      createRequest: {
        requestId: crypto.randomUUID(),
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    };
  }
  return payload;
}
```

- [ ] **Step 4: Run → PASS**

```bash
npm test -- calendar
```

Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add lib/google/calendar.ts __tests__/lib/google/calendar.test.ts
git commit -m "feat(google): toGooglePayload transformer (events → Google API)"
```

### Task 15: lib/google/calendar.ts — fromGooglePayload

**Files:**
- Modify: `lib/google/calendar.ts`
- Modify: `__tests__/lib/google/calendar.test.ts` (add tests)

- [ ] **Step 1: Test**

Doplnit do `calendar.test.ts`:

```ts
import { fromGooglePayload } from '@/lib/google/calendar';

describe('fromGooglePayload', () => {
  const googleEvent = {
    id: 'g-evt-123',
    etag: '"3382000000000"',
    summary: 'Meeting',
    description: 'Catch-up',
    location: 'Online',
    start: { dateTime: '2026-05-13T09:00:00+02:00', timeZone: 'Europe/Prague' },
    end: { dateTime: '2026-05-13T10:00:00+02:00', timeZone: 'Europe/Prague' },
    attendees: [{ email: 'a@b.cz', responseStatus: 'accepted' }],
    hangoutLink: 'https://meet.google.com/abc-defg-hij',
    conferenceData: { conferenceId: 'abc-defg-hij' },
    status: 'confirmed',
    extendedProperties: {
      private: { arbiq_event_id: 'arbiq-ev-99', arbiq_lead_id: 'lead-9', arbiq_visibility: 'shared' },
    },
  };

  it('extracts core fields', () => {
    const ev = fromGooglePayload(googleEvent, 'owner-1');
    expect(ev.title).toBe('Meeting');
    expect(ev.description).toBe('Catch-up');
    expect(ev.location).toBe('Online');
    expect(ev.google_event_id).toBe('g-evt-123');
    expect(ev.etag).toBe('"3382000000000"');
    expect(ev.owner_id).toBe('owner-1');
  });

  it('extracts dateTime and converts to ISO UTC', () => {
    const ev = fromGooglePayload(googleEvent, 'owner-1');
    expect(ev.start_at).toMatch(/^2026-05-13T0[7-9]:00:00/);
    expect(ev.all_day).toBe(false);
  });

  it('handles all_day (date-only) events', () => {
    const allDay = { ...googleEvent, start: { date: '2026-05-13' }, end: { date: '2026-05-14' } };
    const ev = fromGooglePayload(allDay, 'owner-1');
    expect(ev.all_day).toBe(true);
    expect(ev.start_at).toBe('2026-05-13T00:00:00Z');
  });

  it('extracts CRM linky from extendedProperties', () => {
    const ev = fromGooglePayload(googleEvent, 'owner-1');
    expect(ev.lead_id).toBe('lead-9');
    expect(ev.visibility).toBe('shared');
  });

  it('extracts Meet link', () => {
    const ev = fromGooglePayload(googleEvent, 'owner-1');
    expect(ev.meet_link).toBe('https://meet.google.com/abc-defg-hij');
  });

  it('sync_status synced for non-cancelled', () => {
    const ev = fromGooglePayload(googleEvent, 'owner-1');
    expect(ev.sync_status).toBe('synced');
  });
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implementace `fromGooglePayload`**

Připojit do `lib/google/calendar.ts`:

```ts
import type { EventInsert, GoogleEvent } from './types';

export function fromGooglePayload(
  g: GoogleEvent,
  ownerId: string,
): EventInsert {
  const allDay = !!g.start?.date;
  const startAt = allDay
    ? `${g.start!.date}T00:00:00Z`
    : new Date(g.start!.dateTime!).toISOString();
  const endAt = allDay
    ? `${g.end!.date}T00:00:00Z`
    : new Date(g.end!.dateTime!).toISOString();

  const ext = g.extendedProperties?.private ?? {};
  const visibility =
    ext['arbiq_visibility'] === 'shared' ? 'shared' : 'private';

  return {
    owner_id: ownerId,
    google_event_id: g.id ?? null,
    google_calendar_id: 'primary',
    etag: g.etag ?? null,
    title: g.summary ?? '(bez názvu)',
    description: g.description ?? null,
    location: g.location ?? null,
    start_at: startAt,
    end_at: endAt,
    all_day: allDay,
    timezone: g.start?.timeZone ?? 'Europe/Prague',
    visibility,
    attendees: (g.attendees ?? []).map(a => ({
      email: a.email!,
      responseStatus: a.responseStatus ?? 'needsAction',
      optional: a.optional ?? false,
    })),
    meet_link: g.hangoutLink ?? null,
    conference_data: g.conferenceData ?? null,
    lead_id: ext['arbiq_lead_id'] ?? null,
    client_id: ext['arbiq_client_id'] ?? null,
    project_id: ext['arbiq_project_id'] ?? null,
    sync_status: g.status === 'cancelled' ? 'synced' : 'synced',
    last_synced_at: new Date().toISOString(),
  };
}
```

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git add lib/google/calendar.ts __tests__/lib/google/calendar.test.ts
git commit -m "feat(google): fromGooglePayload transformer (Google API → events)"
```

### Task 16: lib/google/calendar.ts — googleCalendarFor(userId)

**Files:**
- Modify: `lib/google/calendar.ts`

- [ ] **Step 1: Připojit factory pro authenticated Calendar API client**

```ts
import { google, calendar_v3 } from 'googleapis';
import { createAdminClient } from '@/lib/supabase/admin';
import { decryptToken } from './encryption';
import { createOAuth2Client } from './oauth';

/**
 * Vrátí Google Calendar API client autentikovaný za daného usera.
 * Načte connection, dešifruje refresh_token, vrátí oauth2 client + calendar.
 */
export async function googleCalendarFor(userId: string): Promise<{
  calendar: calendar_v3.Calendar;
  email: string;
  calendarId: string;
}> {
  const admin = createAdminClient();
  const { data: conn, error } = await admin
    .from('google_oauth_connections')
    .select('encrypted_refresh_token, google_user_email, calendar_id, status')
    .eq('user_id', userId)
    .single();

  if (error || !conn) throw new Error(`No Google connection for user ${userId}`);
  if (conn.status !== 'connected') throw new Error(`Google connection ${conn.status}`);

  const refreshToken = await decryptToken(conn.encrypted_refresh_token);
  const oauth2 = createOAuth2Client();
  oauth2.setCredentials({ refresh_token: refreshToken });

  const calendar = google.calendar({ version: 'v3', auth: oauth2 });
  return { calendar, email: conn.google_user_email, calendarId: conn.calendar_id };
}
```

- [ ] **Step 2: Build pass**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add lib/google/calendar.ts
git commit -m "feat(google): googleCalendarFor(userId) — authenticated client factory"
```

### Task 17: lib/google/oauth.ts — refreshAccessToken helper

**Files:**
- Modify: `lib/google/oauth.ts`

- [ ] **Step 1: Připojit funkci**

```ts
/**
 * Refresh access_token přes refresh_token. Volej když 401 z Google API.
 * Hází: pokud invalid_grant → caller by měl označit connection jako 'revoked'.
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresAt: Date;
}> {
  const client = createOAuth2Client();
  client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await client.refreshAccessToken();
  return {
    accessToken: credentials.access_token!,
    expiresAt: new Date(credentials.expiry_date!),
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/google/oauth.ts
git commit -m "feat(google): refreshAccessToken helper for 401 recovery"
```

---

## Phase 3 — Settings UI

### Task 18: OAuth start route

**Files:**
- Create: `app/api/google/oauth/start/route.ts`

- [ ] **Step 1: Implementace**

```ts
// app/api/google/oauth/start/route.ts
import 'server-only';
import { NextResponse } from 'next/server';
import { requireViewer } from '@/lib/supabase/viewer';
import { buildAuthUrl } from '@/lib/google/oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const viewer = await requireViewer();
  if (viewer.isPreview) {
    return NextResponse.redirect(`${process.env.APP_URL}/portal/(app)/nastaveni/kalendar?err=preview`);
  }
  const url = buildAuthUrl(viewer.id);
  return NextResponse.redirect(url);
}
```

- [ ] **Step 2: Build pass**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add app/api/google/oauth/start/route.ts
git commit -m "feat(google): /api/google/oauth/start route handler"
```

### Task 19: OAuth callback route

**Files:**
- Create: `app/api/google/oauth/callback/route.ts`

- [ ] **Step 1: Implementace**

```ts
// app/api/google/oauth/callback/route.ts
import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseStateToken, exchangeCodeForTokens, fetchUserEmail } from '@/lib/google/oauth';
import { encryptToken } from '@/lib/google/encryption';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const errorParam = searchParams.get('error');

  const settingsUrl = `${process.env.APP_URL}/portal/nastaveni/kalendar`;

  if (errorParam) {
    return NextResponse.redirect(`${settingsUrl}?err=${encodeURIComponent(errorParam)}`);
  }
  if (!code || !state) {
    return NextResponse.redirect(`${settingsUrl}?err=missing_params`);
  }

  let userId: string;
  try {
    ({ userId } = parseStateToken(state));
  } catch (e) {
    return NextResponse.redirect(`${settingsUrl}?err=invalid_state`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const email = await fetchUserEmail(tokens.accessToken);
    const encryptedRefresh = await encryptToken(tokens.refreshToken);

    const admin = createAdminClient();
    await admin.from('google_oauth_connections').upsert({
      user_id: userId,
      encrypted_refresh_token: encryptedRefresh,
      access_token: tokens.accessToken,
      access_token_expires_at: tokens.expiresAt.toISOString(),
      google_user_email: email,
      calendar_id: 'primary',
      status: 'connected',
      last_error: null,
    });

    // Initial sync + watch budou v Phase 5; teď jen redirect na settings
    return NextResponse.redirect(`${settingsUrl}?ok=1`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.redirect(`${settingsUrl}?err=${encodeURIComponent(msg.slice(0, 200))}`);
  }
}
```

- [ ] **Step 2: Build pass**

- [ ] **Step 3: Commit**

```bash
git add app/api/google/oauth/callback/route.ts
git commit -m "feat(google): /api/google/oauth/callback — token exchange + persist"
```

### Task 20: OAuth disconnect route

**Files:**
- Create: `app/api/google/oauth/disconnect/route.ts`

- [ ] **Step 1: Implementace**

```ts
// app/api/google/oauth/disconnect/route.ts
import 'server-only';
import { NextResponse } from 'next/server';
import { requireViewer } from '@/lib/supabase/viewer';
import { createAdminClient } from '@/lib/supabase/admin';
import { decryptToken } from '@/lib/google/encryption';
import { google } from 'googleapis';
import { createOAuth2Client } from '@/lib/google/oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const viewer = await requireViewer();
  if (viewer.isPreview) return NextResponse.json({ ok: false, error: 'preview' }, { status: 403 });

  const admin = createAdminClient();
  const { data: conn } = await admin
    .from('google_oauth_connections')
    .select('encrypted_refresh_token, watch_channel_id, watch_resource_id')
    .eq('user_id', viewer.id)
    .single();

  if (!conn) return NextResponse.json({ ok: true });

  // 1. Stop watch channel (best-effort)
  if (conn.watch_channel_id && conn.watch_resource_id) {
    try {
      const refreshToken = await decryptToken(conn.encrypted_refresh_token);
      const oauth2 = createOAuth2Client();
      oauth2.setCredentials({ refresh_token: refreshToken });
      const calendar = google.calendar({ version: 'v3', auth: oauth2 });
      await calendar.channels.stop({
        requestBody: { id: conn.watch_channel_id, resourceId: conn.watch_resource_id },
      });
    } catch {
      // ignore — channel může být expired
    }
  }

  // 2. Revoke token u Google (best-effort)
  try {
    const refreshToken = await decryptToken(conn.encrypted_refresh_token);
    await fetch(`https://oauth2.googleapis.com/revoke?token=${refreshToken}`, { method: 'POST' });
  } catch {
    // ignore
  }

  // 3. Smaž connection (events zůstávají)
  await admin.from('google_oauth_connections').delete().eq('user_id', viewer.id);

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Build pass**

- [ ] **Step 3: Commit**

```bash
git add app/api/google/oauth/disconnect/route.ts
git commit -m "feat(google): /api/google/oauth/disconnect — revoke + cleanup"
```

### Task 21: Settings page (server component)

**Files:**
- Create: `app/portal/(app)/nastaveni/kalendar/page.tsx`

- [ ] **Step 1: Implementace**

```tsx
// app/portal/(app)/nastaveni/kalendar/page.tsx
import { createClient } from '@/lib/supabase/server';
import { requireViewer } from '@/lib/supabase/viewer';
import PageHeader from '@/components/portal/PageHeader';
import SettingsClient from './SettingsClient';
import type { CalendarConnectionStatus } from '@/lib/google/types';

export const dynamic = 'force-dynamic';

export default async function CalendarSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; err?: string }>;
}) {
  const viewer = await requireViewer();
  const sp = await searchParams;

  let status: CalendarConnectionStatus = { state: 'not_connected' };

  if (!viewer.isPreview) {
    const supabase = await createClient();
    const { data: conn } = await supabase
      .from('google_oauth_connections')
      .select('google_user_email, last_sync_at, last_error, status')
      .eq('user_id', viewer.id)
      .maybeSingle();

    if (conn) {
      if (conn.status === 'connected') {
        status = { state: 'connected', email: conn.google_user_email, lastSyncAt: conn.last_sync_at };
      } else if (conn.status === 'error') {
        status = { state: 'error', email: conn.google_user_email, error: conn.last_error ?? 'unknown' };
      } else if (conn.status === 'revoked') {
        status = { state: 'revoked', email: conn.google_user_email };
      }
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Nastavení"
        title="Google Calendar"
        subtitle="Obousměrná synchronizace s Vaším primárním Google kalendářem."
      />
      <div className="px-8 py-8">
        <SettingsClient status={status} flashOk={sp.ok === '1'} flashError={sp.err ?? null} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build pass (může selhat na chybějícím SettingsClient — fix v Task 22)**

- [ ] **Step 3: Commit (společně se Task 22)**

### Task 22: SettingsClient component

**Files:**
- Create: `app/portal/(app)/nastaveni/kalendar/SettingsClient.tsx`

- [ ] **Step 1: Implementace**

```tsx
// app/portal/(app)/nastaveni/kalendar/SettingsClient.tsx
'use client';

import { useState, useTransition } from 'react';
import { CheckCircle2, AlertTriangle, Circle, ExternalLink } from 'lucide-react';
import type { CalendarConnectionStatus } from '@/lib/google/types';
import { formatDistanceToNow } from 'date-fns';
import { cs } from 'date-fns/locale';

const labelClass = 'font-mono text-[10px] uppercase tracking-widest text-sandstone';

export default function SettingsClient({
  status,
  flashOk,
  flashError,
}: {
  status: CalendarConnectionStatus;
  flashOk: boolean;
  flashError: string | null;
}) {
  const [pending, startTransition] = useTransition();

  function handleConnect() {
    window.location.href = '/api/google/oauth/start';
  }

  function handleDisconnect() {
    if (!confirm('Opravdu odpojit Google Calendar? Existující eventy v ARBIQ zůstanou, ale dále se nebudou synchronizovat.')) return;
    startTransition(async () => {
      const res = await fetch('/api/google/oauth/disconnect', { method: 'POST' });
      if (res.ok) window.location.reload();
    });
  }

  return (
    <div className="max-w-2xl space-y-8">
      {flashOk && (
        <div className="bg-olive/15 border-l-4 border-olive p-4">
          <p className="font-mono text-xs text-olive uppercase tracking-widest">Připojeno k Google Calendar.</p>
        </div>
      )}
      {flashError && (
        <div className="bg-rust/15 border-l-4 border-rust p-4">
          <p className="font-mono text-xs text-rust uppercase tracking-widest">Chyba: {flashError}</p>
        </div>
      )}

      <section className="bg-coffee border border-tobacco p-6 space-y-4">
        <div className="flex items-center gap-3">
          {status.state === 'connected' && <CheckCircle2 className="text-olive" size={20} />}
          {status.state === 'error' && <AlertTriangle className="text-rust" size={20} />}
          {status.state === 'revoked' && <AlertTriangle className="text-caramel" size={20} />}
          {status.state === 'not_connected' && <Circle className="text-sandstone" size={20} />}
          <h3 className="font-display italic text-xl text-moonlight">
            {status.state === 'connected' && 'Připojeno'}
            {status.state === 'error' && 'Chyba synchronizace'}
            {status.state === 'revoked' && 'Token zrušen'}
            {status.state === 'not_connected' && 'Není připojeno'}
          </h3>
        </div>

        {status.state !== 'not_connected' && (
          <div className="space-y-1 pl-8">
            <p className={labelClass}>Google účet</p>
            <p className="text-moonlight font-mono text-sm">{status.email}</p>
          </div>
        )}

        {status.state === 'connected' && (
          <div className="space-y-1 pl-8">
            <p className={labelClass}>Poslední synchronizace</p>
            <p className="text-sepia text-sm">
              {status.lastSyncAt
                ? formatDistanceToNow(new Date(status.lastSyncAt), { addSuffix: true, locale: cs })
                : 'zatím neproběhla'}
            </p>
          </div>
        )}

        {status.state === 'error' && (
          <div className="space-y-1 pl-8">
            <p className={labelClass}>Detail chyby</p>
            <p className="text-rust text-sm font-mono">{status.error}</p>
          </div>
        )}

        <div className="pt-4 flex items-center gap-3">
          {status.state === 'not_connected' && (
            <button
              onClick={handleConnect}
              className="inline-flex items-center gap-2 bg-caramel text-espresso px-5 py-2.5 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light"
            >
              Připojit Google Calendar <ExternalLink size={14} />
            </button>
          )}
          {(status.state === 'connected' || status.state === 'error') && (
            <>
              <button
                onClick={handleConnect}
                className="border border-caramel text-caramel px-5 py-2.5 font-mono text-xs uppercase tracking-widest hover:bg-caramel/10"
              >
                Připojit znovu
              </button>
              <button
                onClick={handleDisconnect}
                disabled={pending}
                className="border border-rust/50 text-rust px-5 py-2.5 font-mono text-xs uppercase tracking-widest hover:bg-rust/10 disabled:opacity-50"
              >
                {pending ? 'Odpojuji…' : 'Odpojit'}
              </button>
            </>
          )}
        </div>
      </section>

      <section className="text-xs text-sepia/70 space-y-2 pl-1">
        <p>• Synchronizace probíhá obousměrně: změny v ARBIQ se promítnou do Google a naopak.</p>
        <p>• Synchronizujeme <strong>jen primární Google kalendář</strong>. Osobní eventy se zobrazí v ARBIQ jako "soukromé" bez detailu.</p>
        <p>• Sdílené eventy se ostatním obchodníkům doručí přes Google attendees (bez e-mailových pozvánek).</p>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Build pass**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add app/portal/\(app\)/nastaveni/kalendar/page.tsx app/portal/\(app\)/nastaveni/kalendar/SettingsClient.tsx
git commit -m "feat(portal): /nastaveni/kalendar — Google Calendar settings UI"
```

### Task 23: Google Cloud Console setup (dev guide)

**Files:**
- Modify: `README.md` (přidat sekci na konec)

- [ ] **Step 1: Doplnit README sekci**

```md
## Google Calendar OAuth setup

Pro lokální dev a produkci:

1. **Google Cloud Console** → vytvořit projekt `ARBIQ Calendar` (nebo použít existující).
2. **APIs & Services → Enabled APIs** → enable **Google Calendar API**.
3. **OAuth consent screen**:
   - User Type: **External** (pokud máte Workspace, můžete použít Internal)
   - App name: ARBIQ
   - User support email: `info@arbey.cz`
   - Scopes: `.../auth/calendar.events`, `.../auth/calendar.readonly`, `.../auth/userinfo.email`
   - Test users (External + nepublikovaný app): přidat všechny obchodníky
4. **Credentials → Create OAuth 2.0 Client ID**:
   - Type: **Web application**
   - Authorized JavaScript origins:
     - `http://localhost:3000` (dev)
     - `https://arbiq.cz` (prod)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/google/oauth/callback` (dev)
     - `https://arbiq.cz/api/google/oauth/callback` (prod)
5. **Zkopírujte Client ID + Secret** → `.env.local` jako `GOOGLE_OAUTH_CLIENT_ID` a `GOOGLE_OAUTH_CLIENT_SECRET`.
6. **Encryption key:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
   Hodnotu → `GOOGLE_OAUTH_ENCRYPTION_KEY`.

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

Bez ngrok inbound sync nebude fungovat — jen safety poll (cron à 5 min).
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs(readme): Google Calendar OAuth + ngrok dev setup"
```

### Task 24: Manuální QA — OAuth flow E2E

> Po Task 23: ručně otestovat, že připojení funguje.

- [ ] **Step 1: Spustit dev server + ngrok**

```bash
ngrok http 3000  # v jednom terminálu
npm run dev      # v druhém
```

- [ ] **Step 2: Doplnit `.env.local` o ngrok URL jako `APP_URL` + přidat redirect URI do Google Console**

- [ ] **Step 3: Otevřít `https://<ngrok>.ngrok.io/portal/nastaveni/kalendar`**

Očekávat: stav "Není připojeno" + tlačítko "Připojit Google Calendar".

- [ ] **Step 4: Kliknout "Připojit Google Calendar"**

Očekávat:
1. Přesměrování na Google authorize page
2. Schválit scopes
3. Přesměrování zpět na `/portal/nastaveni/kalendar?ok=1`
4. Zelený banner "Připojeno k Google Calendar"
5. Stav "Připojeno" + email
6. V Supabase Studio řádek v `google_oauth_connections` s `status='connected'`

- [ ] **Step 5: Ověřit token v DB**

```bash
psql $DATABASE_URL -c "select user_id, google_user_email, status, length(encrypted_refresh_token) from google_oauth_connections;"
```

Expected: status `connected`, encrypted_refresh_token > 100 znaků (šifrovaný).

- [ ] **Step 6: Kliknout "Odpojit"**

Očekávat: confirm dialog → soft reload → stav "Není připojeno". V DB: connection smazaná.

- [ ] **Step 7: (žádný commit — QA-only)**

---

## Phase 4 — Outbound sync (ARBIQ → Google)

### Task 25: lib/services/calendar-sync.ts — kostra

**Files:**
- Create: `lib/services/calendar-sync.ts`

- [ ] **Step 1: Skeleton se sync log helperem**

```ts
// lib/services/calendar-sync.ts
import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

type LogEntry = {
  user_id: string;
  event_id: string | null;
  direction: 'outbound' | 'inbound';
  action: 'insert' | 'update' | 'delete' | 'watch_renew' | 'full_resync';
  status: 'ok' | 'error' | 'retry';
  error?: string | null;
  request_payload?: unknown;
  response_payload?: unknown;
};

export async function logSync(entry: LogEntry): Promise<void> {
  const admin = createAdminClient();
  await admin.from('event_sync_log').insert({
    user_id: entry.user_id,
    event_id: entry.event_id,
    direction: entry.direction,
    action: entry.action,
    status: entry.status,
    error: entry.error ?? null,
    request_payload: entry.request_payload as any,
    response_payload: entry.response_payload as any,
  });
}
```

- [ ] **Step 2: Build pass**

- [ ] **Step 3: Commit**

```bash
git add lib/services/calendar-sync.ts
git commit -m "feat(sync): calendar-sync skeleton + logSync helper"
```

### Task 26: pushEventToGoogle (outbound insert)

**Files:**
- Modify: `lib/services/calendar-sync.ts`

- [ ] **Step 1: Doplnit funkci**

```ts
import { googleCalendarFor, toGooglePayload } from '@/lib/google/calendar';
import type { EventRow } from '@/lib/google/types';

/**
 * Pošle event do Google a aktualizuje DB (google_event_id, etag, meet_link, sync_status='synced').
 * Při chybě: sync_status='error' + log + návrat false.
 */
export async function pushEventInsert(
  event: EventRow,
  opts: { withMeet: boolean },
): Promise<boolean> {
  const admin = createAdminClient();
  try {
    const { calendar, calendarId } = await googleCalendarFor(event.owner_id);
    const payload = toGooglePayload(event, { withMeet: opts.withMeet });
    const resp = await calendar.events.insert({
      calendarId,
      sendUpdates: 'none',
      conferenceDataVersion: opts.withMeet ? 1 : 0,
      requestBody: payload,
    });

    await admin.from('events').update({
      google_event_id: resp.data.id,
      etag: resp.data.etag,
      meet_link: resp.data.hangoutLink ?? null,
      conference_data: resp.data.conferenceData ?? null,
      sync_status: 'synced',
      sync_error: null,
      last_synced_at: new Date().toISOString(),
    }).eq('id', event.id);

    await logSync({
      user_id: event.owner_id,
      event_id: event.id,
      direction: 'outbound',
      action: 'insert',
      status: 'ok',
      response_payload: { google_event_id: resp.data.id },
    });
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await admin.from('events').update({
      sync_status: 'error',
      sync_error: msg.slice(0, 500),
    }).eq('id', event.id);
    await logSync({
      user_id: event.owner_id,
      event_id: event.id,
      direction: 'outbound',
      action: 'insert',
      status: 'error',
      error: msg,
    });
    return false;
  }
}
```

- [ ] **Step 2: Build pass**

- [ ] **Step 3: Commit**

```bash
git add lib/services/calendar-sync.ts
git commit -m "feat(sync): pushEventInsert — ARBIQ event → Google API"
```

### Task 27: pushEventUpdate + pushEventDelete

**Files:**
- Modify: `lib/services/calendar-sync.ts`

- [ ] **Step 1: Doplnit obě funkce**

```ts
export async function pushEventUpdate(event: EventRow): Promise<boolean> {
  if (!event.google_event_id) {
    // Event nikdy nedoputoval do Google (initial insert selhal) — zkus znovu insert
    return pushEventInsert(event, { withMeet: !!event.meet_link });
  }
  const admin = createAdminClient();
  try {
    const { calendar, calendarId } = await googleCalendarFor(event.owner_id);
    const payload = toGooglePayload(event, { withMeet: false }); // Meet už existuje
    const resp = await calendar.events.update({
      calendarId,
      eventId: event.google_event_id,
      sendUpdates: 'none',
      requestBody: payload,
      // If-Match header pomocí "ifMatch" support — googleapis to nepředává přes options,
      // takže jen na 412 odchytíme catch a vyřešíme konflikt v inbound sync
    });

    await admin.from('events').update({
      etag: resp.data.etag,
      sync_status: 'synced',
      sync_error: null,
      last_synced_at: new Date().toISOString(),
    }).eq('id', event.id);

    await logSync({
      user_id: event.owner_id,
      event_id: event.id,
      direction: 'outbound',
      action: 'update',
      status: 'ok',
    });
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await admin.from('events').update({
      sync_status: 'error',
      sync_error: msg.slice(0, 500),
    }).eq('id', event.id);
    await logSync({
      user_id: event.owner_id,
      event_id: event.id,
      direction: 'outbound',
      action: 'update',
      status: 'error',
      error: msg,
    });
    return false;
  }
}

export async function pushEventDelete(event: EventRow): Promise<boolean> {
  if (!event.google_event_id) {
    // Není v Google — jen smaž v DB
    const admin = createAdminClient();
    await admin.from('events').update({ deleted_at: new Date().toISOString() }).eq('id', event.id);
    return true;
  }
  const admin = createAdminClient();
  try {
    const { calendar, calendarId } = await googleCalendarFor(event.owner_id);
    await calendar.events.delete({
      calendarId,
      eventId: event.google_event_id,
      sendUpdates: 'none',
    });

    await admin.from('events').update({
      deleted_at: new Date().toISOString(),
      sync_status: 'synced',
      last_synced_at: new Date().toISOString(),
    }).eq('id', event.id);

    await logSync({
      user_id: event.owner_id,
      event_id: event.id,
      direction: 'outbound',
      action: 'delete',
      status: 'ok',
    });
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // 410 Gone = event už v Google smazán → považuj za úspěch
    if (msg.includes('410') || msg.includes('Resource has been deleted')) {
      await admin.from('events').update({ deleted_at: new Date().toISOString() }).eq('id', event.id);
      return true;
    }
    await admin.from('events').update({
      sync_status: 'error',
      sync_error: msg.slice(0, 500),
    }).eq('id', event.id);
    await logSync({
      user_id: event.owner_id,
      event_id: event.id,
      direction: 'outbound',
      action: 'delete',
      status: 'error',
      error: msg,
    });
    return false;
  }
}
```

- [ ] **Step 2: Build pass**

- [ ] **Step 3: Commit**

```bash
git add lib/services/calendar-sync.ts
git commit -m "feat(sync): pushEventUpdate + pushEventDelete"
```

### Task 28: Server Action — createEvent

**Files:**
- Create: `lib/actions/calendar.ts`

- [ ] **Step 1: Implementace s Zod validation**

```ts
// lib/actions/calendar.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireViewer } from '@/lib/supabase/viewer';
import { pushEventInsert, pushEventUpdate, pushEventDelete } from '@/lib/services/calendar-sync';

const isoDateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

const createSchema = z.object({
  title: z.string().min(1).max(1024),
  description: z.string().max(8000).optional().nullable(),
  location: z.string().max(500).optional().nullable(),
  start_at: isoDateTime,
  end_at: isoDateTime,
  all_day: z.boolean().default(false),
  timezone: z.string().default('Europe/Prague'),
  visibility: z.enum(['private', 'shared']).default('private'),
  attendees: z.array(z.object({ email: z.string().email() })).default([]),
  with_meet: z.boolean().default(false),
  lead_id: z.string().uuid().optional().nullable(),
  client_id: z.string().uuid().optional().nullable(),
  project_id: z.string().uuid().optional().nullable(),
}).refine(
  d => new Date(d.end_at) > new Date(d.start_at),
  { message: 'end_at musí být po start_at' },
).refine(
  d => [d.lead_id, d.client_id, d.project_id].filter(Boolean).length <= 1,
  { message: 'Event může mít maximálně jeden CRM link' },
);

export type CreateEventInput = z.infer<typeof createSchema>;

export async function createEvent(
  input: CreateEventInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const viewer = await requireViewer();
  if (viewer.isPreview) return { ok: false, error: 'preview mode' };

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: inserted, error } = await supabase
    .from('events')
    .insert({
      owner_id: viewer.id,
      title: parsed.data.title,
      description: parsed.data.description,
      location: parsed.data.location,
      start_at: parsed.data.start_at,
      end_at: parsed.data.end_at,
      all_day: parsed.data.all_day,
      timezone: parsed.data.timezone,
      visibility: parsed.data.visibility,
      attendees: parsed.data.attendees,
      lead_id: parsed.data.lead_id,
      client_id: parsed.data.client_id,
      project_id: parsed.data.project_id,
      sync_status: 'pending',
    })
    .select()
    .single();

  if (error || !inserted) return { ok: false, error: error?.message ?? 'insert failed' };

  // Async push do Google (best-effort, neblokuje response)
  pushEventInsert(inserted, { withMeet: parsed.data.with_meet }).catch(console.error);

  revalidatePath('/portal/(app)/crm/kalendar');
  return { ok: true, id: inserted.id };
}
```

- [ ] **Step 2: Build pass**

- [ ] **Step 3: Commit**

```bash
git add lib/actions/calendar.ts
git commit -m "feat(actions): createEvent Server Action with zod + async push"
```

### Task 29: Server Action — updateEvent

**Files:**
- Modify: `lib/actions/calendar.ts`

- [ ] **Step 1: Doplnit**

```ts
const updateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(1024).optional(),
  description: z.string().max(8000).nullable().optional(),
  location: z.string().max(500).nullable().optional(),
  start_at: isoDateTime.optional(),
  end_at: isoDateTime.optional(),
  all_day: z.boolean().optional(),
  visibility: z.enum(['private', 'shared']).optional(),
  attendees: z.array(z.object({ email: z.string().email() })).optional(),
  lead_id: z.string().uuid().nullable().optional(),
  client_id: z.string().uuid().nullable().optional(),
  project_id: z.string().uuid().nullable().optional(),
});

export type UpdateEventInput = z.infer<typeof updateSchema>;

export async function updateEvent(
  input: UpdateEventInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const viewer = await requireViewer();
  if (viewer.isPreview) return { ok: false, error: 'preview mode' };

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const { id, ...patch } = parsed.data;
  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from('events')
    .update({ ...patch, sync_status: 'pending' })
    .eq('id', id)
    .select()
    .single();

  if (error || !updated) return { ok: false, error: error?.message ?? 'update failed' };

  pushEventUpdate(updated).catch(console.error);

  revalidatePath('/portal/(app)/crm/kalendar');
  return { ok: true };
}
```

- [ ] **Step 2: Build pass + commit**

```bash
git add lib/actions/calendar.ts
git commit -m "feat(actions): updateEvent Server Action"
```

### Task 30: Server Action — deleteEvent + moveEvent + resizeEvent

**Files:**
- Modify: `lib/actions/calendar.ts`

- [ ] **Step 1: Doplnit zbylé akce**

```ts
export async function deleteEvent(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const viewer = await requireViewer();
  if (viewer.isPreview) return { ok: false, error: 'preview mode' };

  const supabase = await createClient();
  const { data: ev, error: fetchErr } = await supabase
    .from('events')
    .select()
    .eq('id', id)
    .single();
  if (fetchErr || !ev) return { ok: false, error: 'event not found' };

  pushEventDelete(ev).catch(console.error);

  // Soft-delete v DB hned (UI nečeká na Google)
  await supabase.from('events').update({ deleted_at: new Date().toISOString() }).eq('id', id);

  revalidatePath('/portal/(app)/crm/kalendar');
  return { ok: true };
}

const moveSchema = z.object({
  id: z.string().uuid(),
  start_at: isoDateTime,
  end_at: isoDateTime,
}).refine(d => new Date(d.end_at) > new Date(d.start_at));

export async function moveEvent(input: z.infer<typeof moveSchema>) {
  return updateEvent(input as UpdateEventInput);
}

export async function resizeEvent(input: z.infer<typeof moveSchema>) {
  return updateEvent(input as UpdateEventInput);
}
```

- [ ] **Step 2: Build pass + commit**

```bash
git add lib/actions/calendar.ts
git commit -m "feat(actions): deleteEvent + moveEvent + resizeEvent"
```

### Task 31: Manuální QA — outbound sync E2E

> Connection musí existovat (Task 24). Test že create v ARBIQ → event v Google.

- [ ] **Step 1: V Supabase Studio nebo psql vložit testovací event**

```sql
insert into events (owner_id, title, start_at, end_at, timezone, visibility, sync_status)
values (
  (select id from profiles where email = 'bartolomej@arbey.cz' limit 1),
  'Test event — outbound sync',
  '2026-05-20T09:00:00Z', '2026-05-20T10:00:00Z',
  'Europe/Prague', 'private', 'pending'
);
```

> **Pozn.:** Direct INSERT obejde Server Action. Pro plnohodnotný test použít UI po Phase 6+. Tady jen ověřujeme low-level push:

- [ ] **Step 2: Z Node REPL spustit `pushEventInsert`**

```bash
node --experimental-loader ./node_modules/tsx/esm/loader.mjs -e "
import('./lib/services/calendar-sync.js').then(async (m) => {
  const ev = await fetch(process.env.SUPABASE_URL + '/rest/v1/events?title=eq.Test event — outbound sync', {
    headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY }
  }).then(r => r.json()).then(rows => rows[0]);
  console.log(await m.pushEventInsert(ev, { withMeet: false }));
});
"
```

> **Alternativně:** otevřít Settings page (až bude UI), využít jakékoli budoucí trigger flow.

- [ ] **Step 3: Otevřít Google Calendar v prohlížeči — ověřit, že event "Test event — outbound sync" je tam**

- [ ] **Step 4: V DB ověřit, že `events.google_event_id` je nyní non-NULL a `sync_status='synced'`**

```bash
psql $DATABASE_URL -c "select id, title, google_event_id, sync_status, last_synced_at from events;"
```

- [ ] **Step 5: V `event_sync_log` ověřit log řádek**

```bash
psql $DATABASE_URL -c "select direction, action, status from event_sync_log order by occurred_at desc limit 5;"
```

Expected: `outbound | insert | ok`.

- [ ] **Step 6: (žádný commit — QA-only)**

### Task 32: Cron `/api/cron/calendar-retry`

**Files:**
- Create: `app/api/cron/calendar-retry/route.ts`

- [ ] **Step 1: Implementace**

```ts
// app/api/cron/calendar-retry/route.ts
import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { pushEventInsert, pushEventUpdate, pushEventDelete } from '@/lib/services/calendar-sync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_RETRY_AGE_HOURS = 24;

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (token !== process.env.CRON_SECRET) return new NextResponse('forbidden', { status: 403 });

  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - MAX_RETRY_AGE_HOURS * 3600 * 1000).toISOString();
  const { data: failing } = await admin
    .from('events')
    .select()
    .eq('sync_status', 'error')
    .gte('updated_at', cutoff)
    .limit(50);

  let retried = 0;
  for (const ev of failing ?? []) {
    if (ev.deleted_at) {
      await pushEventDelete(ev);
    } else if (ev.google_event_id) {
      await pushEventUpdate(ev);
    } else {
      await pushEventInsert(ev, { withMeet: !!ev.meet_link });
    }
    retried++;
  }

  return NextResponse.json({ ok: true, retried });
}
```

- [ ] **Step 2: Build pass + commit**

```bash
git add app/api/cron/calendar-retry/route.ts
git commit -m "feat(cron): calendar-retry — re-push events with sync_status=error"
```

---

## Phase 5 — Inbound sync + crony

### Task 33: lib/services/calendar-sync.ts — upsertFromGoogle

**Files:**
- Modify: `lib/services/calendar-sync.ts`

- [ ] **Step 1: Doplnit funkci**

```ts
import { fromGooglePayload } from '@/lib/google/calendar';
import type { GoogleEvent } from '@/lib/google/types';

/**
 * Upsert eventu přicházejícího z Google → DB.
 * - status='cancelled' → soft-delete
 * - existující google_event_id → UPDATE (jen pokud etag se liší)
 * - nový → INSERT
 * - konflikt (DB má sync_status='pending') → Google updated novější vyhrává
 */
export async function upsertFromGoogle(userId: string, g: GoogleEvent): Promise<'inserted' | 'updated' | 'deleted' | 'noop' | 'conflict'> {
  if (!g.id) return 'noop';
  const admin = createAdminClient();

  if (g.status === 'cancelled') {
    const { data: existing } = await admin
      .from('events')
      .select('id')
      .eq('owner_id', userId)
      .eq('google_event_id', g.id)
      .maybeSingle();
    if (existing) {
      await admin.from('events').update({ deleted_at: new Date().toISOString() }).eq('id', existing.id);
      await logSync({ user_id: userId, event_id: existing.id, direction: 'inbound', action: 'delete', status: 'ok' });
      return 'deleted';
    }
    return 'noop';
  }

  const { data: existing } = await admin
    .from('events')
    .select('id, etag, sync_status, updated_at')
    .eq('owner_id', userId)
    .eq('google_event_id', g.id)
    .maybeSingle();

  const incoming = fromGooglePayload(g, userId);

  if (existing) {
    if (existing.etag === g.etag) return 'noop';

    // Konflikt? Pokud lokál má pending změny, srovnej čas
    if (existing.sync_status === 'pending') {
      const localUpdated = new Date(existing.updated_at);
      const googleUpdated = new Date(g.updated ?? 0);
      if (localUpdated > googleUpdated) {
        // ARBIQ je novější — necháme ho propagated push-em, neaplikujeme inbound
        return 'conflict';
      }
    }

    await admin.from('events').update({
      title: incoming.title,
      description: incoming.description,
      location: incoming.location,
      start_at: incoming.start_at,
      end_at: incoming.end_at,
      all_day: incoming.all_day,
      timezone: incoming.timezone,
      attendees: incoming.attendees,
      meet_link: incoming.meet_link,
      conference_data: incoming.conference_data,
      visibility: incoming.visibility,
      etag: g.etag,
      sync_status: 'synced',
      sync_error: null,
      last_synced_at: new Date().toISOString(),
    }).eq('id', existing.id);

    await logSync({ user_id: userId, event_id: existing.id, direction: 'inbound', action: 'update', status: 'ok' });
    return 'updated';
  }

  // Nový event z Google
  const { data: inserted } = await admin.from('events').insert(incoming).select('id').single();
  await logSync({ user_id: userId, event_id: inserted?.id ?? null, direction: 'inbound', action: 'insert', status: 'ok' });
  return 'inserted';
}
```

- [ ] **Step 2: Build pass + commit**

```bash
git add lib/services/calendar-sync.ts
git commit -m "feat(sync): upsertFromGoogle — inbound event handling + conflict detection"
```

### Task 34: pullChanges (incremental via syncToken)

**Files:**
- Modify: `lib/services/calendar-sync.ts`

- [ ] **Step 1: Doplnit**

```ts
import { googleCalendarFor } from '@/lib/google/calendar';

export async function pullChanges(userId: string): Promise<{ pulled: number; resetSyncToken: boolean }> {
  const admin = createAdminClient();
  const { data: conn } = await admin
    .from('google_oauth_connections')
    .select('sync_token, calendar_id')
    .eq('user_id', userId)
    .single();
  if (!conn) throw new Error(`No connection for ${userId}`);

  const { calendar, calendarId } = await googleCalendarFor(userId);
  let pageToken: string | undefined;
  let nextSyncToken: string | undefined;
  let pulled = 0;

  try {
    do {
      const resp = await calendar.events.list({
        calendarId,
        syncToken: conn.sync_token ?? undefined,
        pageToken,
        showDeleted: true,
        singleEvents: true,
        maxResults: 250,
      });
      for (const ev of resp.data.items ?? []) {
        await upsertFromGoogle(userId, ev);
        pulled++;
      }
      pageToken = resp.data.nextPageToken ?? undefined;
      nextSyncToken = resp.data.nextSyncToken ?? undefined;
    } while (pageToken);

    await admin.from('google_oauth_connections').update({
      sync_token: nextSyncToken ?? conn.sync_token,
      last_sync_at: new Date().toISOString(),
      last_error: null,
    }).eq('user_id', userId);

    return { pulled, resetSyncToken: false };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // 410 Gone = syncToken invalid → reset, caller spustí initialSync
    if (msg.includes('410') || msg.includes('Sync token')) {
      await admin.from('google_oauth_connections').update({ sync_token: null }).eq('user_id', userId);
      return { pulled, resetSyncToken: true };
    }
    await admin.from('google_oauth_connections').update({
      status: msg.includes('invalid_grant') ? 'revoked' : 'error',
      last_error: msg.slice(0, 500),
    }).eq('user_id', userId);
    throw e;
  }
}
```

- [ ] **Step 2: Build pass + commit**

```bash
git add lib/services/calendar-sync.ts
git commit -m "feat(sync): pullChanges — incremental events.list via syncToken"
```

### Task 35: initialSync (po OAuth callback)

**Files:**
- Modify: `lib/services/calendar-sync.ts`

- [ ] **Step 1: Doplnit + napojit do OAuth callback**

```ts
import { subDays } from 'date-fns';

export async function initialSync(userId: string): Promise<number> {
  const admin = createAdminClient();
  const { calendar, calendarId } = await googleCalendarFor(userId);

  // Vynuluj sync_token (pro initial musíme bez něj)
  await admin.from('google_oauth_connections').update({ sync_token: null }).eq('user_id', userId);

  let pageToken: string | undefined;
  let nextSyncToken: string | undefined;
  let pulled = 0;
  const timeMin = subDays(new Date(), 30).toISOString();

  do {
    const resp = await calendar.events.list({
      calendarId,
      timeMin,
      pageToken,
      singleEvents: true,
      maxResults: 250,
    });
    for (const ev of resp.data.items ?? []) {
      await upsertFromGoogle(userId, ev);
      pulled++;
    }
    pageToken = resp.data.nextPageToken ?? undefined;
    nextSyncToken = resp.data.nextSyncToken ?? undefined;
  } while (pageToken);

  await admin.from('google_oauth_connections').update({
    sync_token: nextSyncToken,
    last_sync_at: new Date().toISOString(),
  }).eq('user_id', userId);

  await logSync({
    user_id: userId,
    event_id: null,
    direction: 'inbound',
    action: 'full_resync',
    status: 'ok',
    response_payload: { pulled },
  });

  return pulled;
}
```

- [ ] **Step 2: Napojit do OAuth callback (Task 19)**

V `app/api/google/oauth/callback/route.ts` před `return NextResponse.redirect(settingsUrl?ok=1)`:

```ts
// Po upsert connection, spustit initial sync (fire-and-forget)
import { initialSync } from '@/lib/services/calendar-sync';
import { startWatch } from '@/lib/services/calendar-sync';
...
initialSync(userId).then(() => startWatch(userId)).catch(console.error);
```

- [ ] **Step 3: Build pass + commit**

```bash
git add lib/services/calendar-sync.ts app/api/google/oauth/callback/route.ts
git commit -m "feat(sync): initialSync (last 30d) + wire into OAuth callback"
```

### Task 36: startWatch + renewWatch

**Files:**
- Modify: `lib/services/calendar-sync.ts`

- [ ] **Step 1: Doplnit**

```ts
import crypto from 'node:crypto';
import { signChannelToken } from '@/lib/google/webhook';

const WATCH_TTL_DAYS = 7;

export async function startWatch(userId: string): Promise<void> {
  const admin = createAdminClient();
  const { calendar, calendarId } = await googleCalendarFor(userId);
  const channelId = crypto.randomUUID();
  const channelToken = signChannelToken(userId);
  const expiration = Date.now() + WATCH_TTL_DAYS * 86400 * 1000;

  const resp = await calendar.events.watch({
    calendarId,
    requestBody: {
      id: channelId,
      type: 'web_hook',
      address: `${process.env.APP_URL}/api/google/calendar/webhook`,
      token: channelToken,
      expiration: expiration.toString(),
    },
  });

  await admin.from('google_oauth_connections').update({
    watch_channel_id: channelId,
    watch_resource_id: resp.data.resourceId,
    watch_expires_at: new Date(parseInt(resp.data.expiration!)).toISOString(),
  }).eq('user_id', userId);

  await logSync({
    user_id: userId,
    event_id: null,
    direction: 'inbound',
    action: 'watch_renew',
    status: 'ok',
  });
}

export async function renewWatch(userId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: conn } = await admin
    .from('google_oauth_connections')
    .select('watch_channel_id, watch_resource_id')
    .eq('user_id', userId)
    .single();

  if (conn?.watch_channel_id && conn?.watch_resource_id) {
    try {
      const { calendar } = await googleCalendarFor(userId);
      await calendar.channels.stop({
        requestBody: { id: conn.watch_channel_id, resourceId: conn.watch_resource_id },
      });
    } catch {
      // best-effort
    }
  }
  await startWatch(userId);
}
```

- [ ] **Step 2: Build pass + commit**

```bash
git add lib/services/calendar-sync.ts
git commit -m "feat(sync): startWatch + renewWatch (Google push notifications)"
```

### Task 37: Webhook endpoint

**Files:**
- Create: `app/api/google/calendar/webhook/route.ts`

- [ ] **Step 1: Implementace**

```ts
// app/api/google/calendar/webhook/route.ts
import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyChannelToken } from '@/lib/google/webhook';
import { pullChanges, initialSync } from '@/lib/services/calendar-sync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const channelId = req.headers.get('x-goog-channel-id');
  const channelToken = req.headers.get('x-goog-channel-token');
  const resourceState = req.headers.get('x-goog-resource-state');

  if (!channelId || !channelToken) return new NextResponse(null, { status: 400 });

  // 'sync' = init ping po watch — jen ACK
  if (resourceState === 'sync') return new NextResponse(null, { status: 200 });

  const admin = createAdminClient();
  const { data: conn } = await admin
    .from('google_oauth_connections')
    .select('user_id')
    .eq('watch_channel_id', channelId)
    .single();

  if (!conn) return new NextResponse('channel not found', { status: 404 });

  if (!verifyChannelToken(channelToken, conn.user_id)) {
    return new NextResponse('forbidden', { status: 403 });
  }

  // Pull changes (async pokud rychle, sync pokud krátké)
  try {
    const result = await pullChanges(conn.user_id);
    if (result.resetSyncToken) {
      await initialSync(conn.user_id);
    }
  } catch (e) {
    console.error('Webhook pull failed', e);
  }

  return new NextResponse(null, { status: 200 });
}
```

- [ ] **Step 2: Build pass + commit**

```bash
git add app/api/google/calendar/webhook/route.ts
git commit -m "feat(google): /api/google/calendar/webhook — inbound sync trigger"
```

### Task 38: Cron `/api/cron/calendar-poll` (safety poll)

**Files:**
- Create: `app/api/cron/calendar-poll/route.ts`

- [ ] **Step 1: Implementace**

```ts
// app/api/cron/calendar-poll/route.ts
import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { pullChanges, initialSync } from '@/lib/services/calendar-sync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (token !== process.env.CRON_SECRET) return new NextResponse('forbidden', { status: 403 });

  const admin = createAdminClient();
  const { data: connections } = await admin
    .from('google_oauth_connections')
    .select('user_id')
    .eq('status', 'connected');

  let succeeded = 0;
  let failed = 0;
  for (const c of connections ?? []) {
    try {
      const result = await pullChanges(c.user_id);
      if (result.resetSyncToken) await initialSync(c.user_id);
      succeeded++;
    } catch (e) {
      console.error(`Poll failed for ${c.user_id}:`, e);
      failed++;
    }
  }

  return NextResponse.json({ ok: true, succeeded, failed, total: (connections ?? []).length });
}
```

- [ ] **Step 2: Build pass + commit**

```bash
git add app/api/cron/calendar-poll/route.ts
git commit -m "feat(cron): calendar-poll — 5min safety net pull"
```

### Task 39: Cron `/api/cron/calendar-watch-renew`

**Files:**
- Create: `app/api/cron/calendar-watch-renew/route.ts`

- [ ] **Step 1: Implementace**

```ts
// app/api/cron/calendar-watch-renew/route.ts
import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { renewWatch } from '@/lib/services/calendar-sync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (token !== process.env.CRON_SECRET) return new NextResponse('forbidden', { status: 403 });

  const admin = createAdminClient();
  const cutoff = new Date(Date.now() + 48 * 3600 * 1000).toISOString(); // do 48h
  const { data: connections } = await admin
    .from('google_oauth_connections')
    .select('user_id')
    .eq('status', 'connected')
    .lt('watch_expires_at', cutoff);

  let renewed = 0;
  for (const c of connections ?? []) {
    try {
      await renewWatch(c.user_id);
      renewed++;
    } catch (e) {
      console.error(`Watch renew failed for ${c.user_id}:`, e);
    }
  }

  return NextResponse.json({ ok: true, renewed });
}
```

- [ ] **Step 2: Build pass + commit**

```bash
git add app/api/cron/calendar-watch-renew/route.ts
git commit -m "feat(cron): calendar-watch-renew — 24h channel renewal"
```

### Task 40: vercel.json crony

**Files:**
- Modify: `vercel.json`

- [ ] **Step 1: Doplnit crony do existujícího pole**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "regions": ["fra1"],
  "crons": [
    {"path": "/api/cron/overdue-invoices", "schedule": "0 6 * * *"},
    {"path": "/api/cron/stale-clients", "schedule": "0 7 * * 1"},
    {"path": "/api/cron/calendar-poll", "schedule": "*/5 * * * *"},
    {"path": "/api/cron/calendar-watch-renew", "schedule": "0 3 * * *"},
    {"path": "/api/cron/calendar-retry", "schedule": "*/5 * * * *"}
  ]
}
```

> **Pozn.:** Vercel Hobby plan má limit na počet cron jobs. Pokud narazíte, sloučit `calendar-poll` a `calendar-retry` do jednoho endpointu.

- [ ] **Step 2: Commit**

```bash
git add vercel.json
git commit -m "chore(vercel): add calendar crons (poll 5min, watch-renew 24h, retry 5min)"
```

### Task 41: Manuální QA — inbound sync E2E

> Connection musí existovat. Test: změna v Google Calendaru → reflekce v ARBIQ DB.

- [ ] **Step 1: V Google Calendar (web UI) vytvořit nový event "Test inbound" na zítra 14:00–15:00**

- [ ] **Step 2: Počkat max 5 min (safety poll) NEBO trigger webhook (pokud APP_URL je HTTPS přes ngrok)**

- [ ] **Step 3: Ověřit v DB**

```bash
psql $DATABASE_URL -c "select id, title, start_at, sync_status, google_event_id from events where title = 'Test inbound';"
```

Expected: 1 řádek, sync_status='synced', google_event_id non-null.

- [ ] **Step 4: V Google Calendar event modifikovat — změnit title na "Test inbound MOD"**

- [ ] **Step 5: Trigger webhook nebo počkat 5 min, ověřit v DB**

Expected: title v DB se aktualizoval.

- [ ] **Step 6: V Google Calendar event smazat**

- [ ] **Step 7: Trigger webhook / počkat, ověřit v DB**

Expected: `deleted_at` non-null.

- [ ] **Step 8: (žádný commit — QA-only)**

---

## Phase 6 — Calendar route + shell

### Task 42: Route + page.tsx (server)

**Files:**
- Create: `app/portal/(app)/crm/kalendar/page.tsx`

- [ ] **Step 1: Implementace**

```tsx
// app/portal/(app)/crm/kalendar/page.tsx
import { createClient } from '@/lib/supabase/server';
import { requireViewer } from '@/lib/supabase/viewer';
import PageHeader from '@/components/portal/PageHeader';
import CalendarClient from './CalendarClient';
import { startOfWeek, endOfWeek, subWeeks, addWeeks } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function KalendarPage() {
  const viewer = await requireViewer();

  if (viewer.isPreview) {
    return (
      <div>
        <PageHeader eyebrow="CRM · DEMO" title="Kalendář" subtitle="Demo data." />
        <div className="px-8 py-8">
          <p className="text-sepia/70">Kalendář v demo módu zatím není.</p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();

  // Initial range: previous + current + next week
  const now = new Date();
  const rangeStart = subWeeks(startOfWeek(now, { weekStartsOn: 1 }), 1).toISOString();
  const rangeEnd = addWeeks(endOfWeek(now, { weekStartsOn: 1 }), 2).toISOString();

  const { data: events } = await supabase
    .from('events')
    .select(`
      *,
      lead:landing_leads(id, name, case_number),
      client:profiles!events_client_id_fkey(id, full_name),
      project:projects(id, name)
    `)
    .gte('start_at', rangeStart)
    .lt('start_at', rangeEnd)
    .is('deleted_at', null)
    .order('start_at', { ascending: true });

  const { data: connection } = await supabase
    .from('google_oauth_connections')
    .select('google_user_email, last_sync_at, status, last_error')
    .eq('user_id', viewer.id)
    .maybeSingle();

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      <CalendarClient
        initialEvents={events ?? []}
        viewerId={viewer.id}
        connection={connection}
      />
    </div>
  );
}
```

- [ ] **Step 2: Build pass (může selhat na chybějícím CalendarClient — fix v Task 43)**

### Task 43: CalendarClient — state container

**Files:**
- Create: `app/portal/(app)/crm/kalendar/CalendarClient.tsx`

- [ ] **Step 1: Implementace**

```tsx
// app/portal/(app)/crm/kalendar/CalendarClient.tsx
'use client';

import { useState, useCallback } from 'react';
import { startOfWeek } from 'date-fns';
import CalendarShell from '@/components/portal/calendar/CalendarShell';

export type CalendarView = 'day' | 'week' | 'month' | 'agenda';

export default function CalendarClient({
  initialEvents,
  viewerId,
  connection,
}: {
  initialEvents: any[];
  viewerId: string;
  connection: any | null;
}) {
  const [view, setView] = useState<CalendarView>('week');
  const [anchorDate, setAnchorDate] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [events] = useState(initialEvents);

  return (
    <CalendarShell
      view={view}
      onViewChange={setView}
      anchorDate={anchorDate}
      onAnchorChange={setAnchorDate}
      events={events}
      selectedEventId={selectedEventId}
      onSelectEvent={setSelectedEventId}
      viewerId={viewerId}
      connection={connection}
    />
  );
}
```

- [ ] **Step 2: Commit (společně se Task 44)**

### Task 44: CalendarShell — layout container

**Files:**
- Create: `components/portal/calendar/CalendarShell.tsx`

- [ ] **Step 1: Implementace (stub views, doplníme v dalších taskech)**

```tsx
// components/portal/calendar/CalendarShell.tsx
'use client';

import CalendarToolbar from './CalendarToolbar';
import SyncStatusBar from './SyncStatusBar';
import type { CalendarView } from '@/app/portal/(app)/crm/kalendar/CalendarClient';

export default function CalendarShell({
  view, onViewChange,
  anchorDate, onAnchorChange,
  events, selectedEventId, onSelectEvent,
  viewerId, connection,
}: {
  view: CalendarView;
  onViewChange: (v: CalendarView) => void;
  anchorDate: Date;
  onAnchorChange: (d: Date) => void;
  events: any[];
  selectedEventId: string | null;
  onSelectEvent: (id: string | null) => void;
  viewerId: string;
  connection: any | null;
}) {
  return (
    <div className="flex flex-col h-full">
      <CalendarToolbar
        view={view}
        onViewChange={onViewChange}
        anchorDate={anchorDate}
        onAnchorChange={onAnchorChange}
      />
      <div className="flex-1 overflow-auto">
        {view === 'week' && <div className="p-8 text-sepia/60 font-mono text-xs">WEEK VIEW — implementuje se v Task 47–51</div>}
        {view === 'day' && <div className="p-8 text-sepia/60 font-mono text-xs">DAY VIEW — implementuje se v Task 53</div>}
        {view === 'month' && <div className="p-8 text-sepia/60 font-mono text-xs">MONTH VIEW — implementuje se v Task 54</div>}
        {view === 'agenda' && <div className="p-8 text-sepia/60 font-mono text-xs">AGENDA — implementuje se v Task 55</div>}
      </div>
      <SyncStatusBar connection={connection} eventCount={events.length} />
    </div>
  );
}
```

### Task 45: CalendarToolbar

**Files:**
- Create: `components/portal/calendar/CalendarToolbar.tsx`

- [ ] **Step 1: Implementace**

```tsx
// components/portal/calendar/CalendarToolbar.tsx
'use client';

import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format, addDays, addWeeks, addMonths, startOfWeek, startOfMonth, startOfDay } from 'date-fns';
import { cs } from 'date-fns/locale';
import type { CalendarView } from '@/app/portal/(app)/crm/kalendar/CalendarClient';

const VIEWS: { id: CalendarView; label: string }[] = [
  { id: 'day', label: 'Den' },
  { id: 'week', label: 'Týden' },
  { id: 'month', label: 'Měsíc' },
  { id: 'agenda', label: 'Agenda' },
];

export default function CalendarToolbar({
  view, onViewChange, anchorDate, onAnchorChange,
}: {
  view: CalendarView;
  onViewChange: (v: CalendarView) => void;
  anchorDate: Date;
  onAnchorChange: (d: Date) => void;
}) {
  function prev() {
    if (view === 'day') onAnchorChange(addDays(anchorDate, -1));
    if (view === 'week') onAnchorChange(addWeeks(anchorDate, -1));
    if (view === 'month') onAnchorChange(addMonths(anchorDate, -1));
    if (view === 'agenda') onAnchorChange(addDays(anchorDate, -7));
  }
  function next() {
    if (view === 'day') onAnchorChange(addDays(anchorDate, 1));
    if (view === 'week') onAnchorChange(addWeeks(anchorDate, 1));
    if (view === 'month') onAnchorChange(addMonths(anchorDate, 1));
    if (view === 'agenda') onAnchorChange(addDays(anchorDate, 7));
  }
  function today() {
    const now = new Date();
    if (view === 'week') onAnchorChange(startOfWeek(now, { weekStartsOn: 1 }));
    else if (view === 'month') onAnchorChange(startOfMonth(now));
    else onAnchorChange(startOfDay(now));
  }

  const title = format(anchorDate, view === 'day' ? 'd. MMMM yyyy' : 'LLLL yyyy', { locale: cs });

  return (
    <div className="bg-coffee border-b border-tobacco px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h2 className="font-display italic font-black text-xl text-moonlight capitalize">{title}</h2>
        <div className="flex items-center gap-1">
          <button onClick={prev} className="border border-tobacco px-2 py-1.5 text-sandstone hover:text-moonlight hover:border-caramel/50">
            <ChevronLeft size={14} />
          </button>
          <button onClick={today} className="border border-tobacco px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-sandstone hover:text-moonlight hover:border-caramel/50">
            Dnes
          </button>
          <button onClick={next} className="border border-tobacco px-2 py-1.5 text-sandstone hover:text-moonlight hover:border-caramel/50">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex">
          {VIEWS.map((v, i) => (
            <button
              key={v.id}
              onClick={() => onViewChange(v.id)}
              className={`border border-tobacco px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest ${
                view === v.id
                  ? 'bg-caramel text-espresso border-caramel'
                  : 'text-sandstone hover:text-moonlight hover:border-caramel/50'
              } ${i > 0 ? '-ml-px' : ''}`}
            >
              {v.label}
            </button>
          ))}
        </div>
        <button className="inline-flex items-center gap-2 bg-caramel text-espresso px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest font-bold hover:bg-caramel-light">
          <Plus size={12} /> Nová schůzka
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/portal/calendar/CalendarToolbar.tsx components/portal/calendar/CalendarShell.tsx app/portal/\(app\)/crm/kalendar/CalendarClient.tsx app/portal/\(app\)/crm/kalendar/page.tsx
git commit -m "feat(calendar): route /crm/kalendar + Shell + Toolbar"
```

### Task 46: SyncStatusBar (stub)

**Files:**
- Create: `components/portal/calendar/SyncStatusBar.tsx`

- [ ] **Step 1: Implementace**

```tsx
// components/portal/calendar/SyncStatusBar.tsx
'use client';

import { formatDistanceToNow } from 'date-fns';
import { cs } from 'date-fns/locale';

export default function SyncStatusBar({
  connection,
  eventCount,
}: {
  connection: any | null;
  eventCount: number;
}) {
  const labelClass = 'font-mono text-[9px] uppercase tracking-widest';

  if (!connection) {
    return (
      <div className="bg-espresso border-t border-tobacco px-6 py-2 flex items-center justify-between">
        <span className={`${labelClass} text-sandstone`}>● Google Calendar není připojen — <a href="/portal/nastaveni/kalendar" className="text-caramel hover:text-caramel-light">připojit</a></span>
        <span className={`${labelClass} text-sandstone`}>{eventCount} eventů</span>
      </div>
    );
  }

  let stateColor = 'text-olive';
  let stateText = 'OK';
  if (connection.status === 'error') { stateColor = 'text-rust'; stateText = 'CHYBA'; }
  if (connection.status === 'revoked') { stateColor = 'text-caramel'; stateText = 'TOKEN ZRUŠEN'; }

  return (
    <div className="bg-espresso border-t border-tobacco px-6 py-2 flex items-center justify-between">
      <span className={`${labelClass} ${stateColor}`}>
        ● Google sync · {stateText}
        {connection.last_sync_at && (
          <span className="text-sandstone ml-2">
            · poslední pull {formatDistanceToNow(new Date(connection.last_sync_at), { addSuffix: true, locale: cs })}
          </span>
        )}
      </span>
      <span className={`${labelClass} text-sandstone`}>{eventCount} eventů</span>
    </div>
  );
}
```

- [ ] **Step 2: Build + spustit dev server, otevřít `/portal/crm/kalendar`**

```bash
npm run dev
```

Ověřit:
- Toolbar zobrazuje aktuální měsíc, navigace funguje
- View switcher mění zobrazení placeholderů
- Sync status bar dole zobrazuje stav

- [ ] **Step 3: Commit**

```bash
git add components/portal/calendar/SyncStatusBar.tsx
git commit -m "feat(calendar): SyncStatusBar — connection + event count"
```

---

## Phase 7 — Week view (read-only)

### Task 47: WeekView — grid layout

**Files:**
- Create: `components/portal/calendar/WeekView.tsx`

- [ ] **Step 1: Implementace (jen layout, events v Task 49)**

```tsx
// components/portal/calendar/WeekView.tsx
'use client';

import { addDays, format, isToday, startOfDay } from 'date-fns';
import { cs } from 'date-fns/locale';
import EventBlock from './EventBlock';
import type { EventRow } from '@/lib/google/types';

const HOUR_HEIGHT = 48; // px
const START_HOUR = 7;
const END_HOUR = 22;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

export default function WeekView({
  anchorDate,
  events,
  selectedEventId,
  onSelectEvent,
  viewerId,
}: {
  anchorDate: Date;
  events: any[];
  selectedEventId: string | null;
  onSelectEvent: (id: string | null) => void;
  viewerId: string;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(anchorDate, i));

  return (
    <div className="grid h-full" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
      <div className="border-r border-tobacco border-b" />
      {days.map((d) => (
        <div
          key={d.toISOString()}
          className={`border-r border-tobacco border-b text-center py-2 ${
            isToday(d) ? 'bg-caramel/8' : ''
          }`}
        >
          <div className="font-mono text-[9px] uppercase tracking-widest text-sandstone">
            {format(d, 'EEE', { locale: cs })}
          </div>
          <div className={`font-display font-black text-2xl mt-1 ${isToday(d) ? 'text-caramel' : 'text-moonlight'}`}>
            {format(d, 'd')}
          </div>
        </div>
      ))}

      <div className="border-r border-tobacco">
        {HOURS.map(h => (
          <div key={h} className="text-right pr-2 pt-1 font-mono text-[9px] text-sandstone" style={{ height: HOUR_HEIGHT }}>
            {String(h).padStart(2, '0')}:00
          </div>
        ))}
      </div>

      {days.map((d) => (
        <div key={d.toISOString()} className="border-r border-tobacco relative" style={{ height: HOURS.length * HOUR_HEIGHT }}>
          {HOURS.map(h => (
            <div key={h} className="border-b border-tobacco/40" style={{ height: HOUR_HEIGHT }} />
          ))}
          {events
            .filter(e => isSameDayLocal(new Date(e.start_at), d))
            .map(e => (
              <EventBlock
                key={e.id}
                event={e}
                hourHeight={HOUR_HEIGHT}
                startHour={START_HOUR}
                viewerId={viewerId}
                selected={e.id === selectedEventId}
                onClick={() => onSelectEvent(e.id)}
              />
            ))}
        </div>
      ))}
    </div>
  );
}

function isSameDayLocal(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}
```

- [ ] **Step 2: Commit (společně s EventBlock — Task 48)**

### Task 48: EventBlock — vizuální komponenta eventu

**Files:**
- Create: `components/portal/calendar/EventBlock.tsx`

- [ ] **Step 1: Implementace s 3 vizuálními variantami**

```tsx
// components/portal/calendar/EventBlock.tsx
'use client';

import { differenceInMinutes, format } from 'date-fns';
import Link from 'next/link';

export default function EventBlock({
  event,
  hourHeight,
  startHour,
  viewerId,
  selected,
  onClick,
}: {
  event: any;
  hourHeight: number;
  startHour: number;
  viewerId: string;
  selected: boolean;
  onClick: () => void;
}) {
  const start = new Date(event.start_at);
  const end = new Date(event.end_at);
  const startMin = start.getHours() * 60 + start.getMinutes() - startHour * 60;
  const durationMin = differenceInMinutes(end, start);
  const top = (startMin / 60) * hourHeight;
  const height = Math.max(22, (durationMin / 60) * hourHeight);

  const isOwn = event.owner_id === viewerId;
  const isShared = event.visibility === 'shared';
  const hasCrmLink = event.lead_id || event.client_id || event.project_id;
  const isPrivateGoogle = !isOwn && !isShared && !hasCrmLink; // shouldn't happen kvůli RLS ale safety

  let cls = '';
  if (isShared) {
    cls = 'bg-parchment-gold/14 border-l-3 border-parchment-gold text-parchment-gold';
  } else if (isOwn && hasCrmLink) {
    cls = 'bg-caramel/20 border-l-3 border-caramel text-parchment-gold';
  } else if (isOwn) {
    cls = 'bg-caramel/15 border-l-3 border-caramel text-parchment-gold';
  } else {
    cls = 'bg-sandstone/12 border-l-3 border-sandstone text-sandstone italic';
  }
  if (event.sync_status === 'error') {
    cls = 'bg-rust/15 border-l-3 border-rust text-rust';
  }
  if (selected) {
    cls += ' ring-2 ring-caramel';
  }

  const crmBadge = event.lead?.case_number
    ? `→ LEAD ${event.lead.case_number}`
    : event.client?.full_name
    ? `→ KLIENT ${event.client.full_name}`
    : event.project?.name
    ? `→ PROJEKT ${event.project.name}`
    : null;

  return (
    <button
      onClick={onClick}
      className={`absolute left-1 right-1 px-2 py-1 text-left overflow-hidden ${cls}`}
      style={{ top, height }}
    >
      {isShared && (
        <span className="block font-mono text-[8px] uppercase tracking-widest mb-0.5">◈ TEAM</span>
      )}
      <strong className="block text-xs leading-tight">{event.title}</strong>
      <span className="block font-mono text-[9px] uppercase tracking-wider opacity-80 mt-0.5">
        {format(start, 'HH:mm')}–{format(end, 'HH:mm')}
        {event.location && ` · ${event.location}`}
      </span>
      {crmBadge && (
        <span className="block font-mono text-[8px] uppercase tracking-wider mt-1 border-b border-dashed border-current inline-block pb-px">
          {crmBadge}
        </span>
      )}
    </button>
  );
}
```

- [ ] **Step 2: Build + commit**

```bash
git add components/portal/calendar/EventBlock.tsx components/portal/calendar/WeekView.tsx
git commit -m "feat(calendar): WeekView grid + EventBlock (3 visual variants)"
```

### Task 49: Wire WeekView do CalendarShell

**Files:**
- Modify: `components/portal/calendar/CalendarShell.tsx`

- [ ] **Step 1: Replace stub s WeekView**

```tsx
import WeekView from './WeekView';
// ...
{view === 'week' && (
  <WeekView
    anchorDate={anchorDate}
    events={events}
    selectedEventId={selectedEventId}
    onSelectEvent={onSelectEvent}
    viewerId={viewerId}
  />
)}
```

- [ ] **Step 2: Spustit dev + ověřit v prohlížeči**

```bash
npm run dev
# Otevřít /portal/crm/kalendar
```

Ověřit:
- Týdenní mřížka se zobrazí
- Sloupce s názvy dní (Po, Út, …)
- Hodinová mřížka 07:00–22:00
- Dnešní den je zvýrazněn
- Pokud máte v DB nějaké eventy → renderují se na správné pozici

- [ ] **Step 3: Commit**

```bash
git add components/portal/calendar/CalendarShell.tsx
git commit -m "feat(calendar): wire WeekView into Shell"
```

### Task 50: Current-time indicator (red line in WeekView)

**Files:**
- Modify: `components/portal/calendar/WeekView.tsx`

- [ ] **Step 1: Doplnit horizontální čáru na dnešní sloupec**

V mapě dnů, pokud `isToday(d)`, přidat:

```tsx
{isToday(d) && (
  <div
    className="absolute left-0 right-0 border-t-2 border-rust pointer-events-none z-10"
    style={{
      top: ((new Date().getHours() - startHour) * 60 + new Date().getMinutes()) / 60 * hourHeight,
    }}
  >
    <div className="w-2 h-2 bg-rust rounded-none -ml-1 -mt-1" />
  </div>
)}
```

- [ ] **Step 2: Build + reload, ověřit v prohlížeči**

Očekávat: rust horizontální čára na pozici aktuální hodiny v dnešním sloupci.

- [ ] **Step 3: Commit**

```bash
git add components/portal/calendar/WeekView.tsx
git commit -m "feat(calendar): WeekView — current time indicator (rust line)"
```

### Task 51: Auto-scroll na aktuální hodinu při loadu

**Files:**
- Modify: `components/portal/calendar/WeekView.tsx`

- [ ] **Step 1: Použít useRef + useEffect**

```tsx
import { useRef, useEffect } from 'react';
// uvnitř komponenty:
const containerRef = useRef<HTMLDivElement>(null);
useEffect(() => {
  if (!containerRef.current) return;
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes() - startHour * 60;
  containerRef.current.scrollTop = Math.max(0, (nowMin / 60) * hourHeight - 100);
}, []);

// obalit root <div> ref={containerRef} a style={{ overflow: 'auto' }} pokud potřeba
```

> **Pozn.:** Scrolling se děje v parent overflow-auto v CalendarShell, takže potřebujeme ref na parent. Alternativně: vykládat scroll do CalendarShell.

- [ ] **Step 2: Test v dev**

- [ ] **Step 3: Commit**

```bash
git add components/portal/calendar/WeekView.tsx
git commit -m "feat(calendar): auto-scroll to current hour on mount"
```

### Task 52: Manuální QA — Week view rendering

- [ ] **Step 1: Vložit testovací eventy do DB**

```sql
insert into events (owner_id, title, start_at, end_at, timezone, visibility, sync_status) values
  ((select id from profiles limit 1), 'Vlastní event', now() + interval '1 hour', now() + interval '2 hours', 'Europe/Prague', 'private', 'synced'),
  ((select id from profiles limit 1), 'Shared event', now() + interval '3 hours', now() + interval '4 hours', 'Europe/Prague', 'shared', 'synced');
```

- [ ] **Step 2: V prohlížeči ověřit**

- Vlastní event má caramel border
- Shared event má parchment-gold border + "◈ TEAM" label
- Časy v hlavičce eventu odpovídají
- Klik na event zvýrazní (ring-caramel)

- [ ] **Step 3: (žádný commit)**

---

## Phase 8 — Day / Month / Agenda views

### Task 53: DayView

**Files:**
- Create: `components/portal/calendar/DayView.tsx`

- [ ] **Step 1: Implementace (podobné WeekView ale 1 sloupec)**

```tsx
// components/portal/calendar/DayView.tsx
'use client';

import { format, isToday, startOfDay } from 'date-fns';
import { cs } from 'date-fns/locale';
import EventBlock from './EventBlock';

const HOUR_HEIGHT = 60;
const START_HOUR = 6;
const END_HOUR = 23;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

export default function DayView({
  anchorDate, events, selectedEventId, onSelectEvent, viewerId,
}: {
  anchorDate: Date;
  events: any[];
  selectedEventId: string | null;
  onSelectEvent: (id: string | null) => void;
  viewerId: string;
}) {
  const dayEvents = events.filter(e => startOfDay(new Date(e.start_at)).getTime() === startOfDay(anchorDate).getTime());
  return (
    <div className="grid h-full" style={{ gridTemplateColumns: '72px 1fr' }}>
      <div className="border-r border-tobacco" />
      <div className={`border-b border-tobacco text-center py-3 ${isToday(anchorDate) ? 'bg-caramel/8' : ''}`}>
        <div className="font-mono text-[9px] uppercase tracking-widest text-sandstone">
          {format(anchorDate, 'EEEE', { locale: cs })}
        </div>
        <div className={`font-display font-black text-3xl mt-1 ${isToday(anchorDate) ? 'text-caramel' : 'text-moonlight'}`}>
          {format(anchorDate, 'd. LLLL', { locale: cs })}
        </div>
      </div>

      <div className="border-r border-tobacco">
        {HOURS.map(h => (
          <div key={h} className="text-right pr-3 pt-1 font-mono text-[10px] text-sandstone" style={{ height: HOUR_HEIGHT }}>
            {String(h).padStart(2, '0')}:00
          </div>
        ))}
      </div>

      <div className="relative" style={{ height: HOURS.length * HOUR_HEIGHT }}>
        {HOURS.map(h => <div key={h} className="border-b border-tobacco/40" style={{ height: HOUR_HEIGHT }} />)}
        {dayEvents.map(e => (
          <EventBlock
            key={e.id}
            event={e}
            hourHeight={HOUR_HEIGHT}
            startHour={START_HOUR}
            viewerId={viewerId}
            selected={e.id === selectedEventId}
            onClick={() => onSelectEvent(e.id)}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire do Shell + commit**

```tsx
{view === 'day' && (<DayView ... />)}
```

```bash
git add components/portal/calendar/DayView.tsx components/portal/calendar/CalendarShell.tsx
git commit -m "feat(calendar): DayView (single column with hourly grid)"
```

### Task 54: MonthView

**Files:**
- Create: `components/portal/calendar/MonthView.tsx`

- [ ] **Step 1: Implementace (kalendářová mřížka 7x6)**

```tsx
// components/portal/calendar/MonthView.tsx
'use client';

import { startOfMonth, endOfMonth, startOfWeek, addDays, isSameMonth, isToday, format } from 'date-fns';
import { cs } from 'date-fns/locale';

const DAYS_OF_WEEK = ['PO', 'ÚT', 'ST', 'ČT', 'PÁ', 'SO', 'NE'];

export default function MonthView({
  anchorDate, events, onSelectEvent,
}: {
  anchorDate: Date;
  events: any[];
  selectedEventId: string | null;
  onSelectEvent: (id: string | null) => void;
  viewerId: string;
}) {
  const monthStart = startOfMonth(anchorDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  return (
    <div className="grid h-full" style={{ gridTemplateRows: 'auto repeat(6, 1fr)' }}>
      <div className="grid grid-cols-7 border-b border-tobacco">
        {DAYS_OF_WEEK.map(d => (
          <div key={d} className="text-center py-2 font-mono text-[9px] uppercase tracking-widest text-sandstone">{d}</div>
        ))}
      </div>
      {Array.from({ length: 6 }, (_, row) => (
        <div key={row} className="grid grid-cols-7 border-b border-tobacco">
          {cells.slice(row * 7, row * 7 + 7).map(d => {
            const dayEvents = events.filter(e => isSameDay(new Date(e.start_at), d));
            const inMonth = isSameMonth(d, anchorDate);
            return (
              <div
                key={d.toISOString()}
                className={`border-r border-tobacco p-1 overflow-hidden ${
                  isToday(d) ? 'bg-caramel/8' : ''
                } ${inMonth ? '' : 'opacity-40'}`}
              >
                <div className={`font-mono text-xs ${isToday(d) ? 'text-caramel font-bold' : 'text-sandstone'}`}>
                  {format(d, 'd')}
                </div>
                <div className="space-y-0.5 mt-1">
                  {dayEvents.slice(0, 3).map(e => (
                    <button
                      key={e.id}
                      onClick={() => onSelectEvent(e.id)}
                      className="block w-full text-left text-[10px] truncate border-l-2 border-caramel bg-caramel/15 px-1 py-0.5 text-parchment-gold"
                    >
                      {format(new Date(e.start_at), 'HH:mm')} {e.title}
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[9px] text-sandstone font-mono pl-1">+{dayEvents.length - 3} dalších</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
```

- [ ] **Step 2: Wire + commit**

```bash
git add components/portal/calendar/MonthView.tsx components/portal/calendar/CalendarShell.tsx
git commit -m "feat(calendar): MonthView 7x6 grid with event chips"
```

### Task 55: AgendaView

**Files:**
- Create: `components/portal/calendar/AgendaView.tsx`

- [ ] **Step 1: Implementace (lineární seznam pro 30 dnů)**

```tsx
// components/portal/calendar/AgendaView.tsx
'use client';

import { format, addDays, isToday, startOfDay } from 'date-fns';
import { cs } from 'date-fns/locale';

export default function AgendaView({
  anchorDate, events, onSelectEvent,
}: {
  anchorDate: Date;
  events: any[];
  selectedEventId: string | null;
  onSelectEvent: (id: string | null) => void;
  viewerId: string;
}) {
  const days = Array.from({ length: 30 }, (_, i) => addDays(anchorDate, i));
  const dayBuckets = days.map(d => ({
    date: d,
    events: events.filter(e => startOfDay(new Date(e.start_at)).getTime() === startOfDay(d).getTime()),
  })).filter(b => b.events.length > 0);

  if (dayBuckets.length === 0) {
    return <div className="p-12 text-center text-sepia/60">Žádné eventy v nejbližších 30 dnech.</div>;
  }

  return (
    <div className="divide-y divide-tobacco">
      {dayBuckets.map(b => (
        <div key={b.date.toISOString()} className="grid grid-cols-[120px_1fr] gap-6 p-4">
          <div className="font-mono text-xs uppercase tracking-widest">
            <div className={isToday(b.date) ? 'text-caramel font-bold' : 'text-sandstone'}>
              {format(b.date, 'EEEE', { locale: cs })}
            </div>
            <div className="text-moonlight text-2xl font-display font-black mt-1">
              {format(b.date, 'd')}
            </div>
            <div className="text-sandstone">{format(b.date, 'LLLL', { locale: cs })}</div>
          </div>
          <div className="space-y-2">
            {b.events.map(e => (
              <button
                key={e.id}
                onClick={() => onSelectEvent(e.id)}
                className="block w-full text-left border-l-4 border-caramel bg-coffee p-3 hover:bg-tobacco/30"
              >
                <div className="font-mono text-[10px] uppercase tracking-widest text-caramel">
                  {format(new Date(e.start_at), 'HH:mm')}–{format(new Date(e.end_at), 'HH:mm')}
                  {e.visibility === 'shared' && <span className="ml-2 text-parchment-gold">◈ TEAM</span>}
                </div>
                <div className="text-moonlight text-sm mt-1">{e.title}</div>
                {e.location && <div className="text-sepia/60 text-xs mt-1">{e.location}</div>}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Wire + commit**

```bash
git add components/portal/calendar/AgendaView.tsx components/portal/calendar/CalendarShell.tsx
git commit -m "feat(calendar): AgendaView linear 30-day list"
```

### Task 56: Refetch events on view/anchor change

**Files:**
- Modify: `app/portal/(app)/crm/kalendar/CalendarClient.tsx`

- [ ] **Step 1: Doplnit useEffect, který refetchuje events při změně anchorDate/view**

Vytvořit nové API route `app/api/calendar/events/route.ts`:

```ts
// app/api/calendar/events/route.ts
import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireViewer } from '@/lib/supabase/viewer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  await requireViewer();
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  if (!from || !to) return NextResponse.json({ error: 'from/to required' }, { status: 400 });

  const supabase = await createClient();
  const { data } = await supabase
    .from('events')
    .select('*, lead:landing_leads(id, name, case_number), client:profiles!events_client_id_fkey(id, full_name), project:projects(id, name)')
    .gte('start_at', from)
    .lt('start_at', to)
    .is('deleted_at', null)
    .order('start_at');

  return NextResponse.json({ events: data ?? [] });
}
```

V `CalendarClient.tsx` přidat:

```tsx
import { useEffect, useState } from 'react';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay, subWeeks, addWeeks } from 'date-fns';

// ...
const [events, setEvents] = useState(initialEvents);

useEffect(() => {
  const { from, to } = rangeForView(view, anchorDate);
  fetch(`/api/calendar/events?from=${from}&to=${to}`)
    .then(r => r.json())
    .then(d => setEvents(d.events));
}, [view, anchorDate]);

function rangeForView(view: CalendarView, anchor: Date) {
  if (view === 'day') return { from: startOfDay(anchor).toISOString(), to: endOfDay(anchor).toISOString() };
  if (view === 'week') return { from: subWeeks(anchor, 0).toISOString(), to: addWeeks(anchor, 1).toISOString() };
  if (view === 'month') return { from: startOfMonth(anchor).toISOString(), to: endOfMonth(anchor).toISOString() };
  // agenda
  return { from: anchor.toISOString(), to: addDaysISO(anchor, 30) };
}

function addDaysISO(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r.toISOString(); }
```

- [ ] **Step 2: Build + manuální test**

Změnit view / navigovat šipkami → ověřit, že eventy se znovu načítají (DevTools Network tab).

- [ ] **Step 3: Commit**

```bash
git add app/api/calendar/events/route.ts app/portal/\(app\)/crm/kalendar/CalendarClient.tsx
git commit -m "feat(calendar): refetch events on view/anchor change"
```

### Task 57: Manuální QA — všechny views

- [ ] **Step 1: Otestovat každý view (D / W / M / A)**

- [ ] **Step 2: Navigovat šipkami v každém view, ověřit refetch a render**

- [ ] **Step 3: (žádný commit — QA)**

---

## Phase 9 — Side panel + CRUD

### Task 58: EventSidePanel — view mode

**Files:**
- Create: `components/portal/calendar/EventSidePanel.tsx`

- [ ] **Step 1: Implementace (read-only view + delete + edit toggle)**

```tsx
// components/portal/calendar/EventSidePanel.tsx
'use client';

import { useState, useTransition } from 'react';
import { X, Edit2, Trash2, Video, MapPin, Users, Link2 } from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import Link from 'next/link';
import { deleteEvent } from '@/lib/actions/calendar';
import EventEditForm from './EventEditForm';

export default function EventSidePanel({
  event,
  viewerId,
  onClose,
  onUpdated,
}: {
  event: any;
  viewerId: string;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const isOwner = event.owner_id === viewerId;

  function handleDelete() {
    if (!confirm(`Smazat event "${event.title}"?`)) return;
    startTransition(async () => {
      const res = await deleteEvent(event.id);
      if (res.ok) { onClose(); onUpdated(); }
    });
  }

  if (editing) {
    return (
      <EventEditForm
        event={event}
        onCancel={() => setEditing(false)}
        onSaved={() => { setEditing(false); onUpdated(); }}
      />
    );
  }

  return (
    <aside className="fixed top-16 right-0 bottom-0 w-[420px] bg-coffee border-l border-tobacco overflow-y-auto z-30">
      <header className="flex items-start justify-between px-5 py-4 border-b border-tobacco sticky top-0 bg-coffee">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-widest text-sandstone mb-1">Detail eventu</div>
          <h3 className="font-display italic text-xl text-moonlight leading-tight">{event.title}</h3>
        </div>
        <button onClick={onClose} className="text-sandstone hover:text-moonlight"><X size={18} /></button>
      </header>

      <div className="px-5 py-4 space-y-5 text-sm">
        <section>
          <p className="font-mono text-[10px] uppercase tracking-widest text-sandstone mb-1">Čas</p>
          <p className="text-moonlight">
            {format(new Date(event.start_at), 'd. LLLL yyyy', { locale: cs })}
            <br />
            <span className="font-mono">{format(new Date(event.start_at), 'HH:mm')}–{format(new Date(event.end_at), 'HH:mm')}</span>
          </p>
        </section>

        {event.location && (
          <section>
            <p className="font-mono text-[10px] uppercase tracking-widest text-sandstone mb-1 flex items-center gap-1"><MapPin size={11} /> Místo</p>
            <p className="text-moonlight">{event.location}</p>
          </section>
        )}

        {event.meet_link && (
          <section>
            <p className="font-mono text-[10px] uppercase tracking-widest text-sandstone mb-1 flex items-center gap-1"><Video size={11} /> Google Meet</p>
            <a href={event.meet_link} target="_blank" rel="noopener noreferrer" className="text-caramel hover:text-caramel-light break-all">
              {event.meet_link}
            </a>
          </section>
        )}

        {event.description && (
          <section>
            <p className="font-mono text-[10px] uppercase tracking-widest text-sandstone mb-1">Popis</p>
            <p className="text-sepia whitespace-pre-wrap">{event.description}</p>
          </section>
        )}

        {Array.isArray(event.attendees) && event.attendees.length > 0 && (
          <section>
            <p className="font-mono text-[10px] uppercase tracking-widest text-sandstone mb-1 flex items-center gap-1"><Users size={11} /> Účastníci</p>
            <ul className="space-y-1">
              {event.attendees.map((a: any) => (
                <li key={a.email} className="text-sepia text-xs flex items-center justify-between">
                  <span>{a.email}</span>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-sandstone">{a.responseStatus ?? 'needsAction'}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {(event.lead || event.client || event.project) && (
          <section>
            <p className="font-mono text-[10px] uppercase tracking-widest text-sandstone mb-1 flex items-center gap-1"><Link2 size={11} /> CRM</p>
            {event.lead && (
              <Link href={`/portal/crm/leady/${event.lead.id}`} className="text-caramel hover:text-caramel-light text-sm">
                → LEAD {event.lead.case_number} · {event.lead.name}
              </Link>
            )}
            {event.client && (
              <Link href={`/portal/crm/klient/${event.client.id}`} className="text-caramel hover:text-caramel-light text-sm">
                → KLIENT · {event.client.full_name}
              </Link>
            )}
            {event.project && (
              <Link href={`/portal/admin/projekt/${event.project.id}`} className="text-caramel hover:text-caramel-light text-sm">
                → PROJEKT · {event.project.name}
              </Link>
            )}
          </section>
        )}

        <section>
          <p className="font-mono text-[10px] uppercase tracking-widest text-sandstone mb-1">Viditelnost</p>
          <p className="text-moonlight">
            {event.visibility === 'shared' ? '◈ Sdíleno s týmem' : '🔒 Soukromé'}
          </p>
        </section>
      </div>

      {isOwner && (
        <footer className="px-5 py-4 border-t border-tobacco sticky bottom-0 bg-coffee flex items-center justify-between">
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 bg-caramel text-espresso px-4 py-2 font-mono text-[10px] uppercase tracking-widest font-bold hover:bg-caramel-light"
          >
            <Edit2 size={12} /> Upravit
          </button>
          <button
            onClick={handleDelete}
            disabled={pending}
            className="inline-flex items-center gap-2 text-rust hover:text-rust/80 font-mono text-[10px] uppercase tracking-widest disabled:opacity-50"
          >
            <Trash2 size={12} /> {pending ? 'Mažu…' : 'Smazat'}
          </button>
        </footer>
      )}
    </aside>
  );
}
```

- [ ] **Step 2: Commit (společně s EventEditForm — Task 59)**

### Task 59: EventEditForm — create + edit

**Files:**
- Create: `components/portal/calendar/EventEditForm.tsx`

- [ ] **Step 1: Implementace formuláře (zod-validated, react-hook-form)**

```tsx
// components/portal/calendar/EventEditForm.tsx
'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus, Trash2 } from 'lucide-react';
import { createEvent, updateEvent } from '@/lib/actions/calendar';

const formSchema = z.object({
  title: z.string().min(1, 'Název je povinný').max(1024),
  description: z.string().optional(),
  location: z.string().optional(),
  start_at: z.string(),
  end_at: z.string(),
  all_day: z.boolean().default(false),
  visibility: z.enum(['private', 'shared']),
  attendees_text: z.string().optional(),
  with_meet: z.boolean().default(false),
  lead_id: z.string().optional(),
  client_id: z.string().optional(),
  project_id: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const inputClass = 'w-full bg-espresso border border-tobacco px-3 py-2 text-moonlight placeholder:text-sandstone/50 focus:border-caramel focus:outline-none';
const labelClass = 'font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-1.5';

export default function EventEditForm({
  event,
  defaultStart,
  defaultEnd,
  onCancel,
  onSaved,
}: {
  event?: any;
  defaultStart?: string;
  defaultEnd?: string;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: event ? {
      title: event.title,
      description: event.description ?? '',
      location: event.location ?? '',
      start_at: toLocalInput(event.start_at),
      end_at: toLocalInput(event.end_at),
      all_day: event.all_day,
      visibility: event.visibility,
      attendees_text: (event.attendees ?? []).map((a: any) => a.email).join(', '),
      with_meet: !!event.meet_link,
      lead_id: event.lead_id ?? '',
      client_id: event.client_id ?? '',
      project_id: event.project_id ?? '',
    } : {
      title: '',
      start_at: defaultStart ? toLocalInput(defaultStart) : toLocalInput(new Date().toISOString()),
      end_at: defaultEnd ? toLocalInput(defaultEnd) : toLocalInput(new Date(Date.now() + 30 * 60 * 1000).toISOString()),
      all_day: false,
      visibility: 'private',
      with_meet: false,
    },
  });

  const onSubmit = handleSubmit((values) => {
    setError(null);
    const attendees = (values.attendees_text ?? '').split(/[,\s]+/).filter(Boolean).map(email => ({ email }));
    startTransition(async () => {
      const input = {
        title: values.title,
        description: values.description || null,
        location: values.location || null,
        start_at: fromLocalInput(values.start_at),
        end_at: fromLocalInput(values.end_at),
        all_day: values.all_day,
        timezone: 'Europe/Prague',
        visibility: values.visibility,
        attendees,
        with_meet: values.with_meet,
        lead_id: values.lead_id || null,
        client_id: values.client_id || null,
        project_id: values.project_id || null,
      };
      const res = event
        ? await updateEvent({ id: event.id, ...input })
        : await createEvent(input);
      if (!res.ok) setError(res.error);
      else onSaved();
    });
  });

  return (
    <aside className="fixed top-16 right-0 bottom-0 w-[420px] bg-coffee border-l border-tobacco overflow-y-auto z-30">
      <header className="flex items-center justify-between px-5 py-4 border-b border-tobacco sticky top-0 bg-coffee">
        <h3 className="font-display italic text-xl text-moonlight">{event ? 'Upravit event' : 'Nová schůzka'}</h3>
        <button onClick={onCancel}><X size={18} className="text-sandstone hover:text-moonlight" /></button>
      </header>

      <form onSubmit={onSubmit} className="px-5 py-4 space-y-3">
        <div>
          <label className={labelClass}>Název *</label>
          <input {...register('title')} className={inputClass} />
          {errors.title && <p className="text-rust text-xs font-mono mt-1">{errors.title.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Od</label>
            <input type="datetime-local" {...register('start_at')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Do</label>
            <input type="datetime-local" {...register('end_at')} className={inputClass} />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-sepia">
          <input type="checkbox" {...register('all_day')} /> Celodenní
        </label>

        <div>
          <label className={labelClass}>Místo</label>
          <input {...register('location')} placeholder="např. Praha, Online…" className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Popis</label>
          <textarea {...register('description')} rows={3} className={`${inputClass} resize-none`} />
        </div>

        <div>
          <label className={labelClass}>Účastníci (emaily, čárkou)</label>
          <input {...register('attendees_text')} placeholder="klient@firma.cz, jan@xyz.cz" className={inputClass} />
        </div>

        <label className="flex items-center gap-2 text-sm text-sepia">
          <input type="checkbox" {...register('with_meet')} /> Vygenerovat Google Meet link
        </label>

        <div>
          <label className={labelClass}>Viditelnost</label>
          <select {...register('visibility')} className={inputClass}>
            <option value="private">Soukromé (jen Vy)</option>
            <option value="shared">Sdíleno s týmem</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>CRM link (volitelný)</label>
          <input {...register('lead_id')} placeholder="lead UUID" className={`${inputClass} mb-1`} />
          <input {...register('client_id')} placeholder="klient UUID" className={`${inputClass} mb-1`} />
          <input {...register('project_id')} placeholder="projekt UUID" className={inputClass} />
          <p className="text-[9px] text-sandstone mt-1">Pozn.: max jeden. Picker UI v Phase 12.</p>
        </div>

        {error && <p className="text-rust text-xs font-mono">{error}</p>}

        <div className="flex items-center gap-3 pt-3 border-t border-tobacco">
          <button type="submit" disabled={pending} className="bg-caramel text-espresso px-5 py-2 font-mono text-[10px] uppercase tracking-widest font-bold hover:bg-caramel-light disabled:opacity-50">
            {pending ? 'Ukládám…' : event ? 'Uložit' : 'Vytvořit'}
          </button>
          <button type="button" onClick={onCancel} className="text-sandstone hover:text-moonlight font-mono text-[10px] uppercase tracking-widest">
            Zrušit
          </button>
        </div>
      </form>
    </aside>
  );
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60 * 1000).toISOString().slice(0, 16);
}

function fromLocalInput(local: string): string {
  return new Date(local).toISOString();
}
```

- [ ] **Step 2: Commit společně s panelem**

```bash
git add components/portal/calendar/EventSidePanel.tsx components/portal/calendar/EventEditForm.tsx
git commit -m "feat(calendar): EventSidePanel (view) + EventEditForm (create/edit)"
```

### Task 60: Wire side panel do CalendarShell

**Files:**
- Modify: `components/portal/calendar/CalendarShell.tsx`
- Modify: `app/portal/(app)/crm/kalendar/CalendarClient.tsx`

- [ ] **Step 1: V CalendarShell přidat conditional render side-panelu**

```tsx
import EventSidePanel from './EventSidePanel';
import EventEditForm from './EventEditForm';

// Props doplnit: onRefresh: () => void
// Stav: pokud selectedEventId === 'new' → render EventEditForm

const selectedEvent = events.find(e => e.id === selectedEventId);

{selectedEventId === 'new' && (
  <EventEditForm onCancel={() => onSelectEvent(null)} onSaved={() => { onSelectEvent(null); onRefresh(); }} />
)}
{selectedEvent && (
  <EventSidePanel
    event={selectedEvent}
    viewerId={viewerId}
    onClose={() => onSelectEvent(null)}
    onUpdated={onRefresh}
  />
)}
```

- [ ] **Step 2: V CalendarClient přidat onRefresh callback**

```tsx
const [refreshKey, setRefreshKey] = useState(0);
const refresh = () => setRefreshKey(k => k + 1);

// V useEffect refetch — přidat refreshKey do deps
useEffect(() => { /* refetch */ }, [view, anchorDate, refreshKey]);

// Předat <CalendarShell ... onRefresh={refresh} />
```

- [ ] **Step 3: Commit**

```bash
git add components/portal/calendar/CalendarShell.tsx app/portal/\(app\)/crm/kalendar/CalendarClient.tsx
git commit -m "feat(calendar): wire EventSidePanel + EventEditForm into Shell"
```

### Task 61: Wire "+ Nová schůzka" tlačítko

**Files:**
- Modify: `components/portal/calendar/CalendarToolbar.tsx`
- Modify: `components/portal/calendar/CalendarShell.tsx`

- [ ] **Step 1: V Toolbar prop `onCreateNew`**

```tsx
// props
onCreateNew: () => void;

// button
<button onClick={onCreateNew} ...>+ Nová schůzka</button>
```

- [ ] **Step 2: V Shell**

```tsx
<CalendarToolbar
  ...
  onCreateNew={() => onSelectEvent('new')}
/>
```

- [ ] **Step 3: Spustit dev, ověřit, že klik na "+ Nová schůzka" otevře prázdný formulář**

- [ ] **Step 4: Commit**

```bash
git add components/portal/calendar/CalendarToolbar.tsx components/portal/calendar/CalendarShell.tsx
git commit -m "feat(calendar): +Nová schůzka button opens EventEditForm"
```

### Task 62: Manuální QA — CRUD via UI

- [ ] **Step 1: Klik "+ Nová schůzka" → vyplnit → uložit → ověřit, že event se zobrazí v gridu**

- [ ] **Step 2: Klik na event → side panel → kliknout "Upravit" → změnit title → uložit → ověřit změnu**

- [ ] **Step 3: Klik na event → "Smazat" → confirm → ověřit, že event zmizí**

- [ ] **Step 4: V Google Calendar (web) ověřit, že create/edit/delete se propagovaly**

- [ ] **Step 5: (žádný commit — QA)**

### Task 63: Refetch po refresh (server actions revalidatePath)

Žádná změna kódu — Server Action už volá `revalidatePath('/portal/(app)/crm/kalendar')`. Jen ověřit, že `onRefresh` callback v Task 60 funguje.

- [ ] **Step 1: Test, že po create/update/delete se data znovu načtou v UI**

- [ ] **Step 2: (žádný commit)**

### Task 64: Mobile — full-screen sheet místo side-panelu

**Files:**
- Modify: `components/portal/calendar/EventSidePanel.tsx`
- Modify: `components/portal/calendar/EventEditForm.tsx`

- [ ] **Step 1: Přidat responsive class na top-level `<aside>`**

V obou souborech změnit:

```tsx
<aside className="fixed top-16 right-0 bottom-0 w-[420px] bg-coffee border-l border-tobacco overflow-y-auto z-30">
```

na:

```tsx
<aside className="fixed inset-x-0 bottom-0 top-16 md:top-16 md:right-0 md:left-auto md:w-[420px] bg-coffee md:border-l border-tobacco overflow-y-auto z-30">
```

- [ ] **Step 2: Test v dev na šířce < 768px (Chrome DevTools)**

- [ ] **Step 3: Commit**

```bash
git add components/portal/calendar/EventSidePanel.tsx components/portal/calendar/EventEditForm.tsx
git commit -m "feat(calendar): mobile — full-screen sheet for side panels (<768px)"
```

---

## Phase 10 — Drag / Resize / Keyboard

### Task 65: Drag-to-create v WeekView

**Files:**
- Modify: `components/portal/calendar/WeekView.tsx`

- [ ] **Step 1: Přidat onMouseDown handler na day column, který zachytí drag a otevře EventEditForm s preseted časy**

```tsx
// Props doplnit: onDragCreate: (start: Date, end: Date) => void

// V WeekView component:
function handleColumnPointerDown(e: React.PointerEvent, day: Date) {
  e.preventDefault();
  const rect = e.currentTarget.getBoundingClientRect();
  const startY = e.clientY - rect.top;
  const startMin = Math.round(startY / hourHeight * 60 / 15) * 15;
  const startTime = new Date(day);
  startTime.setHours(startHour, 0, 0, 0);
  startTime.setMinutes(startTime.getMinutes() + startMin);

  let endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // default 30 min

  function onMove(ev: PointerEvent) {
    const y = ev.clientY - rect.top;
    const min = Math.max(15, Math.round((y - startY) / hourHeight * 60 / 15) * 15);
    endTime = new Date(startTime.getTime() + min * 60 * 1000);
    // visual preview by se dal přidat ghost div — v MVP necháme jen final create
  }
  function onUp() {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    onDragCreate(startTime, endTime);
  }
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
}

// Na day column wrapper:
<div onPointerDown={(e) => handleColumnPointerDown(e, d)} ...>
```

V CalendarShell propsovat `onDragCreate` který vede do `onSelectEvent('new')` + state s `dragCreateRange`. EventEditForm pak použije ten range jako defaultStart/End.

- [ ] **Step 2: Test v dev (přetáhnout v gridu → otevře se form s vyplněnými časy)**

- [ ] **Step 3: Commit**

```bash
git add components/portal/calendar/WeekView.tsx components/portal/calendar/CalendarShell.tsx app/portal/\(app\)/crm/kalendar/CalendarClient.tsx
git commit -m "feat(calendar): drag-to-create new event in WeekView"
```

### Task 66: Drag-to-move event

**Files:**
- Modify: `components/portal/calendar/EventBlock.tsx`

- [ ] **Step 1: Pointer handlers na EventBlock pro přesun**

```tsx
// Props: onMove: (eventId: string, newStart: Date, newEnd: Date) => void

function handlePointerDown(e: React.PointerEvent) {
  if (selected) return; // jen pokud není selected — kliknutí selectuje
  e.stopPropagation();
  const blockRect = e.currentTarget.getBoundingClientRect();
  const startClientY = e.clientY;
  const origStart = new Date(event.start_at);
  const duration = new Date(event.end_at).getTime() - origStart.getTime();
  let newStart = origStart;

  function onMove(ev: PointerEvent) {
    const dyMin = Math.round((ev.clientY - startClientY) / hourHeight * 60 / 15) * 15;
    newStart = new Date(origStart.getTime() + dyMin * 60 * 1000);
    // optional: visual preview pomocí transform
  }
  function onUp() {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    onMove(event.id, newStart, new Date(newStart.getTime() + duration));
  }
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
}
```

> **Pozn.:** Konkrétní vizuální preview (event sleduje kurzor) by zvýšil komplexnost. V MVP stačí, že po `pointerup` se zavolá `onMove` se Server Actionem a UI se refetchuje. Pro polished UX přidat transform: translateY během drag-u.

- [ ] **Step 2: V CalendarShell propsovat onMove → Server Action moveEvent → refresh**

- [ ] **Step 3: Test + commit**

```bash
git add components/portal/calendar/EventBlock.tsx components/portal/calendar/CalendarShell.tsx
git commit -m "feat(calendar): drag-to-move event (snap to 15min)"
```

### Task 67: Resize handles (top/bottom edges)

**Files:**
- Modify: `components/portal/calendar/EventBlock.tsx`

- [ ] **Step 1: Přidat 2 absolutně-pozicované handles**

Uvnitř EventBlock:

```tsx
<div
  className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-caramel/40"
  onPointerDown={(e) => startResize(e, 'top')}
/>
<div
  className="absolute bottom-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-caramel/40"
  onPointerDown={(e) => startResize(e, 'bottom')}
/>
```

`startResize` handler podobný `handlePointerDown` pro move, ale upraví buď `start_at` (top) nebo `end_at` (bottom). Min duration 15 min.

- [ ] **Step 2: Test + commit**

```bash
git add components/portal/calendar/EventBlock.tsx
git commit -m "feat(calendar): resize handles on event blocks (15min snap)"
```

### Task 68: Klávesnice — global shortcuts

**Files:**
- Modify: `app/portal/(app)/crm/kalendar/CalendarClient.tsx`

- [ ] **Step 1: useEffect s keydown listenerem**

```tsx
useEffect(() => {
  function onKey(e: KeyboardEvent) {
    if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowLeft') prevPeriod();
    else if (e.key === 'ArrowRight') nextPeriod();
    else if (e.key === 't' || e.key === 'T') goToday();
    else if (e.key === 'd' || e.key === 'D') setView('day');
    else if (e.key === 'w' || e.key === 'W') setView('week');
    else if (e.key === 'm' || e.key === 'M') setView('month');
    else if (e.key === 'a' || e.key === 'A') setView('agenda');
    else if (e.key === 'n' || e.key === 'N') setSelectedEventId('new');
    else if (e.key === 'Escape') setSelectedEventId(null);
  }
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}, [view, anchorDate]);

// Plus helper funkce prevPeriod, nextPeriod, goToday (re-použít logiku z Toolbar)
```

- [ ] **Step 2: Test v dev**

- [ ] **Step 3: Commit**

```bash
git add app/portal/\(app\)/crm/kalendar/CalendarClient.tsx
git commit -m "feat(calendar): keyboard shortcuts (←/→/T/D/W/M/A/N/Esc)"
```

### Task 69: Optimistic UI pro drag/resize

**Files:**
- Modify: `app/portal/(app)/crm/kalendar/CalendarClient.tsx`

- [ ] **Step 1: Místo refetch po move/resize — okamžitě updatovat lokální state**

```tsx
function handleMoveEvent(eventId: string, newStart: Date, newEnd: Date) {
  // 1. Optimistic update
  setEvents(prev => prev.map(e => e.id === eventId
    ? { ...e, start_at: newStart.toISOString(), end_at: newEnd.toISOString() }
    : e));
  // 2. Server action
  startTransition(async () => {
    const res = await moveEvent({ id: eventId, start_at: newStart.toISOString(), end_at: newEnd.toISOString() });
    if (!res.ok) {
      // Rollback — refetch ground truth
      refetch();
      alert('Přesun se nepodařil: ' + res.error);
    }
  });
}
```

- [ ] **Step 2: Test, commit**

```bash
git add app/portal/\(app\)/crm/kalendar/CalendarClient.tsx
git commit -m "feat(calendar): optimistic UI for drag/resize with rollback on error"
```

### Task 70: Manuální QA — interactions

- [ ] **Step 1: Drag-to-create — přetáhnout v gridu, ověřit, že form se otevře s časy**
- [ ] **Step 2: Drag-to-move — přetáhnout existující event, ověřit přesun**
- [ ] **Step 3: Resize — přetáhnout horní/dolní hranu, ověřit změnu trvání**
- [ ] **Step 4: Klávesnice — ←/→/T/D/W/M/A/N/Esc**
- [ ] **Step 5: V Google Calendar ověřit, že drag-move/resize se propagovaly**
- [ ] **Step 6: (žádný commit)**

---

## Phase 11 — Sharing (visibility=shared)

### Task 71: buildSharedAttendees helper

**Files:**
- Modify: `lib/services/calendar-sync.ts`

- [ ] **Step 1: Doplnit funkci**

```ts
export async function buildSharedAttendees(
  ownerId: string,
  manualAttendees: { email: string }[],
): Promise<{ email: string }[]> {
  const admin = createAdminClient();
  const { data: team } = await admin
    .from('profiles')
    .select('email')
    .in('role', ['obchodnik', 'admin'])
    .eq('is_active', true)
    .neq('id', ownerId);

  const teamEmails = (team ?? []).map(t => ({ email: t.email }));
  // Dedup
  const seen = new Set<string>();
  const result: { email: string }[] = [];
  for (const a of [...teamEmails, ...manualAttendees]) {
    if (!seen.has(a.email.toLowerCase())) {
      seen.add(a.email.toLowerCase());
      result.push(a);
    }
  }
  return result;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/services/calendar-sync.ts
git commit -m "feat(sync): buildSharedAttendees — team email expansion"
```

### Task 72: Wire expansion do pushEventInsert / pushEventUpdate

**Files:**
- Modify: `lib/services/calendar-sync.ts`

- [ ] **Step 1: V pushEventInsert před `toGooglePayload`**

```ts
// Pokud visibility='shared', rozšiř attendees o team
if (event.visibility === 'shared') {
  const expanded = await buildSharedAttendees(event.owner_id, (event.attendees as { email: string }[]) ?? []);
  event = { ...event, attendees: expanded };
}
```

Totéž v `pushEventUpdate`.

- [ ] **Step 2: Test — vytvořit shared event, ověřit, že v Google má attendees**

- [ ] **Step 3: Commit**

```bash
git add lib/services/calendar-sync.ts
git commit -m "feat(sync): expand shared event attendees with team emails"
```

### Task 73: RLS verification — shared event visibility

> Test, že RLS policy v migraci 0006 funguje.

- [ ] **Step 1: Jako user A (obchodnik) vytvořit shared event**

- [ ] **Step 2: Přihlásit se jako user B (obchodnik) — otevřít `/portal/crm/kalendar` — ověřit, že event vidí**

- [ ] **Step 3: Jako user B zkusit edit (přes UI by mělo být skryto — tlačítko "Upravit" jen pro ownera)**

- [ ] **Step 4: Jako user C (role=klient) — event NESMÍ vidět**

- [ ] **Step 5: (žádný commit — QA)**

### Task 74: UI badge pro shared events ve formu

**Files:**
- Modify: `components/portal/calendar/EventEditForm.tsx`

- [ ] **Step 1: Přidat info text pod visibility select**

```tsx
{watch('visibility') === 'shared' && (
  <p className="text-xs text-parchment-gold/80 -mt-2">
    ◈ Event bude přidán jako Google attendee všem aktivním obchodníkům a adminům. E-mailová pozvánka NEBUDE poslána (sendUpdates: 'none').
  </p>
)}
```

- [ ] **Step 2: Test + commit**

```bash
git add components/portal/calendar/EventEditForm.tsx
git commit -m "feat(calendar): inline help text for shared visibility"
```

---

## Phase 12 — Polish

### Task 75: Sidebar link "Kalendář"

**Files:**
- Modify: `components/portal/Sidebar.tsx`

- [ ] **Step 1: Najít stávající CRM navigaci a přidat link**

```tsx
import { Calendar } from 'lucide-react';

// v sekci CRM, mezi existujícími linky:
<NavLink href="/portal/crm/kalendar" icon={<Calendar size={14} />}>Kalendář</NavLink>
```

> Pokud Sidebar nemá `NavLink` komponentu, použít stávající pattern (např. `<Link>` s active class).

- [ ] **Step 2: Build + ověřit v UI**

- [ ] **Step 3: Commit**

```bash
git add components/portal/Sidebar.tsx
git commit -m "feat(portal): Sidebar link Kalendář"
```

### Task 76: Mobile default — agenda view

**Files:**
- Modify: `app/portal/(app)/crm/kalendar/CalendarClient.tsx`

- [ ] **Step 1: Detekovat mobilní šířku v useEffect a default agenda**

```tsx
useEffect(() => {
  if (window.innerWidth < 768) setView('agenda');
}, []);
```

- [ ] **Step 2: Commit**

```bash
git add app/portal/\(app\)/crm/kalendar/CalendarClient.tsx
git commit -m "feat(calendar): mobile default → Agenda view (<768px)"
```

### Task 77: Conflict UI — 412 → diff banner

**Files:**
- Modify: `lib/services/calendar-sync.ts` (pushEventUpdate)
- Modify: `lib/actions/calendar.ts` (updateEvent)
- Modify: `components/portal/calendar/EventSidePanel.tsx`

- [ ] **Step 1: V pushEventUpdate detekovat 412 a setnout sync_error='CONFLICT:{google_etag}'**

```ts
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes('412') || msg.toLowerCase().includes('precondition failed')) {
    // Fetch Google verze pro porovnání
    try {
      const { calendar, calendarId } = await googleCalendarFor(event.owner_id);
      const fresh = await calendar.events.get({ calendarId, eventId: event.google_event_id! });
      const incoming = fromGooglePayload(fresh.data, event.owner_id);
      await admin.from('events').update({
        sync_status: 'error',
        sync_error: `CONFLICT:${JSON.stringify({ google_title: incoming.title, google_start: incoming.start_at })}`,
      }).eq('id', event.id);
    } catch {
      // fallback
    }
    return false;
  }
  // ... existing error handling
}
```

- [ ] **Step 2: V EventSidePanel pokud sync_error začíná `CONFLICT:`, zobrazit banner**

```tsx
{event.sync_status === 'error' && event.sync_error?.startsWith('CONFLICT:') && (
  <div className="bg-rust/15 border-l-4 border-rust p-3 my-3">
    <p className="font-mono text-[10px] uppercase tracking-widest text-rust mb-2">Konflikt s Google</p>
    <p className="text-xs text-sepia">Tento event byl změněn jinde. Zobrazujete ARBIQ verzi. Pro převzetí Google verze klikněte "Synchronizovat teď" v nastavení.</p>
  </div>
)}
```

- [ ] **Step 3: Test (těžko reprodukovatelné lokálně bez race), commit**

```bash
git add lib/services/calendar-sync.ts components/portal/calendar/EventSidePanel.tsx
git commit -m "feat(calendar): 412 conflict detection + UI banner"
```

### Task 78: README update — feature shipping notes

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Doplnit sekci "Kalendář — co je v MVP"**

```md
## Google Calendar (v1)

Implementováno (per spec `docs/superpowers/specs/2026-05-12-google-calendar-crm-design.md`):

- Per-user OAuth s Google Calendar
- Obousměrný sync primárního kalendáře (webhooky + 5min poll)
- Views: Den, Týden (default), Měsíc, Agenda (mobile default)
- CRUD eventů přes UI: vytvořit/upravit/smazat
- Drag-to-create, drag-to-move, resize hran
- Google Meet auto-generation (toggle)
- Attendees (free email list)
- Sdílení s týmem (visibility=shared → Google attendees s sendUpdates='none')
- CRM linky: lead / klient / projekt (max 1 na event)
- Klávesnice: ←/→/T/D/W/M/A/N/Esc
- Conflict detection (412) + banner

**Není v v1 (plánováno):**
- Recurring events (RRULE)
- Custom per-event reminders
- Multi-calendar (jen primární)
- CRM link picker UI (zatím raw UUID inputy)
- iCal export
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs(readme): document Google Calendar v1 feature scope"
```

### Task 79: CRM link picker (Phase 12 nice-to-have)

**Files:**
- Modify: `components/portal/calendar/EventEditForm.tsx`

- [ ] **Step 1: Načíst leady/klienty/projekty server-side při otevření formuláře**

> Tuto úlohu lze odložit do v2 pokud time-pressed. Plán ji uvádí pro polished UX:

Místo 3 raw UUID inputů — 1 select s grouped options (leady | klienti | projekty) přes async fetch z `/api/calendar/crm-search?q=...`. Implementace je další ~50 řádků formu logic. Pokud skip → zůstávají UUID inputy.

- [ ] **Step 2: Commit (pokud implementováno)**

```bash
git add components/portal/calendar/EventEditForm.tsx app/api/calendar/crm-search/route.ts
git commit -m "feat(calendar): CRM link picker — searchable select for lead/klient/projekt"
```

### Task 80: Final E2E QA pass

> Závěrečné ověření, že vše drží pohromadě.

- [ ] **Step 1: Disconnect + reconnect Google** — connection se resetne, initial sync proběhne, eventy se objeví

- [ ] **Step 2: Create event v ARBIQ s Meet + 2 attendees + visibility=shared + lead link** — ověřit v Google, že event má Meet, attendees + team obchodníky

- [ ] **Step 3: Modify event v Google (web UI)** — počkat 5 min nebo trigger webhook — ověřit v ARBIQ změnu

- [ ] **Step 4: Drag-to-move event v ARBIQ na jiný čas** — ověřit změnu v Google

- [ ] **Step 5: Smazat event v Google** — ověřit soft-delete v ARBIQ (event zmizí z UI)

- [ ] **Step 6: Druhý obchodník přihlášený do ARBIQ** — vidí shared event, nevidí private

- [ ] **Step 7: Klávesnice end-to-end:** N → vytvořit event → Esc → ←/→ navigovat → T → D/W/M/A

- [ ] **Step 8: Mobilní šířka (Chrome DevTools)** — agenda view default, full-screen panel funguje

- [ ] **Step 9: Sync status bar** — ukazuje OK + last sync čas

- [ ] **Step 10: (žádný commit — final QA)**

---

## Self-review

**Spec coverage check** — každá sekce ze speci `2026-05-12-google-calendar-crm-design.md`:

| Spec sekce | Task pokrytí |
|---|---|
| 1. Cíl | Phase 6–12 (UI + sync end-to-end) |
| 2. Klíčová rozhodnutí Q1–Q5 | Q1 (hybrid) v Task 33, 71–73; Q2 (jen events) v Task 4; Q3 (primary) v Task 19, 35; Q4 (meeting-ready) v Task 14, 28, 59; Q5 (Google attendees) v Task 71–72 |
| 3. MVP cut | Phase 1–11 (vše v1), Phase 12 Task 79 explicit jako nice-to-have |
| 4. Architektura | Task 25 (skeleton), 26–27 (outbound), 33–36 (inbound) |
| 5. Datový model | Task 4 (migrace), Task 6 (types), Task 13 (TS types) |
| 6. OAuth flow | Task 18 (start), 19 (callback), 20 (disconnect), 21–22 (settings UI), 23 (Google Console docs) |
| 7. Sync engine 7.1 outbound | Task 26, 27 |
| 7.2 inbound webhook | Task 33, 37 |
| 7.3 initial sync | Task 35 |
| 7.4 watch | Task 36 |
| 7.5 safety poll | Task 38 |
| 8. UI | Phase 6–10 |
| 9. Sharing | Phase 11 (Task 71–74) |
| 10. Error handling | Task 32 (retry), 33 (conflict v upsert), 34 (410 sync token reset), 77 (412 conflict UI) |
| 11. Závislosti | Task 1, 10, 40 (vercel.json), 7 (env vars) |
| 12. Testing | Phase 0 setup, Task 8/11/12/14/15 unit tests; QA tasks 24/31/41/52/57/62/70/73/80 |
| 13. Mimo scope | Plán je vědomě nepokrývá (žádné tasky pro recurring atd.) |
| 14. Otevřené body | Encryption key rotation — Task 9b dokumentuje, plán nepokrývá rotation strategy (mimo v1); HTTPS dev — Task 23 ngrok instrukce; Service role boundary — implicit přes `'server-only'` import ve všech lib/google a lib/services souborech; Soft-delete cleanup — neimplementováno (low priority per spec) |

**Placeholder scan:** Task 79 explicitně označen jako "v2 / nice-to-have" — to není placeholder, je to vědomé rozhodnutí o scope. Žádné TBD/TODO/XXX/FIXME.

**Type consistency:** `EventRow`, `EventInsert`, `GoogleEvent`, `CalendarConnectionStatus`, `CreateEventInput`, `UpdateEventInput` definované v Task 13/28/29, použité konzistentně dál.

**Funkce naming:** `pushEventInsert/Update/Delete`, `pullChanges`, `initialSync`, `upsertFromGoogle`, `startWatch/renewWatch`, `buildSharedAttendees`, `signChannelToken/verifyChannelToken`, `signStateToken/parseStateToken`, `toGooglePayload/fromGooglePayload`, `encryptToken/decryptToken` — konzistentní napříč všemi tasky.

**Známé gaps / risk areas:**

- **CSRF state secret** — v Task 11 jsem reused `GOOGLE_OAUTH_STATE_SECRET || GOOGLE_OAUTH_CLIENT_SECRET`. Ideálně by měl být samostatný env var; pro v1 OK.
- **`set_config` přes RPC** — Task 9 vs 9b je fork. Engineer musí ověřit (Step 2 v Task 9) a pak rozhodnout. Plán pokrývá oba paths.
- **Drag-to-move bez visual ghost** — Task 66 zmiňuje, že polished preview je optional. Pokud na to chcete cílit, doplnit v Task 66 transform-based ghost.
- **`buildSharedAttendees` při inbound sync** — pokud A v Google přidá shared event s ručně přidaným team emailem, inbound upsertFromGoogle uloží event s `visibility='shared'` (via extendedProperties) — pak druhý user vidí. OK.
- **Retry max 3** — `crm_tasks` neimplementoval explicitní retry_count column. V Task 32 retry cron filtruje jen podle `updated_at` cutoff. Pokud chcete striktní 3-strikes, doplnit migraci o `retry_count int default 0` + inkrement v push fns.

---

## Execution handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-12-google-calendar-crm.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — dispatchnu fresh subagent per task, review mezi tasky, rychlá iterace. Vhodné pro velký plán jako tento.

**2. Inline Execution** — provádím tasky v této session přes executing-plans, batch s checkpointy.

**Která varianta?**




