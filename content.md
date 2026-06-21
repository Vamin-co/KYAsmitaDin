# AsmitaArena Design System

> Extracted from the codebase — all tokens, components, patterns, and conventions.

---

## 1. Foundations

### Technology Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 16 (App Router) |
| CSS | Tailwind CSS v4 via `@tailwindcss/postcss` |
| Font loading | `next/font/google` — **Outfit** (swap) |
| Token system | Tailwind `@theme` block in [globals.css](file:///Users/vandanamin/Desktop/AsmitaArena/app/globals.css) |

### Typography

| Token | Value |
|---|---|
| `--font-sans` | `var(--font-outfit), ui-sans-serif, system-ui, -apple-system, sans-serif` |

Applied via `font-sans` class on `<body>`. The Outfit variable font is loaded with `display: "swap"` and exposed as `--font-outfit`.

**Usage patterns across the codebase:**

| Style | Tailwind classes | Where used |
|---|---|---|
| Page heading | `text-2xl font-bold tracking-tight leading-tight` | Group name on PlayScreen |
| Section heading | `text-lg font-semibold` or `text-xl font-semibold tracking-tight` | Card headers, admin |
| Body / label | `text-sm font-medium` | Form labels, nav tabs |
| Caption / meta | `text-muted text-xs` or `text-[11px]` | Timestamps, subtitles |
| Micro-label | `text-[10px] font-bold uppercase tracking-wide` | "You" badge, admin badge |
| Uppercase tag | `text-xs font-semibold uppercase tracking-wider` | "Question is live", status |
| Tabular numbers | `font-bold tabular-nums` | Scores, leaderboard |

---

## 2. Color Tokens

Defined in the `@theme` block of [globals.css](file:///Users/vandanamin/Desktop/AsmitaArena/app/globals.css#L3-L21). Sampled from the logo `AsmitaDin_Logo_Color.png`.

### Brand (Red)

| Token | Hex | Usage |
|---|---|---|
| `--color-brand` | `#c5272b` | Primary buttons, error text, nishan-bar stripes, active nav border |
| `--color-brand-deep` | `#9e1f22` | Error/wrong attempt text |
| `--color-brand-soft` | `#fdf1f1` | Incorrect attempt background |

### Gold / Accent

| Token | Hex | Usage |
|---|---|---|
| `--color-gold` | `#ffb600` | Input focus ring, #1 leaderboard badge, "You" badge background |
| `--color-gold-deep` | `#c98f00` | Points label text, regenerate link |
| `--color-gold-soft` | `#fff7e2` | Score badge bg, highlighted leaderboard row, password reveal card |

### Neutrals

| Token | Hex | Usage |
|---|---|---|
| `--color-paper` | `#faf7f2` | Page background, input background |
| `--color-card` | `#ffffff` | Card background |
| `--color-ink` | `#211d1a` | Primary text color |
| `--color-muted` | `#756a5e` | Secondary / helper text |
| `--color-line` | `#e9e1d5` | Borders, dividers |

### Semantic

| Token | Hex | Usage |
|---|---|---|
| `--color-success` | `#1e7f4f` | Correct answers, "live" dot, leaderboard toggle on-state |
| `--color-success-soft` | `#ecf7f0` | Correct answer background |

### One-off / Hardcoded

| Color | Hex | Usage |
|---|---|---|
| Bronze | `#e8c39e` | 3rd-place leaderboard badge |
| White | `#ffffff` | Nishan-bar stripe, button text, admin badge text |

### Theme Color (Meta)

```tsx
// Viewport export in layout.tsx
themeColor: "#faf7f2"  // matches --color-paper
```

---

## 3. Spacing & Layout

### Layout Constraints

| Pattern | Classes | Where |
|---|---|---|
| Mobile play screen | `max-w-md mx-auto px-4 pb-10` | PlayScreen wrapper |
| Admin content | `max-w-5xl mx-auto px-4` | Admin layout |
| Login centered | `min-h-dvh flex flex-col items-center justify-center px-5 py-10` | Login page |
| Login card width | `w-full max-w-sm` | Login wrapper |

### Common Spacing Patterns

| Pattern | Classes |
|---|---|
| Section stack | `space-y-4` or `space-y-5` |
| Card padding | `p-5` or `p-6` or `px-5 py-4` |
| Form gap | `gap-3` or `gap-4` |
| Button row gap | `gap-2` or `gap-3` |

---

## 4. Component Library

### Card
Defined as a reusable string in [shared.ts](file:///Users/vandanamin/Desktop/AsmitaArena/components/admin/shared.ts#L30):

```ts
export const card = "bg-card rounded-2xl border border-line";
```

Common additions:
- `overflow-hidden` — when containing nishan-bar or full-width children
- `shadow-[0_1px_3px_rgba(33,29,26,0.07)]` — login card only (very subtle)
- `animate-rise` — entrance animation
- `animate-pulse` — loading skeleton

---

### Buttons

Four button variants defined in [shared.ts](file:///Users/vandanamin/Desktop/AsmitaArena/components/admin/shared.ts#L31-L36):

#### Primary (`btnPrimary`)
```
rounded-lg bg-brand text-white text-sm font-semibold px-4 py-2
active:scale-[0.97] transition-transform disabled:opacity-50
```

#### Ghost (`btnGhost`)
```
rounded-lg border border-line bg-card text-sm font-medium px-4 py-2
active:scale-[0.97] transition-transform disabled:opacity-50 hover:border-muted
```

#### Danger (`btnDanger`)
```
rounded-lg border border-brand/40 text-brand text-sm font-semibold px-4 py-2
active:scale-[0.97] transition-transform disabled:opacity-50
```

#### Full-width Primary (Login / PlayScreen)
```
w-full rounded-xl bg-brand text-white font-semibold py-3 text-base
active:scale-[0.98] transition-transform disabled:opacity-60
```

> [!NOTE]
> Admin buttons use `rounded-lg` and `text-sm`. Player-facing buttons use `rounded-xl` and `text-base` (larger touch targets for mobile).

#### Sign-out Link Button
```
text-muted text-sm font-medium px-2 py-1 active:opacity-60
```

---

### Inputs

#### Player-facing (Login, PlayScreen)
```
w-full rounded-xl border border-line bg-paper px-4 py-3 text-base outline-none
focus:border-gold focus:ring-2 focus:ring-gold/40 transition-shadow
```

#### Admin (shared.ts `inputCls`)
```
rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none
focus:border-gold focus:ring-2 focus:ring-gold/40
```

**Focus state:** `border-gold` + `ring-2 ring-gold/40` (gold accent ring)

---

### Status Pill

From [statusPill()](file:///Users/vandanamin/Desktop/AsmitaArena/components/admin/shared.ts#L40-L44):

```
inline-block text-[11px] font-bold uppercase tracking-wide border rounded-full px-2.5 py-0.5
```

| Status | Classes |
|---|---|
| `open` | `bg-success-soft text-success border-success/30` |
| `closed` | `bg-paper text-muted border-line` |
| `draft` | `bg-gold-soft text-gold-deep border-gold/40` |

---

### Badge / Tag

General pattern for small labels:

```
text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-1
```

Variants:
- **Admin badge:** `bg-brand text-white`
- **"You" badge:** `bg-gold/30 text-gold-deep rounded-full px-2 py-0.5`
- **Source label:** `bg-card border border-line rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide`
- **Accepted answer chip:** `text-xs bg-paper border border-line rounded-full px-2.5 py-1`

---

### Toggle Switch

```tsx
<button
  role="switch"
  aria-checked={value}
  className={`relative w-14 h-8 rounded-full transition-colors shrink-0 ${
    value ? "bg-success" : "bg-line"
  }`}
>
  <span
    className={`absolute top-1 size-6 rounded-full bg-white shadow transition-all ${
      value ? "left-7" : "left-1"
    }`}
  />
</button>
```

---

### Navigation (Admin Tabs)

From [AdminNav](file:///Users/vandanamin/Desktop/AsmitaArena/components/admin/AdminNav.tsx#L14-L36):

```
flex gap-1 -mb-px overflow-x-auto
```

Tab item:
```
px-3.5 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
```

| State | Border / Text |
|---|---|
| Active | `border-brand text-brand` |
| Inactive | `border-transparent text-muted hover:text-ink` |

---

### Leaderboard Row

From [PlayScreen Leaderboard](file:///Users/vandanamin/Desktop/AsmitaArena/components/PlayScreen.tsx#L240-L271):

```
flex items-center gap-3 px-5 py-3 border-t border-line
```

**Current user highlight:** `bg-gold-soft`

**Rank badge:**

| Rank | Classes |
|---|---|
| 1st | `bg-gold text-ink` |
| 2nd | `bg-line text-ink` |
| 3rd | `bg-[#e8c39e] text-ink` |
| 4th+ | `bg-paper text-muted border border-line` |

Badge base: `size-7 shrink-0 rounded-full grid place-items-center text-xs font-bold`

---

### Correct / Incorrect Feedback

**Attempt list item:**
```
flex items-center gap-2 text-sm rounded-lg px-3 py-2 border
```

| Outcome | Classes |
|---|---|
| Correct | `bg-success-soft border-success/30 text-success` |
| Incorrect | `bg-brand-soft border-brand/20 text-brand-deep` |

**Correct banner:**
```
bg-success-soft border border-success/30 rounded-xl px-4 py-4 text-center animate-pop
```

**No attempts left:**
```
bg-paper border border-line rounded-xl px-4 py-4 text-center
```

---

### Submission Check Icon (Admin)

```
size-6 shrink-0 rounded-full grid place-items-center text-xs font-bold
```

| State | Classes |
|---|---|
| Correct | `bg-success-soft text-success` |
| Incorrect | `bg-brand-soft text-brand` |

---

### Loading Skeleton

```
bg-card rounded-2xl border border-line animate-pulse
```
With fixed heights: `h-48`, or variable heights `[88, 200, 260]` for the play screen.

---

### Score Badge (PlayScreen)

```
bg-gold-soft border border-gold/40 rounded-xl px-4 py-2 text-center shrink-0
```

Score number: `text-2xl font-bold leading-none`
Label: `text-gold-deep text-[11px] font-semibold uppercase tracking-wide mt-1`

---

### Ledger Entry (Points History)

```
flex items-start gap-3 text-sm bg-paper border border-line rounded-lg px-3 py-2
```

Delta: `font-bold tabular-nums` with `text-success` (positive) or `text-brand` (negative)

---

## 5. Animation System

Defined in [globals.css](file:///Users/vandanamin/Desktop/AsmitaArena/app/globals.css#L39-L76):

| Name | Keyframes | Easing | Duration | Use case |
|---|---|---|---|---|
| `animate-rise` | `translateY(10px)→0`, `opacity 0→1` | `cubic-bezier(0.16, 1, 0.3, 1)` | 0.35s | Card entrance |
| `animate-pop` | `scale(0.92)→1.03→1`, `opacity 0→1` | `cubic-bezier(0.16, 1, 0.3, 1)` | 0.4s | Success banner, password reveal |
| `animate-shake` | Horizontal `±1–3px` oscillation | — | 0.45s | Wrong answer, login error |
| `confetti` | `translateY(-10→90px)`, `rotate(0→320deg)`, `opacity 1→0` | `ease-in` | 1.1s | Correct answer celebration |
| `animate-blink` | `opacity 1→0.45→1` | `ease-in-out` | 1.8s ∞ | "Live" indicator dot |
| `animate-pulse` | *(Tailwind built-in)* | — | — | Loading skeletons |

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .animate-rise, .animate-pop, .animate-shake, .confetti, .animate-blink {
    animation: none;
  }
}
```

### Confetti Configuration

14 particles, brand-themed colors:

```ts
const CONFETTI = Array.from({ length: 14 }, (_, i) => ({
  left: `${4 + i * 7}%`,
  background: i % 3 === 0 ? "#c5272b" : i % 3 === 1 ? "#ffb600" : "#e9e1d5",
  delay: `${(i % 5) * 90}ms`,
}));
```

Particle element: `position: absolute; top: 0; width: 7px; height: 11px; border-radius: 2px;`

---

## 6. Branding Motif — Nishan Bar

A thin repeating red/white striped bar evoking the dharma-nishan flag:

```css
.nishan-bar {
  height: 5px;
  background: repeating-linear-gradient(
    -55deg,
    var(--color-brand) 0 14px,
    #ffffff 14px 22px
  );
}
```

Used at the top of:
- Login card
- Group info card (PlayScreen)
- Live question section (Admin dashboard)

---

## 7. Interaction Patterns

### Button Press Feedback

| Context | Effect |
|---|---|
| Admin buttons | `active:scale-[0.97]` |
| Player buttons | `active:scale-[0.98]` |
| Sign-out | `active:opacity-60` |

All with `transition-transform`.

### Input Focus

All inputs: `focus:border-gold focus:ring-2 focus:ring-gold/40 transition-shadow`

### Disabled State

Buttons: `disabled:opacity-50` (admin) or `disabled:opacity-60` (player)

### Error Display

```
text-brand text-sm (font-medium)
```
Role: `role="alert"`. On login form, the entire form gets `animate-shake`.

---

## 8. Responsive Strategy

| Breakpoint | Usage |
|---|---|
| Default (mobile) | Full-width stacked layouts |
| `sm:` (640px) | 2-column grids in admin (standings, form fields) |

**Mobile-first is a hard requirement.** The player experience targets `max-w-md` (448px). Admin widens to `max-w-5xl` (1024px).

---

## 9. Shadows

Only one shadow used in the entire app — on the login card:

```
shadow-[0_1px_3px_rgba(33,29,26,0.07)]
```

Toggle thumb: `shadow` (Tailwind default)

> [!TIP]
> The design deliberately avoids heavy shadows to maintain the light, papery aesthetic of the `--color-paper` background.
