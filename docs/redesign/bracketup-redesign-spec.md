# BracketUp UI Redesign — Design Spec (Direction B: Seeded)

Oct 20, 2026 · @andrew

> **For the coding agent:** this is the build brief. Read it fully before editing. Visual references: the "BracketUp Redesign" design canvas, artboards **B · Home** and **B · Round robin**.

## Overview

BracketUp is being restyled in Direction B, "Seeded": a quiet, editorial dark UI where hairline bracket lines, seed numbers and big tabular Geist Mono scores carry the personality. Color scheme, shadcn components and lucide icons stay. This spec is the build brief for the coding agent.

**Source of truth.** The design canvas "BracketUp Redesign" has two finished Direction B artboards: **B · Home** (landing page) and **B · Round robin** (tournament screen with the keypad score sheet). Treat those two as pixel references. Every other screen here is specified in text, using the same tokens and components; build them to this spec.

**Not in scope.** Data model, API routes, realtime sync and tournament logic do not change. This is a presentation-layer change: restyle existing components, add the new home route, add new presentational components.

**Caveat.** The repo was not available when this spec was written, so file paths are the likely Next.js App Router locations named in the brief (`app/page.tsx`, `/view/[code]`, `BracketView`, `EliminationView`, `ShareSheet`, `StepIndicator`). The agent should map each spec to the real file before editing.

**How to use this doc.** Build in the order in Implementation plan. Tokens first, then shared components, then screens. Each screen section lists layout, states and acceptance checks.

## Design principles

1. **Hairlines over boxes.** Group content with 1px `gray-800` dividers and whitespace. Use a filled surface (`gray-900`) only for things you act on: the current match, inputs, sheets. Never nest cards more than 2 levels.
2. **The bracket is the motif.** Connector lines and seed numbers appear on the home hero, the phase rail, standings and the bracket itself. Nowhere else; used sparingly.
3. **Numbers are the headline.** Scores, records and payouts are Geist Mono, `tabular-nums`, large and bold. Labels around them stay small and quiet.
4. **Color means phase.** Violet = brand and round robin / current. Amber = elimination. Emerald = locked in, winner, complete. Yellow = 1st place and the #1 seed. Red = destructive only. No decorative color.
5. **Glow marks "now".** Only the current match (or the active input) gets the violet glow. Locked results get an emerald ring. Everything else is flat.
6. **Thumb zone first.** The one primary action per screen lives in a sticky bottom bar. Secondary actions sit in the header or inline.
7. **Sentence case, plain words.** Headings in sentence case, no exclamation marks, no filler or fake stats. Mono uppercase is reserved for tiny table headers.

**Avoid:** large purple gradients, glassmorphism or backdrop blur, colored left-border cards, animated "live" dots, three-column feature grids, emoji other than the five event icons (🥏 🏓 🏀 🏐 🏆).

## Design tokens

All tokens reference Tailwind v4's built-in oklch palette, so no new hues are introduced. Add this to `app/globals.css` and map the existing shadcn variables onto it. Keep the app dark-only (no light theme block).

```css
@theme inline {
  /* surfaces */
  --color-bg: var(--color-gray-950);          /* #030712 page */
  --color-surface: var(--color-gray-900);     /* actionable surfaces, sheets, inputs */
  --color-surface-2: var(--color-gray-800);   /* keys, chips, secondary buttons */
  --color-line: var(--color-gray-800);        /* hairline dividers */
  --color-line-soft: var(--color-gray-900);   /* list dividers on bg */
  --color-line-strong: var(--color-gray-700); /* input borders, bracket connectors */
  /* text */
  --color-fg: var(--color-white);
  --color-fg-muted: var(--color-gray-400);    /* secondary text, min for body copy */
  --color-fg-faint: var(--color-gray-500);    /* decorative only, >= 18px or non-text */
  /* brand + semantic */
  --color-brand: var(--color-violet-600);
  --color-brand-line: var(--color-violet-500); /* active bracket path, focus border */
  --color-brand-soft: var(--color-violet-300); /* violet text on dark */
  --color-brand-deep: var(--color-violet-900); /* active row border */
  --color-elim: var(--color-amber-500);
  --color-elim-fg: var(--color-amber-400);
  --color-done: var(--color-emerald-500);
  --color-done-fg: var(--color-emerald-400);
  --color-done-deep: var(--color-emerald-800);
  --color-gold: var(--color-yellow-400);
  --color-silver: var(--color-gray-300);
  --color-danger: var(--color-red-500);

  /* type */
  --font-sans: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, monospace;

  /* radii */
  --radius-chip: 0.5rem;   /* 8px  seed chips, logo tile */
  --radius-control: 0.75rem; /* 12px buttons, inputs, keys */
  --radius-card: 1rem;     /* 16px match row, score fields, panels */
  --radius-sheet: 1.375rem; /* 22px bottom sheet top corners */

  /* depth */
  --shadow-glow: 0 0 0 1px oklch(54.1% 0.281 293 / 0.45), 0 14px 40px -14px oklch(54.1% 0.281 293 / 0.7);
  --shadow-focus: 0 0 0 4px oklch(54.1% 0.281 293 / 0.2), 0 10px 30px -10px oklch(54.1% 0.281 293 / 0.6);
  --shadow-locked: 0 0 0 1px oklch(76.5% 0.177 163 / 0.35);
  --shadow-node: 0 0 0 4px oklch(54.1% 0.281 293 / 0.25);
  --shadow-sheet: 0 -24px 60px -10px oklch(0% 0 0 / 0.7);

  /* motion */
  --ease-out-soft: cubic-bezier(0.2, 0.9, 0.3, 1);
  --ease-draw: cubic-bezier(0.6, 0, 0.2, 1);
  --duration-press: 90ms;
  --duration-quick: 150ms;
  --duration-sheet: 280ms;
  --duration-settle: 500ms;
  --duration-advance: 450ms;
  --duration-draw: 1400ms;
}

:root {
  --background: var(--color-bg);
  --foreground: var(--color-fg);
  --card: var(--color-surface);
  --popover: var(--color-surface);
  --primary: var(--color-brand);
  --primary-foreground: var(--color-white);
  --secondary: var(--color-surface-2);
  --muted: var(--color-surface);
  --muted-foreground: var(--color-fg-muted);
  --border: var(--color-line);
  --input: var(--color-line-strong);
  --ring: var(--color-brand-line);
  --destructive: var(--color-danger);
  --radius: 0.75rem;
}
```

### Type scale

| Token | Size / line height | Weight | Tracking | Font | Use |
| --- | --- | --- | --- | --- | --- |
| display | 38px / 1.08 | 600 | -0.035em | sans | Home hero h1 (48px at md+) |
| title | 20px / 1.25 | 600 | -0.02em | sans | Section headings, champion name |
| heading | 18px / 1.3 | 600 | -0.02em | sans | Card and table headings |
| body | 16px / 1.55 | 400 | 0 | sans | Paragraphs, list rows |
| small | 14px / 1.5 | 400 | 0 | sans | Supporting copy, labels |
| caption | 12–13px / 1.4 | 500 | 0 | sans | Meta lines, status under a row |
| table-head | 11px | 500 | 0.06em, uppercase | mono | Column headers only |
| score-xl | 52px / 1 | 700 | -0.04em | mono, tabular | Score sheet fields, champion score |
| score-lg | 28px / 1 | 700 | -0.02em | mono, tabular | Current match row, bracket final |
| stat | 26px / 1.1 | 700 | -0.03em | mono, tabular | Payout amounts |
| score-md | 17px | 600 | 0 | mono, tabular | Standings W–L, bracket scores |
| seed | 11–15px | 700 | 0 | mono | Seed numbers (yellow-400 for seed 1) |

### Spacing and sizing

| Token | Value | Use |
| --- | --- | --- |
| gutter | 20px (`px-5`) | Phone page side padding; 32px at md, centered max-width above |
| section-gap | 32–48px | Between page sections |
| row | 50px | Standings and list rows |
| row-lg | 72px min | Current match row |
| tap | 44px min | Every interactive element |
| key | 58px tall | Keypad keys, 8px gap |
| cta | 54px | Primary buttons; 56px for the sheet's Lock in |
| bar | 12px top, 20px sides, 12px + `env(safe-area-inset-bottom)` bottom | Sticky action bar |
| max-width | 640px content, 1120px landing | Tablet and desktop containers |

## Shared components

Build these as presentational components in `components/bracketup/` on top of existing shadcn primitives (Button, Input, Sheet/Drawer, Tabs, Badge, Table). Each is used on two or more screens.

| Component | Built on | Spec | Used on |
| --- | --- | --- | --- |
| `LogoMark` | div + lucide-style SVG | 28px violet-600 tile, radius 8, white bracket glyph (stroke 2.4). 32px on desktop header | All headers |
| `PhaseRail` | div + SVG/CSS | 2px `line` track with three 14px nodes: Round robin · Bracket · Complete. Done segment fills `brand-line` (RR) or `elim` (bracket) to show progress within the phase. Current node: filled brand + `shadow-node`. Future nodes: bg-colored with 2px `line-strong` ring. Complete node turns emerald. Labels 12px under each node, current label white 600, others `fg-muted` | Tournament, participant view, dashboard cards (compact: 4px track, no labels) |
| `SeedBadge` | span | Mono, 11–15px, `fg-muted`; seed 1 = `gold`. Optional 22px square variant with `surface-2` bg, radius 6 | Standings, match rows, bracket |
| `MatchRow` | button | Full-width, min 72px, radius 16, `surface` bg. Layout: seed · name (left) · score – score · name · seed (right). Scores score-lg mono. States: **current** = `brand-deep` border + `shadow-glow`; **locked** = `done-deep` border + `shadow-locked`, loser's score `fg-muted`, 500ms emerald background flash (`settle`); **upcoming** = no surface, hairline row, 48px; **final** = hairline row, winner 600, loser muted. Status line under it: 12px centered, muted or emerald | Round robin, bracket (narrow), participant view |
| `ScoreSheet` | shadcn Sheet/Drawer (bottom) | See Score entry below. Dark scrim `bg/72%`, no blur | Round robin, bracket |
| `StandingsTable` | shadcn Table | Header row: table-head mono (`#`, Player/Team, W–L, PTS±). Rows 50px, `line-soft` dividers, seed column 32px, W–L score-md, ± 14px muted. Optional cut line: dashed `line-strong` with a 11px mono label ("Bracket line") if fewer teams advance than play | Round robin tab, participant view, complete |
| `StickyActionBar` | div | `sticky bottom-0`, bg, 1px top `line`, padding per `bar` token incl. safe area. Holds one primary Button (54px, radius 12, full width) and optionally one secondary to its left | Every screen with a primary action |
| `BracketRound` | div + CSS borders | Column of match boxes (width 100% on phone). Box: 2 rows of 44px (seed · name · score), radius 12, `surface` bg, 1px `line` border. Connectors: 2px `line-strong`, right-angled with 6px corner radius; the advancing team's path uses `brand-line` (or `elim` in elimination styling) | Bracket |
| `JoinCodeInput` | shadcn Input + Button | 56px tall group, radius 12, `surface` bg, `line-strong` border. Input mono 20px, 0.2em tracking, uppercase, `maxLength=6`, `autocapitalize=characters`, `inputMode=text`, `autocomplete=off`. Attached 56px square arrow button, `surface-2`. Auto-submits on 6th char | Home, participant entry |
| `EventIcon` | span | The five emoji at 20px (lists) / 28px (wizard tiles). Decorative: `aria-hidden`, event name always in text beside it | Dashboard, wizard, headers |

### Buttons

- **Primary:** violet-600, white, 54px, radius 12, 16px/600. Press: `scale(0.97)`, `duration-press`. Disabled: `surface-2` bg, `fg-muted` text (not opacity).
- **Secondary:** `surface-2` bg, 1px `line-strong` border, white text.
- **Ghost/icon:** 44×44, transparent, white icon 20–22px; always has `aria-label`.
- **Destructive:** red-500 text on `surface`, confirm in a dialog. Never red fill on the primary bar.

## Screen specs

Screens 1 and 4 match finished artboards; the rest are specified here in the same system. Copy in quotes is final unless marked [placeholder].

### 1. Home / landing (new) — artboard B · Home

The current dashboard moves off `/`. If the user has tournaments, `/` can redirect to `/tournaments` (see Open questions).

1. **Header** (64px): LogoMark + "BracketUp" 16/600 left; "My tournaments" link right (44px tap). 1px `line-soft` bottom border.
2. **Hero:** h1 display "Run the whole tournament from your pocket." Then body muted: "Round robin to set the seeds. A bracket to settle it. The payout, worked out. For ping pong night, the putting league, or whatever your crew plays."
3. **Bracket illustration:** inline SVG, 8 seeds (1,8,4,5,3,6,2,7) converging in 3 rounds to a gold 7px dot. Lines 1.5px `line-strong`; seed 1's path drawn in `brand-line` 2.5px with a stroke-dashoffset draw animation (`duration-draw`, 300ms delay). `aria-hidden`.
4. **Join:** label "Have a share code? Watch live, no account needed." + JoinCodeInput. If the page loads with `?code=`, prefill and focus it.
5. **How it works:** three rows separated by hairlines, no cards. Each: 8px colored square + mono "PHASE n" label (violet / amber / emerald), title 20/600, one-line description, and a small visual on the right:
   - Round robin — 6×6 matrix of 10px squares (upper triangle = matches, first 9 filled violet-600, rest `surface-2`; diagonal empty).
   - Seeded bracket — mono pairing list "1 v 8 / 4 v 5 / 3 v 6 / 2 v 7".
   - Payout — full-width 70/30 bar (gold / gray-500) with "1st · 70% $56" and "2nd · 30% $24" in stat type, caption "Example: 8 players, $10 entry".
6. **Events:** heading "Singles or doubles, random or picked teams", then 5 hairline rows (52px): emoji + name.
7. **Footer** + **StickyActionBar** with "Start a tournament" → `/create`.

### 2. My tournaments dashboard (`/tournaments`, currently `app/page.tsx`)

- **Header:** LogoMark, "My tournaments" title, overflow menu (Export CSV for all).
- **List:** one row per tournament, 76px min, hairline separated (not cards). Left: EventIcon 28px in a 44px `surface` square, radius 12. Middle: name 16/600, meta 13px muted ("8 players · Singles · Oct 16"). Right: phase badge + chevron. Under the meta, a compact PhaseRail (4px track, no labels) showing progress.
- **Phase badges** (shadcn Badge, 24px, radius 999, 12px/600): Round robin = violet-300 text on violet-950 bg; Bracket = amber-400 on amber-950; Complete = emerald-400 on emerald-950; Draft = gray-400 on gray-800. Badge text always present (color is not the only signal).
- **Row actions:** swipe-left or long-press reveals Export CSV and Delete (Delete confirms in a dialog). On desktop these sit in a row-end `…` menu.
- **Sorting:** active (RR, Bracket) first by last updated, then Complete, then Draft.
- **Empty state:** the home bracket SVG at 60% size, "No tournaments yet" (title), "Start one in about a minute. Players join with a code." (small, muted), primary "Start a tournament" in the sticky bar, and a secondary text link "Join with a code".
- **Sticky bar:** "New tournament".

### 3. Create wizard (`/create`) + StepIndicator

**StepIndicator** reuses the bracket motif: 4 numbered nodes (mono 12px in 24px circles) joined by a 2px line. Done = filled violet with a check icon; current = filled violet + `shadow-node`; upcoming = `line-strong` ring. Labels under: Details · Players · Teams · Prizes (current white, others muted). Sticky under the header.

Every step: content scrolls; StickyActionBar holds Back (secondary, 54px square chevron) + Next (primary, flex-1). Next is disabled until the step is valid, with a 12px muted reason above the bar ("Add at least 3 players").

1. **Details:** Name input (label above, 56px). Event: 5 tiles in a 3+2 grid, 88px tall, radius 16, `surface` bg, emoji 28px + label; selected = `brand-line` 2px border + `shadow-focus`. Format: segmented control Singles / Doubles (shadcn Tabs, 48px).
2. **Players:** an input row pinned at the top of the list ("Add player", Enter or + adds and keeps focus for rapid entry). List rows 52px: seed-style index (mono muted), name, 44px remove (×) button. Count in the heading ("Players · 8"). Paste a comma or newline list to add many.
3. **Teams** (doubles only; skipped for singles, StepIndicator shows it as "skipped" muted): toggle Random / Manual. Random: team list with a "Shuffle" secondary button; shuffling animates names with a 150ms crossfade. Manual: tap two players to pair them; paired teams appear above as "Dana & Ray" rows; unpaired players below as chips.
4. **Prizes:** Entry fee per player: big mono input with $ prefix (score-lg). Pot total computed live in stat type ("Pot $80"). Split: two numeric fields 1st % and 2nd % that always sum to 100 (editing one updates the other), plus the 70/30 bar from Home live-updating. Payout preview: 1st $56 (gold), 2nd $24 (silver). "No prizes" switch hides the section. Final CTA: "Create tournament".

### 4. Tournament — round robin — artboard B · Round robin

- **Header:** back (44px), event emoji + name 16/600, share icon button → ShareSheet.
- **PhaseRail** (full, with labels) under the header.
- **Now playing:** caption "Now playing · match 9 of 15", then the current MatchRow (glowing). Tap opens ScoreSheet. Status line: "Tap to enter the score" → after lock "Dana wins · standings updated" (emerald).
- **Standings:** heading "Standings" + caption right "Seeds update live". StandingsTable. When a lock-in changes the order, rows reorder with a 300ms FLIP translate.
- **Matches:** below standings, "Up next" and "Results" hairline lists (MatchRow upcoming / final variants). Any final can be tapped to edit (reopens ScoreSheet).
- **StickyActionBar:** "Enter score" (opens sheet) → after lock "Next match". When all matches are final: "Start bracket" (amber is not used on the button; it stays violet) with a confirm sheet showing the seed list.

**Score entry (ScoreSheet) — exact behavior**

- Bottom sheet, 22px top radius, `surface` bg, grab handle 40×4, `shadow-sheet`, enters with `sheetup` (`duration-sheet`, translateY 40% → 0 + fade). Tap scrim or drag down to dismiss without saving.
- Two score fields side by side, 104px tall, radius 16, `bg` fill. Each shows "seed · name" 13px muted and the score in score-xl ("–" when empty). The active field has a 2px `brand-line` border + `shadow-focus`; tap a field to make it active. **There is no swap/switch key.**
- Keypad: 3-column grid, 8px gap, keys 58px, radius 12, `surface-2`, mono 26/600. Rows: 1 2 3 / 4 5 6 / 7 8 9 / (empty) 0 ⌫. Delete key uses `line` border on `surface` and a lucide `Delete` icon with `aria-label="Delete"`. Press: `scale(0.93)` + bg gray-700, `duration-press`.
- Input rules: max 2 digits per field; a leading 0 is replaced by the next digit. When field A gets its 2nd digit, focus does not auto-move (avoid surprise); the user taps field B.
- "Lock in 11–9" primary (56px) is enabled only when both fields have values and they differ (ties not allowed unless the event config allows them). On lock: sheet closes, MatchRow switches to locked styling with the `settle` flash, haptic `navigator.vibrate(10)` where supported, standings reorder.
- Desktop/tablet: keyboard digits, Backspace, Tab between fields and Enter to lock all work while the sheet is open.

### 5. Elimination bracket (`BracketView` / `EliminationView`)

**Choice: round tabs + mini-map on phones, full bracket at md+.** Horizontal scrolling a 16-team bracket at 390px shows about 1.5 rounds and makes people scroll in two axes; pinch-zoom makes text unreadable. Round tabs show one round at full size (8 matches stack vertically like the round robin list), keep the same MatchRow, and match how hosts actually work: one round at a time.

- **Round tabs:** shadcn Tabs, scrollable, 44px: "Round of 16 · Quarters · Semis · Final". Current round is selected by default; completed rounds get a 6px emerald dot after the label (static, not animated).
- **Mini-map:** above the tabs, a 56px-tall SVG of the whole bracket in hairlines; the selected round's column is highlighted in amber; tapping a column switches tabs. Gives orientation without zooming.
- **Round content:** each match is a BracketRound box with a short connector stub on the right indicating where the winner goes ("→ Semi 1" in caption). Bracket phase uses amber accents: PhaseRail Bracket node is amber; the current match glow stays violet (glow = now) but locked results show the winner with an amber 2px path stub.
- **Advancing moment:** on lock, the winner's name slides 24px right and fades into the stub (`duration-advance`), and the next round's tab shows a 1-count increment. Reduced motion: no slide, instant swap.
- **md+:** full bracket, all rounds as columns with real connector lines, horizontally centered; 16 teams fits at 1024px with 200px columns. Current match glows.
- Score entry uses the same ScoreSheet.

### 6. Champion / complete state

- **Celebration (first view only per device, stored in localStorage):** confetti burst from the top, 1800ms, using only gold, violet-400, emerald-400 and white, about 80 particles, canvas-based (`canvas-confetti` or similar). Reduced motion: no confetti.
- **Podium:** champion centered: 🏆 at 40px, "Champion" mono caption in gold, name in display size, a 2px gold ring around a 72px initials avatar with a soft gold glow (`0 0 40px -8px` yellow-400 at 50%). Runner-up below-left on a lower step: silver ring, title size. Steps are two hairline-topped blocks of different heights (1st taller), not cards.
- **Final score:** "Final · 21–17" in score-lg mono under the podium.
- **Payout breakdown:** hairline table: Pot ($80 = 8 × $10), 1st 70% $56 (gold, stat type), 2nd 30% $24 (silver). If no entry fee, this section is hidden.
- **Below:** collapsible "Bracket" (read-only full bracket with the champion path in gold) and "Final standings".
- **Sticky bar:** "Share results" (primary, opens ShareSheet) + "Export CSV" (secondary).
- PhaseRail shows all three nodes complete, Complete node emerald.

### 7. Participant view (`/view/[code]`)

Same layout as the host screens, read-only:

- Header shows event + name and a "View only" badge (gray). No share-edit actions; share icon still shares the link.
- PhaseRail, then whichever phase is live: round robin = Now playing row (not tappable, glow kept) + StandingsTable + matches; bracket = round tabs; complete = champion screen without the sticky bar's host actions.
- No StickyActionBar during play. Instead a 40px muted footer line "Updates automatically" (static text; no animated live dot).
- New results arrive with the same `settle` flash so participants feel the update.
- Invalid or expired code: centered state with the bracket SVG faded, "We couldn't find that tournament", and JoinCodeInput to try again.

### 8. ShareSheet

- Bottom sheet (same chrome as ScoreSheet). Title "Invite players to follow along".
- QR code 200×200 on a white 16px-padded tile, radius 16 (QR needs a light background to scan), centered.
- Below it the code in score-xl mono with 0.15em tracking, and a 44px "Copy" icon button. Copied state: icon becomes a check and the label "Copied" for 1.5s.
- Primary "Share link" uses `navigator.share` with the `/view/[code]` URL; falls back to copy link on desktop.
- Caption: "Anyone with the code can watch. Only you can enter scores."

## Responsive behavior

Phone (base, 390px) is the design target; Tailwind's `md` (768px) and `lg` (1024px) are the only breakpoints.

| Screen | Phone (base) | Tablet (`md`) | Desktop (`lg`) |
| --- | --- | --- | --- |
| Home | Single column, sticky CTA bar | Hero text and bracket SVG side by side; phases stay stacked rows; sticky bar removed, CTA inline under hero beside the join input | 1120px max; hero 48px; phases become one horizontal row of three with a single connector line running through their phase squares (not cards) |
| Dashboard | Hairline rows, sticky "New tournament" | 640px centered column; "New tournament" moves to header | Same column plus a right-side row menu instead of swipe |
| Wizard | Full screen, sticky Back/Next | 560px centered column, bar stays at the column bottom | Same |
| Round robin | Stacked: now playing → standings → matches | Two columns: left (flex 1) now playing + matches, right (320px) standings, sticky top | Same as tablet, 1040px max |
| Score entry | Bottom sheet with keypad | Centered dialog 420px, keypad kept; physical keys work | Dialog; keypad hidden if a hardware keyboard is used (show on first pointer tap) |
| Bracket | Round tabs + mini-map | Full bracket for up to 8 teams; round tabs above 8 | Full bracket up to 16 teams, 200px columns |
| Champion | Stacked podium, sticky share bar | Podium and payout side by side | Same, 960px max |
| Participant view | Same as host layout, read-only | Same as host tablet | Same as host desktop |
| ShareSheet | Bottom sheet | Centered dialog 400px | Same |

## Motion, accessibility and PWA

### Motion

| Interaction | Animation | Duration / easing | Reduced motion |
| --- | --- | --- | --- |
| Press (buttons, rows) | scale 0.97 | `duration-press`, ease-out | No transform; bg color change only |
| Keypad key | scale 0.93 + bg gray-700 | `duration-press` | Bg change only |
| Sheet open | translateY 40% → 0, opacity 0 → 1 | `duration-sheet`, `ease-out-soft` | Opacity only, 120ms |
| Lock in | MatchRow border/glow violet → emerald, bg flash emerald 22% → 0 | `duration-settle` | Instant style change |
| Standings reorder | FLIP translateY | 300ms, `ease-out-soft` | Instant |
| Team advances | slide 24px + fade into connector | `duration-advance` | Instant |
| Home bracket line | stroke-dashoffset draw | `duration-draw`, `ease-draw`, 300ms delay | Fully drawn, static |
| Champion confetti | canvas burst | ~1800ms, once per device | Not rendered |

Implement reduced motion with Tailwind's `motion-safe:` / `motion-reduce:` variants and a `useReducedMotion` check before firing confetti. No looping animations anywhere.

### Accessibility

- Every tap target ≥ 44×44px; keypad keys 58px; adjacent stepper-like targets separated by ≥ 8px.
- Contrast: body and small text use white or gray-400 on gray-950/900 (passes 4.5:1). gray-500 fails 4.5:1 on gray-950, so it is decorative only (bracket SVG seeds, payout bar).
- Color is never the only signal: phase badges have text, the winner gets weight + "wins" text, seed 1 is also first in order.
- ScoreSheet is a labelled dialog (`aria-label="Enter score"`), focus moves to the active field, Escape closes, focus returns to the MatchRow. Score fields are buttons with `aria-pressed` for the active one and `aria-label="Dana score, 11"`.
- Icon-only buttons carry `aria-label`; emoji are `aria-hidden` with visible event names.
- Live updates on the participant view use an `aria-live="polite"` region announcing "Dana beat Mike 11–9".

### PWA and safe areas

- `viewport-fit=cover` in the viewport meta; `apple-mobile-web-app-status-bar-style: black-translucent`; `theme-color` #030712.
- Headers add `padding-top: env(safe-area-inset-top)`; StickyActionBar and sheets add `env(safe-area-inset-bottom)`; horizontal insets on the page gutter for landscape.
- Use `100dvh` (not `100vh`) for full-height layouts so the sticky bar sits above the mobile browser toolbar.

## Implementation plan

Build in six PRs, each shippable on its own. Do not change data fetching, server actions or tournament logic; if a component mixes logic and markup, extract the markup into a presentational component and keep props stable.

1. **Tokens** — add the `@theme` and `:root` blocks to `app/globals.css`; load Geist and Geist Mono via `next/font` with `--font-geist-sans` / `--font-geist-mono`; set viewport, theme-color and status-bar meta in the root layout. Replace hard-coded gray/violet classes with token utilities (`bg-bg`, `bg-surface`, `border-line`, `text-fg-muted`, `bg-brand`) as each file is touched.
2. **Shared components** — LogoMark, PhaseRail, SeedBadge, MatchRow, StandingsTable, StickyActionBar, JoinCodeInput, EventIcon, ScoreSheet in `components/bracketup/`.
3. **Round robin + score entry** — restyle the tournament page to match artboard B · Round robin; replace the current score inputs with ScoreSheet.
4. **Bracket + champion** — BracketView/EliminationView with round tabs, mini-map and md+ full bracket; complete state with podium, confetti and payouts.
5. **Wizard + dashboard** — StepIndicator, 4 steps, move the dashboard to `/tournaments` with new rows, badges and empty state.
6. **Home, participant view, ShareSheet** — new `/` landing per artboard B · Home; restyle `/view/[code]`; restyle ShareSheet.

### File map (verify against the repo)

| Area | Likely file(s) | Change |
| --- | --- | --- |
| Tokens, fonts, meta | `app/globals.css`, `app/layout.tsx` | Edit |
| Home | `app/page.tsx` | Replace with landing; move dashboard |
| Dashboard | `app/tournaments/page.tsx` | New route, content from old `app/page.tsx` |
| Wizard | `app/create/**`, `StepIndicator` | Restyle |
| Tournament | `app/tournament/[id]/**` (or equivalent) | Restyle, add ScoreSheet |
| Bracket | `BracketView`, `EliminationView` | Restyle + round tabs + mini-map |
| Participant | `app/view/[code]/page.tsx` | Restyle, read-only variants |
| Share | `ShareSheet` | Restyle |
| New components | `components/bracketup/*` | Create |

### Acceptance criteria

- [ ] No hex colors in components; all colors come from tokens or Tailwind palette utilities listed above.
- [ ] Every interactive element is ≥ 44×44px at 390px width (check in devtools).
- [ ] Score entry: an 11–9 score takes 4 taps (1, 1, tap field B, 9) + Lock in; Lock in is disabled for empty or tied scores.
- [ ] The keypad has no swap/switch-team key; the active field changes only by tapping a field (or Tab on desktop).
- [ ] A 16-team bracket is readable at 390px with no horizontal page scroll.
- [ ] With `prefers-reduced-motion: reduce`, no transforms, draws or confetti run.
- [ ] Installed as a PWA on iOS, the header clears the notch and the sticky bar clears the home indicator.
- [ ] Home and round robin match the two canvas artboards side by side at 390px.
- [ ] Lighthouse accessibility ≥ 95 on home, tournament and participant view.

### Open questions

- Should `/` redirect signed-in hosts with existing tournaments to `/tournaments`, or always show the landing page?
- Are ties allowed for any event type? The spec disables Lock in on ties.
- Does every player advance to the bracket, or only the top N? The standings cut line depends on it.
- Is there an existing analytics or haptics utility to reuse for the lock-in vibration?
