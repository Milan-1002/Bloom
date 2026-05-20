---
phase: 05-cycle-synced-targets
plan: 01
status: complete
completed_at: "2026-05-20"
subsystem: cycle-engine
tags: [schema, migration, cycle, edge-function, types]
requirements: [CYCL-01, CYCL-02, CYCL-03]
dependency_graph:
  provides:
    - supabase/migrations/20260520000001_phase5_cycle_columns.sql
    - src/lib/cycle.ts (CyclePhase, CyclePhaseResult, getCyclePhase)
    - src/lib/cycleContent.ts (PHASE_CONTENT, LUTEAL_SWAPS)
    - src/lib/database.types.ts (regenerated — new columns typed)
    - supabase/functions/generate-targets/index.ts (PROMPT_VERSION=2, cycle-aware)
  required_by:
    - 05-02 (useAITargets hook phase-drift check, profile cycle fields)
    - 05-03 (dashboard phase chip, Luteal tip card, cycle content copy)
tech_stack:
  added: []
  patterns:
    - Pure function cycle phase engine with proportional boundaries
    - Inline phase computation in Edge Function (Deno cannot import from src/)
    - buildUserPrompt returns structured object instead of raw string
key_files:
  created:
    - supabase/migrations/20260520000001_phase5_cycle_columns.sql
    - src/lib/cycle.ts
    - src/lib/cycleContent.ts
  modified:
    - src/lib/database.types.ts
    - supabase/functions/generate-targets/index.ts
decisions:
  - buildUserPrompt return type changed from string to { prompt, cycle_phase } to pass computed phase to INSERT
  - Phase boundaries inlined in Edge Function (not imported from cycle.ts) — Deno runtime cannot import from src/
  - Remote migration history repaired (reverted 3 legacy IDs, applied 2 local IDs) before push
metrics:
  duration: "~25 minutes"
  completed_at: "2026-05-20"
  tasks_completed: 4
  files_changed: 5
---

# Phase 5 Plan 01: Schema Migration + Cycle Engine + Edge Function v2 Summary

**One-liner:** Cycle schema columns migrated to Supabase, pure getCyclePhase engine added, and generate-targets bumped to PROMPT_VERSION=2 with full cycle-phase-aware prompt guidance.

## What Was Built

### Task 1 — Phase 5 schema migration
`supabase/migrations/20260520000001_phase5_cycle_columns.sql` adds five new nullable columns across three tables:
- `profiles`: `last_period_date date`, `cycle_length_days integer default 28`, `period_length_days integer default 5`
- `symptom_logs`: `cravings smallint check (cravings between 1 and 5)`
- `ai_daily_targets`: `cycle_phase text`

Each column has a `COMMENT ON COLUMN` following the Phase 4 pattern. No new RLS policies needed — existing policies cover all new columns additively.

### Task 2 — Push migration and regenerate types
Migration pushed to remote Supabase project `nfyqateokdecjttimrhy` via `supabase db push`. TypeScript types regenerated with `npx supabase gen types typescript --project-id nfyqateokdecjttimrhy`. `src/lib/database.types.ts` now contains all 5 new columns in the correct Row types.

### Task 3 — Cycle engine and static content
`src/lib/cycle.ts` exports:
- `CyclePhase` union type: `'menstrual' | 'follicular' | 'ovulation' | 'luteal'`
- `CyclePhaseResult` type: `{ phase, cycleDay, cycleLength }`
- `getCyclePhase(lastPeriodDate, cycleLengthDays)` — pure function, returns null for null/invalid date, proportional phase boundaries for cycles 21–45 days

`src/lib/cycleContent.ts` exports:
- `PHASE_CONTENT` — `Record<CyclePhase, { title, chipLabel, explanation }>` with plain-language explanations for each phase
- `LUTEAL_SWAPS` — readonly array of 3 comfort food swaps with GL notes

### Task 4 — Cycle-aware Edge Function v2
`supabase/functions/generate-targets/index.ts` changes:
- `PROMPT_VERSION` bumped `1 → 2`
- `ProfileRow` extended with `last_period_date: string | null` and `cycle_length_days: number | null`
- `SYSTEM_PROMPT` has new CYCLE PHASE GUIDANCE section with per-phase macro adjustment rules
- `buildUserPrompt` now returns `{ prompt: string; cycle_phase: string | null }` — phase computed inline using identical boundaries to `cycle.ts`
- Profile `SELECT` clause updated to include `last_period_date, cycle_length_days`
- `ai_daily_targets` INSERT includes `cycle_phase: cycle_phase ?? null`
- All existing guardrail patterns (`FORBIDDEN_PATTERNS`, `validateTargets`, `checkForbidden`) preserved

## Verification Results

| Check | Command | Result |
|-------|---------|--------|
| PROMPT_VERSION = 2 | `grep -c "PROMPT_VERSION = 2" .../index.ts` | 1 (pass) |
| cycle_phase in migration | `grep -c "cycle_phase" ...phase5_cycle_columns.sql` | 4 (pass) |
| last_period_date in types | `grep -c "last_period_date" database.types.ts` | 3 (pass) |
| TypeScript strict mode | `npx tsc --noEmit` | 0 errors (pass) |
| cycle_length_days in types | `grep -c "cycle_length_days" database.types.ts` | 3 (pass) |
| cravings in types | `grep -c "cravings" database.types.ts` | 3 (pass) |
| cycle_phase in types | `grep -c "cycle_phase" database.types.ts` | 3 (pass) |
| period_length_days in types | `grep -c "period_length_days" database.types.ts` | 3 (pass) |

## Commits

| Hash | Message |
|------|---------|
| `8d2fc93` | feat(05-01): add Phase 5 cycle schema migration |
| `bb86955` | feat(05-01): push migration and regenerate database.types.ts |
| `b93c0af` | feat(05-01): add cycle engine and static phase content |
| `0b0956b` | feat(05-01): extend generate-targets Edge Function for cycle-aware prompts |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocker] Remote migration history out of sync**
- **Found during:** Task 2 (supabase db push)
- **Issue:** Remote had 3 migration IDs (20260518183047, 20260519011045, 20260519063708) not present locally. Supabase CLI refused to push because local migrations were not a superset of remote history. Additionally, the init migration tables already existed on remote, so `20260518000001` and `20260518000002` needed to be marked as applied rather than re-run.
- **Fix:** Ran `supabase migration repair --status reverted` on the 3 legacy remote IDs, then `supabase migration repair --status applied` on the 2 local IDs that were already applied on remote. This allowed the new Phase 5 migration to push cleanly.
- **Files modified:** None (remote migration history table only)
- **Commit:** Included in `bb86955`

## Known Stubs

None — this plan contains no UI components. All outputs are schema, types, pure functions, and backend Edge Function logic.

## Threat Flags

No new threat surface beyond what the plan's threat model covers. `cycle_phase` is stored as a server-computed coarse label (not user-supplied text). RLS `ai_targets_select_own` restricts reads to row owner.

## Self-Check: PASSED

- supabase/migrations/20260520000001_phase5_cycle_columns.sql: FOUND
- src/lib/database.types.ts (contains last_period_date): FOUND
- src/lib/cycle.ts: FOUND
- src/lib/cycleContent.ts: FOUND
- supabase/functions/generate-targets/index.ts (PROMPT_VERSION=2): FOUND
- All 4 task commits in git log: FOUND (8d2fc93, bb86955, b93c0af, 0b0956b)

## Next

Plan 02 (`05-02`) builds on these foundations:
- Updates `useProfile` hook to expose cycle fields from the profiles row
- Adds `useAITargets` phase-drift invalidation (compare `computedPhase` vs `storedTargets.cycle_phase`)
- Adds "My Cycle" settings section in Profile screen (date picker + day steppers)
- Updates `useSymptomLog` / `useUpsertSymptomLog` for the `cravings` field
