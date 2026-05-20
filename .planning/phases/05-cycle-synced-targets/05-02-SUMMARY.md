---
phase: 05-cycle-synced-targets
plan: 02
status: complete
completed_at: "2026-05-20"
subsystem: dashboard-cycle-ui
tags: [cycle, ui, hooks, phase-drift, pcos]
key-files:
  created:
    - src/components/home/CyclePhaseChip.tsx
    - src/components/home/LutealTipCard.tsx
  modified:
    - src/hooks/useProfile.ts
    - src/hooks/useAITargets.ts
    - src/screens/home/HomeScreen.tsx
decisions:
  - "No Sheet component existed in src/components/ui/ — implemented inline fixed overlay in CyclePhaseChip"
  - "CyclePhaseChip placed below date label (before greeting row) to give it visual separation"
---

# Phase 05 Plan 02: Dashboard Cycle UI Summary

## One-liner

Cycle phase chip + bottom sheet + luteal swap card wired into HomeScreen, with useAITargets extended to regenerate on phase drift and stale prompt version.

## What Was Built

### Task 1 — useProfile + useAITargets hooks

**useProfile.ts:** Changed `select('*')` to an explicit column list including `last_period_date`, `cycle_length_days`, `period_length_days` — prevents over-fetching and future schema surprises.

**useAITargets.ts:**
- Added `getCyclePhase` import from `@/lib/cycle`
- Extended profile select to include `updated_at, last_period_date, cycle_length_days`
- Computes `cycleResult` from profile data; extracts `computedPhase`
- `phaseDrifted`: true when `existing.cycle_phase !== computedPhase` (and phase is known)
- `promptVersionStale`: true when `existing.prompt_version < 2`
- `needsRegen` now covers: no row, phase drifted, prompt stale, or profile updated after generation
- `AITargets` type extended with `cycle_phase?: string | null`
- `rowToTargets` maps `cycle_phase` from DB row; FALLBACK sets it to `null`

### Task 2 — CyclePhaseChip + LutealTipCard

**CyclePhaseChip.tsx** (`src/components/home/CyclePhaseChip.tsx`):
- Props: `{ result: CyclePhaseResult; className?: string }`
- Pill: `rounded-full border border-b-hairline bg-b-surface px-3 py-1 text-[11px] font-semibold text-b-ink-2`
- Label: `{PHASE_CONTENT[result.phase].title} · Day {result.cycleDay}`
- Tap opens fixed overlay bottom sheet with drag indicator, phase explanation, and close button
- No Sheet component in `src/components/ui/` — built inline with `fixed inset-0 z-50 flex items-end bg-black/40` overlay

**LutealTipCard.tsx** (`src/components/home/LutealTipCard.tsx`):
- Uses `Card` from `@/components/ui` — no pad override (inherits md = p-4)
- Renders 3 LUTEAL_SWAPS rows: craving → arrow → swap text + GL badge
- GL badge: `text-[10px] font-semibold text-b-mint bg-b-mint-soft rounded-full px-1.5 py-0.5`
- CTA: full-width pill-border button navigates to `/recipes?phase=luteal`
- `className` prop on both components; no `style` prop; no hardcoded hex values

### Task 3 — HomeScreen wired

- Imported `getCyclePhase`, `CyclePhaseChip`, `LutealTipCard`
- `cycleResult` computed from `profile?.last_period_date` and `profile?.cycle_length_days ?? 28`
- `CyclePhaseChip` renders below date label in header when `cycleResult` is non-null
- `LutealTipCard` renders after `MacroProgressCard`, before `MealSlotsSection`, gated on `cycleResult?.phase === 'luteal'`

## Verification Results

| Check | Command | Result |
|-------|---------|--------|
| TypeScript | `npx tsc --noEmit` | PASS — 0 errors |
| cycle_phase in useAITargets | `grep -n "cycle_phase" src/hooks/useAITargets.ts` | Lines 19, 34, 50, 92 |
| getCyclePhase in HomeScreen | `grep -n "getCyclePhase" src/screens/home/HomeScreen.tsx` | Lines 15, 367 |
| LutealTipCard in HomeScreen | `grep -n "LutealTipCard" src/screens/home/HomeScreen.tsx` | Lines 8, 426 |

## Deviations from Plan

### Auto-handled Deviations

**1. [Rule 3 - Missing Infrastructure] No Sheet component in ui/**
- **Found during:** Task 2 — plan says "Check src/components/ui/ for an existing Sheet component — use it if available"
- **Issue:** No Sheet component exists in `src/components/ui/`; directory contains Avatar, Card, Btn, IconBtn, AppBar, Progress, Ring, Sparkline, Chip only
- **Fix:** Implemented the bottom sheet inline inside CyclePhaseChip using `fixed inset-0 z-50 flex items-end bg-black/40` overlay pattern. Functionally equivalent — no external dependency required.
- **Files modified:** `src/components/home/CyclePhaseChip.tsx`

## Commits

| Hash | Message |
|------|---------|
| `84e95c1` | feat(05-02): update useProfile + useAITargets with cycle fields and phase-drift regen |
| `2276fe7` | feat(05-02): add CyclePhaseChip and LutealTipCard components |
| `1d7959d` | feat(05-02): wire CyclePhaseChip and LutealTipCard into HomeScreen |

## Next

**Plan 05-03** — Supabase Edge Function (`generate-targets`) extended to accept cycle phase, adjust GL ceiling and protein floor for luteal phase, and return `cycle_phase` + `prompt_version: 2` in the persisted row.

## Self-Check: PASSED

- `src/components/home/CyclePhaseChip.tsx` — created and committed (2276fe7)
- `src/components/home/LutealTipCard.tsx` — created and committed (2276fe7)
- `src/hooks/useProfile.ts` — modified and committed (84e95c1)
- `src/hooks/useAITargets.ts` — modified and committed (84e95c1)
- `src/screens/home/HomeScreen.tsx` — modified and committed (1d7959d)
- TypeScript: 0 errors
- All three commits pushed to remote (master)
