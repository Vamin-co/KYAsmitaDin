# KY Asmita Din — Event Companion App

A **Telegram Mini App** that serves as the event companion for **Bal-Balika KY Asmita Din
2026**, a one-day youth event on **June 21, 2026** for ~65 delegates. Delegates open the
app inside Telegram on their phones to see their personalized schedule, find their way
between rooms, view the food menu, and play optional trivia. An admin runs the trivia and
monitors engagement.

**The event is imminent and runs live in front of delegates.** Reliability, correct data,
and a fast phone experience outrank feature count and visual spectacle. Build for "it must
just work on a mid-range phone inside Telegram," not for demos.

---

## Read this first — two postures

The product rules below are **fixed**; do not reinterpret identity, scoring, streaks, or
the talks routing. Where this document is silent on an implementation detail, make a good
engineering decision.

- **Be ambitious** on visual design and feel, using the design foundation and the
  ui-ux-pro-max skill — *within the performance constraint.*
- **Be exact** on the data model, identity/auth, scoring, streaks, and schedule logic.

**Hard rules, no exceptions:**
- **No emoji anywhere** — not in the UI, not in copy, not in bot messages, not in code
  comments shown to users. This is absolute.
- **No generic AI-template look** — no default purple/indigo gradients, no center-everything
  hero layouts, no stock card-grid filler. Design with intent (see Design).
- **Mobile-first and fast.** Most users are on phones inside Telegram's webview. Fast first
  load and smooth interaction are requirements, not goals.
- **Build from scratch.** Do not scaffold from or copy another app's code.

---

## What this is built on (already in the repo root)

- `content.md` — the **design foundation** (tokens, palette, type, motifs). See Design.
- `ky_schedule.json` — the **schedule** (source of truth for blocks, times, Asmita Talks
  rooms/tracks, and flow-map bindings).
- `menu.json` — the **food menu** with reveal times.
- The **roster CSV** (`[SEA] KY Asmita Din ... Registration.csv`) — 65 delegates. The key
  column is **MIS ID**.
- `AsmitaDin_Logo_Color*.png` and `AsmitaDin_Logo_Black*.png` — logos (use whichever reads
  better on a given background; reference the actual filenames present).
- Flow-map SVGs: `Asmita Talks - Round 1.svg`, `Asmita Talks - Round 1.5.svg`,
  `Asmita Talks - Round 2 - 4.svg`, and `Program 1 Exit Flow.svg`. (Round 5 has no map.)
- `.claude/skills/ui-ux-pro-max/` — the design skill (use it; see Design).

---

## Tech & architecture

- **Next.js (App Router)** deployed on **Vercel (Hobby)**.
- **Supabase (Postgres)** for all data: roster, Telegram bindings, questions, submissions,
  the points ledger, streaks, schedule overrides, and menu state.
- **Telegram Mini App** rendered in Telegram's webview, plus a **minimal bot** that exists
  only as a launcher.
- **No cron, no scheduled jobs, no push notifications.** Notifications are explicitly OUT
  of scope — they are handled by a human-run Telegram announcements channel. Do not build
  any notification or scheduler system.

### Telegram specifics
- The Mini App receives a signed `initData` blob from Telegram identifying the user. **Validate
  it server-side against the bot token** on every authenticated request; never trust client-sent
  identity.
- The bot needs a single **webhook route** (e.g. `/api/telegram/webhook`) that handles
  `/start` (and `/help`): reply with a short welcome message and a button that launches the
  Mini App. After deploy, the owner runs a one-time `setWebhook` call — provide a tiny script
  for this.
- **The app must run in two contexts:** inside Telegram (uses `initData`) and in a plain
  browser (falls back to manual MIS ID entry) so the owner can dev/test without Telegram.
  Detect the context; don't hard-fail outside Telegram.
- Respect Telegram's webview: it can open as a partial-height sheet — handle the expand
  gesture and viewport height, and use the WebApp SDK for theme/back-button where sensible.

---

## Identity & login (fixed)

- Login is by **MIS ID**. The roster is **preloaded from the CSV** — only a recognized MIS
  ID can log in. All **65 delegates log in**, including the 9 tagged Bal/Balika/Premvati
  (karyakars) — they are delegates too.
- **Auto-login via Telegram binding:** on open, validate `initData`; if that Telegram ID is
  already bound to a MIS ID, log the delegate in automatically. On first login, the delegate
  enters their MIS ID once and it binds to their Telegram ID.
- **Binding is last-login-wins:** logging in from a device updates the binding to that
  Telegram ID. A **"switch user"** action lets someone log in as a different MIS ID (e.g. on
  a borrowed phone); the app remembers the latest. One binding per account is enough.
- No passwords, no email. MIS ID + Telegram identity is the whole auth model.
- **Admin is a runtime flag** (`is_admin`) on a delegate, not hardcoded. Seed **MIS ID
  586086 (Vandan Amin)** as the only initial admin. Admins get a **toggle to switch between
  the delegate view and the admin view**, so they can also participate. Admins can promote or
  demote any delegate at runtime.

---

## Delegate features

**Profile** — show the delegate's Name, MIS ID, Group, Center, and Mandal. Include
**logout / switch user**.

**Personalized schedule** — render the day from `ky_schedule.json`. The timeline is mostly
shared; highlight the delegate's **own specifics**: their Asmita Talks room each round (by
their track — see below), their goshthi, and their side's group-photo block. Scope by the
delegate's group/side. Times come from the schedule but are **admin-adjustable at runtime**
(see Admin); the displayed schedule must reflect admin overrides.

**Flow maps** — for movement blocks, show the right map for the delegate. Requirements:
- The SVGs layer a floor-plan raster under vector flow arrows. Arrows are colored by wing:
  **blue `#067BC2` = kishores/yuvaks (eSide)**, **red `#D56062` = kishoris/yuvatis (iSide)**.
  **Show only the delegate's wing layer** (and its legend row); hide the other. Keep the
  wing split — do not merge or relabel the colors.
- Bind maps by the table in `ky_schedule.json` (`flow_maps`), **not by filename**: Round 1
  destination Room 214 -> `Asmita Talks - Round 1.svg`; Round 1 destination Room 212 ->
  `Asmita Talks - Round 1.5.svg`; Rounds 2-4 -> `Asmita Talks - Round 2 - 4.svg`; the
  Program 2 -> Lunch transition -> `Program 1 Exit Flow.svg` (its on-disk name is "Program 1
  Exit Flow" but it represents Program 2 -> Lunch).
- **Animate the route**: trace the arrow path with `stroke-dasharray`/`stroke-dashoffset`
  draw-on, a soft destination pulse, an origin dot. Pure CSS/SVG, no animation library.
  Respect `prefers-reduced-motion`.
- **Recompress the embedded floor-plan raster** (downsample to display size, WebP) while
  preserving the vector flow + legend layer. Each SVG is ~1.3 MB raw; this must come down
  substantially for fast load.

**Food menu** — render from `menu.json`. Sections **reveal at their times** (anchored to
schedule blocks, so reveals shift if the admin moves the day). Admin can also reveal/hide a
section manually. Dessert shows only "Ice cream".

**Trivia** — optional engagement, not competitive:
- Admin-authored questions, **short free-text answers** with an admin-maintained **accepted-
  answers list**; normalize before comparing (trim, collapse whitespace, lowercase, strip
  punctuation).
- **Two attempts** per question. A correct answer (on attempt 1 or 2) awards **exactly 1
  point**. No hints.
- Only questions the admin has **opened** are playable; one-at-a-time is fine.

**Personal stats** — each delegate sees **their own score and their current + longest
streak. No leaderboard or ranking is shown to delegates** (deliberately non-competitive).

### Streak rule (fixed)
- A streak counts **consecutive questions answered correctly**, per *question*, not per
  attempt.
- Missing the first attempt and getting it right on the second **keeps the streak** (the
  question was still answered correctly).
- A streak **breaks only when a question ends up wrong** (both attempts used, no correct
  answer).
- Track and display both **current** and **longest** streak per delegate.

---

## Points ledger (fixed)

Store points as an **append-only ledger**, not a running integer. Every change is an
immutable row with: delegate, delta (+/-), **source** (`question_correct`,
`manual_adjustment`, `correction`), an optional **reference** (question id), an optional
**note/reason**, the **actor** (admin id, or `system`), and a **timestamp**. A delegate's
score is the **sum** of their ledger rows. This gives every point a traceable reason and
makes corrections reversible. The ledger must be **append-only at the database level**
(updates/deletes blocked).

---

## Admin features

The admin view (runtime `is_admin`, toggleable with the delegate view) must let the admin:

- **Questions:** create/edit questions and accepted-answers lists; open/close questions.
- **Submissions & corrections:** view every delegate's submissions for a question; if an
  answer was right but didn't match the accepted set, **award the point manually** (writes a
  `correction` ledger entry).
- **Manual points:** add or subtract points for any delegate with an optional note (writes a
  ledger entry).
- **Standings (admin-only):** a leaderboard of delegates by **score and by streak**,
  expandable to see **all** delegates. This competitive view exists only for the admin —
  never expose it to delegates.
- **Point history:** view any delegate's full ledger with source/actor/timestamp/reason.
- **Schedule control:** adjust block times at runtime. **The admin-controlled schedule is the
  source of truth** — there is no live external sheet sync. A shift cascades to the
  personalized schedule and the menu reveal times.
- **Menu control:** manually reveal/hide menu sections.
- **Delegate management:** add a delegate (MIS ID, name, group, center, mandal), edit any
  delegate's details, and remove a delegate. **Removal is a deactivation, not a hard delete**
  — a removed delegate can no longer log in, but their ledger history is preserved so scores
  stay traceable (consistent with the append-only ledger). Adding a delegate makes that MIS
  ID a valid login immediately (covers day-of walk-ins and roster fixes).
- **Accounts:** promote/demote admins, reset a delegate's attempts on a question, and
  (optionally) clear a Telegram binding.

---

## Asmita Talks routing (confirmed)

Two rooms run in parallel; delegates are split into two tracks by goshthi group. From
`ky_schedule.json` (`asmita_talks`), confirmed by the event lead:

- **Track A** (Ghanshyam, Nilkanth, Chidakash, Brahma) -> rooms **214, 212, 214, 212, 212**
  across rounds 1-5 (starts on Bhagwan Swaminarayan in 214).
- **Track B** (Sahajanand, Parabrahma, Gunatit, Pragat) -> rooms **212, 214, 212, 214, 214**
  (starts on Holy Scriptures in 212).
- Round 5 has no movement (the track stays in its Round 4 room), so no flow map for it.

A delegate's track is determined by their goshthi group. Show each delegate the correct room
per round and the matching flow map.

---

## Design

**Goal: distinctive, on-brand, not generic — a clear sibling of the existing Asmita Din
look, designed fresh for this app's new surfaces.**

- **Use `content.md` as the brand/token foundation**: the palette (deep red `#c5272b`, gold
  `#ffb600`, paper `#faf7f2`, ink `#211d1a`, and the rest), the **Outfit** typeface, the
  **nishan-bar** striped motif, the papery aesthetic with minimal shadow, and the animation
  vocabulary (rise, pop, shake, confetti, blink). Inherit this design *system*.
- **Use the ui-ux-pro-max skill to design the NEW screens** (schedule timeline, flow-map
  viewer, profile, menu, streak/stats) within that foundation. Do not merely replicate the
  old three screens — design these surfaces intentionally, but keep them visually of-a-piece
  with the foundation.
- Reuse the foundation's tokens and components; extend them for new patterns rather than
  introducing a second visual language.
- The logo is a tasteful accent (header, login, loading), not a giant hero.
- **No emoji. No generic AI-template tells.** (Restated because it matters.)

---

## Secrets & the human-in-the-loop boundary

You can design the schema, write migrations, and write all app/bot code. You cannot create
the Supabase project, mint keys, create the bot, or deploy under the owner's account.

- **Never hardcode or commit secrets.** Use `.env.local`; write a committed `.env.example`
  listing every variable; ensure `.env.local` is gitignored (the repo is on GitHub).
- Expected env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable),
  `SUPABASE_SERVICE_ROLE_KEY` (secret), `TELEGRAM_BOT_TOKEN`, and a `SESSION_SECRET`.
- The **bot token and the Supabase secret key must stay server-side** — never in a
  `NEXT_PUBLIC_` variable or the client bundle.
- When you need real credentials to proceed or test, **pause and ask the owner**.

---

## How to work (the event is tomorrow — sequence for safety)

Write a short build plan and proposed schema to `PLAN.md` first, then build **in this order**,
so the essentials exist even if time runs short:

1. Identity/login (MIS ID + roster seed from CSV + Telegram `initData` auto-login + switch
   user) and the seeded admin (586086).
2. Admin core: question create/open, the ledger, manual points/corrections.
3. Trivia play + scoring + streaks + personal stats.
4. Personalized schedule (admin-adjustable) + profile.
5. Food menu reveals.
6. Flow maps (side-filtered, animated, raster recompressed).
7. Admin standings, menu control, schedule control, polish.

- **Commit to git at each milestone** with clear messages; interrupted work must be safe and
  resumable. Never commit secrets or `.env.local`.
- Treat flow-map filenames as unreliable; bind via the `ky_schedule.json` table.
- Make your own calls on anything unspecified, but **pause and ask** for the owner's
  Supabase/Telegram/Vercel credentials or a genuine product fork not covered here.

## Definition of done

Don't report "done" until you've actually exercised these and can say what you verified:
1. A recognized MIS ID logs in; an unrecognized one is rejected; `initData` auto-login works
   and "switch user" rebinds.
2. With a question open, a correct answer (including a normalized variant) awards exactly 1
   point and extends the streak; two wrong attempts break the streak; the second-attempt-
   correct case keeps the streak; no hints.
3. A delegate sees only their own score and streak — no ranking.
4. The schedule renders personalized; an admin time-shift cascades to the schedule and menu
   reveals.
5. The right flow map shows for a delegate's wing and track, with the route animation, and
   loads fast (raster recompressed).
6. Admin can open/close questions, view submissions, award corrections, adjust points (all
   in the ledger), see standings by score and streak, add/edit/remove (deactivate)
   delegates, and toggle between admin and delegate views.
7. The app works inside Telegram (initData) and in a plain browser (manual MIS ID), and looks
   and performs well at phone width.

State which of these you checked and how.
