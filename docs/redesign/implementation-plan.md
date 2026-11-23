# BracketUp Redesign — Implementation Plan

Nov 23, 2026 · derived from `bracketup-redesign-spec.md` after mapping it onto the real repo.

## Deviations from the spec (and why)

The spec was written without repo access. These are the places reality forced a different call.

1. **Round robin is NOT single-"now playing."** The repo runs simultaneous lanes per round
   (multiple tables playing at once) and the host needs to skip a match whose team isn't
   ready and come back to it later. Decision (host confirmed): keep lanes, remove the
   per-round nav gate, show **all rounds, scrollable, every non-bye match tappable
   regardless of round or status**. See "Round robin screen" below.
2. **UI kit is `@base-ui/react`, not Radix.** `components/ui/sheet.tsx` and `dialog.tsx` use
   `data-open`/`data-ending-style` and `render=` props, not `data-state`/`asChild`. Any new
   sheet-based component (ScoreSheet, restyled ShareSheet) must follow that API.
3. **`--font-geist-mono` is undefined.** `app/layout.tsx` only loads `Geist`. The entire type
   system depends on mono tabular-nums for scores — this must be fixed in PR 1 before
   anything else.
4. **`/manifest.json` doesn't exist** despite being referenced in `layout.tsx` — 404 today.
5. **`lint` is currently red** (4 `react-hooks/set-state-in-effect` errors in the
   localStorage-in-effect pattern used by all four page components). Needs fixing before
   lint can be used as a PR gate.
6. **No shadcn `Table` installed** — `StandingsTable` is built from flex divs, which is also
   what the artboard actually does.
7. **Home route**: always show the landing at `/`, no redirect-if-has-tournaments. The
   tournament store returns `[]` server-side, so a redirect would still flash the landing
   first.
8. **Ties**: allowed in round robin (data model + standings already fully support it),
   blocked in elimination, per spec. `ScoreSheet` takes an `allowTies` prop.
9. **Standings cut line**: not built. `startElimination` seeds the entire field today, so
   there is nothing to cut. `StandingsTable` accepts an optional `cutAfter` prop so it can be
   switched on later without touching the component again.

## Round robin screen — final shape

- All rounds rendered as grouped sections ("Round 1", "Round 2", …), vertically scrollable.
  No tabs, no prev/next round arrows.
- Every match that isn't a bye is tappable in any round, in any status — tapping a completed
  match reopens `ScoreSheet` pre-filled (same "tap a final to edit" pattern the spec already
  describes for elimination).
- Status indicator per match row stays (amber "Live" / emerald "Complete") so a skipped match
  is visually obvious.
- `tournament.currentRound` is kept but repurposed: on open, scroll to the first round with an
  incomplete match. It no longer filters which matches are displayed, and nothing gates on it.
- No single persistent "Enter score" sticky action (there's no one current match). Sticky bar
  shows "Start bracket" once `getAllRoundsComplete()` is true, mirroring how
  `EliminationView` already behaves; otherwise it's just round-progress context.
- `MatchRow`'s glowing "current" state is dropped for round robin (nothing is singularly
  current). Reserved for elimination: a match with both teams set and unplayed.
- Participant view (`/view/[code]`) gets the same all-rounds-visible treatment, read-only.

This required no `lib/tournament-logic.ts` changes — `calculateStandings` and
`getAllRoundsComplete` already operate across all matches, and `submitScore` saves by match
id with no round guard. The old round-nav was purely a display filter.

## PR sequence

### PR 0 · Prep (S)
No visual change; unblocks everything else.
- `lib/events.ts` — single `EVENTS` map (type → emoji + sentence-case label), replacing the
  4 duplicated `EVENT_ICONS` maps across `app/page.tsx`, `app/tournament/[id]/page.tsx`,
  `app/view/[code]/page.tsx`, `components/wizard/Step1Details.tsx`.
- `lib/phases.ts` — phase labels + badge classes, replacing the 3 duplicated
  `PHASE_LABELS`/`PHASE_COLORS` maps.
- `lib/haptics.ts` — wraps `navigator.vibrate` behind a feature check.
- `public/manifest.json`.
- Fix the 4 `react-hooks/set-state-in-effect` lint errors so `lint` is a usable gate.

### PR 1 · Tokens & fonts (M)
- Add the spec's `@theme inline` block + dark `:root` to `app/globals.css`. Keep `.dark` on
  `<html>` — `button.tsx` and others use `dark:` variants that depend on it.
- Load `Geist` + `Geist_Mono` via `next/font/google`, wire to `--font-geist-sans` /
  `--font-geist-mono`. Fix the circular `--font-sans: var(--font-sans)` in globals.css.
- `viewport-fit=cover`, `theme-color`, apple status bar meta (layout.tsx mostly has this
  already — verify against spec's PWA section).
- Add `size="cta"` (54px) / `"cta-lg"` (56px) variants to `components/ui/button.tsx` —
  current largest is `h-9`.

### PR 2 · Shared components (L)
New `components/bracketup/`: `LogoMark`, `PhaseRail`, `SeedBadge`, `MatchRow`,
`StandingsTable`, `StickyActionBar`, `JoinCodeInput`, `EventIcon`, `BracketRound`, and
`ScoreSheet`.
- `ScoreSheet` needs a `BottomSheet` wrapper around `ui/sheet.tsx` that drops the default
  close-X and blur, and sets the `bg/72%` scrim — `SheetContent` doesn't expose overlay
  overrides today, so this is a small new primitive, not a prop change.
- `MatchRow` ships `current | locked | upcoming | final` states per spec, but round robin
  only ever uses `locked | upcoming | final` per the decision above.
- Component tests here for the ScoreSheet acceptance criteria (4-tap 11–9 flow, no
  swap key, tie handling per `allowTies`).

### PR 3 · Round robin + score entry (L)
Restyle `RoundRobinView` per "Round robin screen" above. Replace both score dialogs
(`RoundRobinView` and `EliminationView` each have their own near-identical one today) with
the shared `ScoreSheet`. Standings FLIP reorder on lock-in. Remove the `animate-pulse` live
dot (spec explicitly avoids animated "live" indicators).

### PR 4 · Bracket + champion (L)
`BracketView` / `EliminationView`: round tabs + mini-map on phones, full bracket at `md+`,
replacing today's negative-margin horizontal-scroll-only layout. New champion/podium screen
with payout breakdown table. `canvas-confetti` as a new dependency, gated behind
`prefers-reduced-motion` and a `localStorage` once-per-device flag.

### PR 5 · Wizard + dashboard (L)
- `StepIndicator` → bracket-motif nodes (numbered circles → check icons, violet/emerald).
- Restyle the 4 wizard steps; `Step1Details` moves from lucide icons to `EventIcon`/emoji.
- Dashboard moves `app/page.tsx` → `app/tournaments/page.tsx`: hairline rows, phase badges,
  empty state, compact `PhaseRail`. Preserve both CSV exports and search. Swap `confirm()`
  for a proper Dialog on delete. Row `…` menu needs `shadcn add dropdown-menu`.
- Update `app/tournament/[id]/page.tsx`'s not-found redirect from `/` to `/tournaments`.

### PR 6 · Home, participant view, ShareSheet (M)
- New landing at `/` per artboard B (`B-Home.dc.html`) — hero, bracket SVG with the seed-1
  draw animation, join input, 3-row "how it works", events list, sticky CTA.
- `/view/[code]` restyled read-only, all-rounds round robin view, `aria-live` region for new
  results.
- `ShareSheet` restyled: white QR tile, score-xl code, `BottomSheet` chrome.

## Gates per PR

- `bun test` — 37 tests currently pass; should stay green throughout since
  `lib/tournament-logic.ts` is untouched by this redesign (good regression guardrail).
- `bun run lint` — clean, starting after PR 0.
- `bun run build`.
- Manual check at 390px width (devtools) against the two artboards for PR 3 and PR 6.
