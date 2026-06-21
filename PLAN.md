# KY Asmita Din — Build Plan & Schema

Event companion **Telegram Mini App** for Bal-Balika KY Asmita Din 2026 (2026-06-21, ~65
delegates). Mobile-first, fast, reliable. Brand foundation = `content.md` (Outfit, deep-red
`#c5272b` / gold `#ffb600` / paper `#faf7f2` / ink `#211d1a`, nishan-bar motif, rise/pop/
shake/confetti). **No emoji anywhere.**

## Stack

- **Next.js (App Router)** + **TypeScript** + **Tailwind v4** (`@tailwindcss/postcss`),
  Outfit via `next/font/google`. Deploy: Vercel Hobby.
- **Supabase (Postgres)**, accessed **server-side only** via the service-role key (no RLS
  reliance; the client never talks to Supabase directly). All reads/writes go through Next.js
  route handlers / server actions that first authenticate the session.
- Session: HMAC-signed httpOnly cookie (`SESSION_SECRET`), payload `{delegateId, misId}`.
- Telegram: `initData` validated server-side against `TELEGRAM_BOT_TOKEN`; one webhook route
  `/api/telegram/webhook` (launcher only). No cron, no push, no scheduled jobs.

## Env (names fixed; `.env.local` provided, gitignored; `.env.example` committed)

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
(server only), `TELEGRAM_BOT_TOKEN` (server only), `SESSION_SECRET` (server only).

## Data model (Postgres)

**delegates**
- `id uuid pk default gen_random_uuid()`
- `mis_id text unique not null`
- `first_name`, `middle_name`, `last_name text`
- `wing text` — `eSide` (kishores/yuvaks, blue `#067BC2`) | `iSide` (kishoris/yuvatis, red `#D56062`)
- `mandal text` — Bal/Kishore/Yuvak/Balika/Kishori/Yuvati/Premvati
- `subgroup text`, `center text`
- `goshthi_group text` — raw roster value (e.g. "Ghanshyãm")
- `track text` — `A` | `B`, derived from goshthi_group (stored for reliability)
- `tshirt_size text`
- `is_admin boolean default false`
- `is_active boolean default true` — removal = deactivate (login blocked, ledger preserved)
- `telegram_id bigint unique` (nullable; last-login-wins binding)
- `created_at timestamptz default now()`

**questions**
- `id uuid pk`, `prompt text`, `accepted_answers text[]`, `status text` (`draft|open|closed`),
  `sort_order int`, `created_by uuid`, `created_at`, `opened_at`, `closed_at timestamptz`

**submissions** (immutable record of attempts)
- `id uuid pk`, `question_id uuid fk`, `delegate_id uuid fk`, `attempt_no int` (1|2),
  `raw_answer text`, `normalized_answer text`, `is_correct boolean`, `created_at`
- `unique(question_id, delegate_id, attempt_no)`

**points_ledger** (append-only — DB trigger blocks UPDATE/DELETE)
- `id uuid pk`, `delegate_id uuid fk`, `delta int not null`,
  `source text` (`question_correct|manual_adjustment|correction`),
  `reference_question_id uuid` (nullable), `note text` (nullable),
  `actor text` (admin delegate id, or `system`), `created_at timestamptz default now()`
- Score = `sum(delta)`. Every point traceable; corrections reversible by appending.

**schedule_blocks** (seeded from `ky_schedule.json`; admin-editable = source of truth)
- `id int pk` (block id), `name`, `category`, `scope text`, `location`, `details`,
  `start_time time`, `end_time time`, `flow_map_key text` (nullable)
- Admin edits `start_time`/`end_time`; these cascade to schedule display + menu reveals.

**menu_sections** (seeded from `menu.json`)
- `id text pk`, `label text`, `items text[]`, `reveal_anchor_block int`,
  `manual_state text` (`null|reveal|hide`) — manual override beats time-based reveal.
- Effective reveal time = `schedule_blocks[reveal_anchor_block].start_time` (cascades).

**app_meta** (optional small kv): event date, etc.

## Fixed logic (exact — no reinterpretation)

**Track mapping** (goshthi group → track, diacritics stripped + lowercased):
- Track A: Ghanshyam, Nilkanth, Chidakash, Brahma → rooms **214,212,214,212,212** (R1–5)
- Track B: Sahajanand, Parabrahma, Gunatit, Pragat → rooms **212,214,212,214,214**
- All 8 roster groups map cleanly. Round 5 = no movement (stays in R4 room), no flow map.

**Answer normalization** (before compare): trim, collapse internal whitespace, lowercase,
strip punctuation. Compare against each accepted answer normalized the same way.

**Scoring:** question is open → 2 attempts max. First correct attempt (1 or 2) appends one
`question_correct` ledger row of **+1** (idempotent: never award twice per question/delegate).
No hints.

**Streak (per question, not per attempt):** Sequence = questions the delegate has *engaged*
(≥1 submission), ordered by `questions.opened_at`. Per-question outcome:
- **correct** if any submission `is_correct` OR a `correction` ledger row exists for it.
- **wrong** if (both attempts used, none correct, no correction) OR (question closed with
  ≥1 submission, none correct, no correction).
- otherwise pending (not yet counted).
Current streak = trailing run of `correct`; longest = max run. Second-attempt-correct keeps
the streak (question still ended correct). A wrong question breaks it. Computed in one shared
module from submissions+ledger (single source of truth) for both delegate stats and admin
standings.

**Flow-map binding** (by `ky_schedule.json` `flow_maps`, not filename):
- R1 dest 214 (Track A) → `talks_round_1_214` (from `Asmita Talks - Round 1.svg`)
- R1 dest 212 (Track B) → `talks_round_1_212` (from `Asmita Talks - Round 1.5.svg`)
- R2–R4 → `talks_round_2_4` (`Asmita Talks - Round 2 - 4.svg`)
- Program 2 → Lunch travel → `program2_to_lunch` (`Program 1 Exit Flow.svg`)
- Show only delegate's **wing** color layer + its legend; animate route draw-on; recompress
  embedded raster to WebP. Round 5 → no map.

**Identity:** login by MIS ID (must exist + be active). initData valid + telegram_id bound →
auto-login. First login binds telegram_id (last-login-wins). Switch user rebinds. Admin =
runtime `is_admin`; seed **586086 (Vandan Amin)** as only initial admin; admins toggle
delegate/admin views.

## Build order (CLAUDE.md sequence; commit at each milestone)

1. Scaffold + tokens + Supabase server client + session + migration/seed.
2. Identity/login (+ initData + switch user + seeded admin).
3. Admin core: questions open/close, ledger, manual points, corrections.
4. Trivia play + scoring + streaks + personal stats.
5. Personalized schedule (admin-adjustable) + profile.
6. Food menu reveals.
7. Flow maps (wing-filtered, animated, raster recompressed).
8. Admin standings, delegate mgmt, schedule/menu control, bot webhook, polish.
9. Apply migration to live Supabase, seed, exercise core flows, report verification.

## Human-in-the-loop note (DB access)

The provided keys (`NEXT_PUBLIC_SUPABASE_URL`, anon, **service-role**, bot token, session
secret) allow app data access via PostgREST but **not DDL**. Applying the schema needs one of:
a Postgres connection string (DB password), a Supabase access token + project ref (Management
API), or the owner pasting the migration into the Supabase SQL editor. Migration + seed are
written and ready; will pause to request the chosen method, then apply + seed + verify.
