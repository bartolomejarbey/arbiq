<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# ARBIQ — Project rules

## Stack

- **Next.js 16** App Router, **React 19**, **TypeScript 5**, **Tailwind CSS 4**.
- **Supabase** (Postgres + Auth + Storage) via `@supabase/ssr`. Migrations live in `supabase/migrations/`.
- **Resend** for transactional email. Templates in `lib/email/templates/`.
- **Recharts** for portal analytics.
- **Radix Primitives** (`@radix-ui/react-{dialog,dropdown-menu,tabs,toast}`) for accessible UI primitives. **No shadcn/ui** — we wrap Radix manually in `components/ui/*` to keep the sepia look.
- **@hello-pangea/dnd** for the CRM kanban (use this, not `react-beautiful-dnd` — it is deprecated).
- Forms: **react-hook-form + zod** (already used on the public web; keep the pattern).
- Animations: **framer-motion** (already used).

## Design system (single source of truth: `app/globals.css`)

Palette is **sepia / detective noir**, not noir/amber. Use the existing tokens:

- Backgrounds: `espresso` `#18120e`, `coffee` `#241B14`, `tobacco` `#3A2D22`
- Accents: `caramel` `#C9986A`, `caramel-light` `#DDB088`, `parchment-gold` `#F0D4A8`
- Text: `moonlight` `#D8DDE5` (headlines), `sepia` `#C4B59A` (body), `sandstone` `#8B7B65` (muted)
- Paper / parchment surfaces: `parchment` `#EDE2CC`
- Semantic: `olive` `#7A8E5C` (success), `rust` `#B85A3E` (danger / urgent)

Fonts (next/font/google in `app/layout.tsx`):

- `--font-display` = Playfair Display (italic, dramatic — public web only)
- `--font-body` = Inter (use everywhere in `/portal/*`)
- `--font-mono` = IBM Plex Mono (labels, case numbers)
- `--font-serif-alt` = Newsreader

Rules:

- **No border-radius.** Sharp 0px corners everywhere.
- **No standard drop shadows.** Use tonal layering (espresso → coffee → tobacco) for elevation.
- **Public web is theatrical** (rotations, MarkerUnderline, WaxSeal, DossierCard). **Portal is calm** — same palette, but no rotations on tables/cards, less Playfair.

## Next.js 16 specifics that matter here

- **`middleware.ts` is deprecated. Use `proxy.ts`** at the project root. Export a function named `proxy` (not `middleware`). Same `matcher` config object.
- **`cookies()` is async.** Always `await cookies()` in Server Components, Server Actions, and Route Handlers.
- **`params` and `searchParams` in pages are async** — await them or pass through React's `use()` in Client Components.
- Read the bundled docs in `node_modules/next/dist/docs/01-app/` before reaching for memory.

## Folder conventions

- `app/(public routes)` — already built (homepage, /pripad, /rentgen, /sluzby, /pripady, /tym, /manifest, /specializace, /aplikace, /kontakt). Public layout is `app/layout.tsx`.
- `app/portal/*` — gated behind Supabase Auth. Has its own layout with sidebar (no public Header/Footer).
- `app/api/*` — public form submissions (pripad, rentgen, kontakt) and portal API routes.
- `components/layout/` — public Header/Footer.
- `components/sections/` — public homepage sections.
- `components/shared/` — public shared (DossierCard, WaxSeal, MarkerUnderline, RevealOnScroll, CountUp, DetectiveTag, ModeText, StaggerGrid).
- `components/ui/` — neutral primitives (Button, Input, Dialog wrappers, Table…). Used by both public and portal.
- `components/portal/` — portal-only (Sidebar, Timeline, KanbanBoard, LeadTable…).
- `lib/supabase/` — client/server/admin/middleware Supabase helpers.
- `lib/email/` — Resend wrapper + JSX templates.
- `lib/context/` — React context providers (AuthContext, plus existing IntroContext, ModeContext).

## Security non-negotiables

- **Service role key (`SUPABASE_SERVICE_ROLE_KEY`) is server-only.** Never import `lib/supabase/admin.ts` from a client component.
- **RLS is enabled on every table.** Even with service role available, prefer RLS-respecting clients in normal flows.
- **Validate every API input with Zod** even when RLS would catch it.
- **Storage URLs are signed** (TTL ≤ 1h), generated server-side. No public buckets for client documents.
- **GDPR**: marketing emails require an explicit opt-in checkbox; transactional (lead confirmation, invoice) do not.

## Czech text

The user is Czech and most user-facing strings are in Czech with diacritics (á, č, ď, é, ě, í, ň, ó, ř, š, ť, ú, ů, ý, ž). When writing files containing Czech, use a `cat <<'EOF'` heredoc through Bash, not the Write tool, which escapes diacritics.

## What is already done (do not rebuild)

- Public homepage and all section components.
- 9-campaign landing page system with 5-step questionnaire (`app/pripad/[kampan]`, `lib/kampan-data.ts`).
- /rentgen, /kontakt, /sluzby/*, /pripady, /tym, /manifest, /specializace, /aplikace.
- Sepia design tokens, fonts, grain overlay, marker underline.
- Mode context (mladsi/zkusenejsi toggle), Intro context.

## What stub APIs do today (and need wiring)

- `app/api/pripad/route.ts`, `app/api/rentgen/route.ts`, `app/api/kontakt/route.ts` all exist and validate input but only `console.log`. They must be wired to Supabase + Resend per Phase 1 of the plan.
- `app/kontakt/page.tsx` form handler is `console.log` only — does not even call `fetch('/api/kontakt')` yet. Fix when wiring kontakt.
