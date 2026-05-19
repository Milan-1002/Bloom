---
phase: "03"
plan: "02"
subsystem: "health-tracking"
tags: ["weight", "rolling-average", "sparkline", "upsert", "tdd"]
dependency_graph:
  requires:
    - "01-02 (weight_logs table + unique(user_id,log_date) + RLS)"
    - "02-05 (Sparkline UI component, formatDateLabel, toLocalDateStr)"
    - "01-01 (react-hook-form + zod installed)"
  provides:
    - "rollingAverage(values, window) — pure function, exported + tested"
    - "useWeightLogs — last 30 weight_logs entries ordered ascending"
    - "useLogWeight — UPSERT weight_logs with onConflict: user_id,log_date"
    - "WeightEntrySheet — bottom sheet, RHF + Zod, kg numeric input"
    - "HomeScreen WeightCard — 7-day rolling avg sparkline + delta chip + entry button"
  affects:
    - "Phase 4 (weight data available for AI context via useWeightLogs)"
key_files:
  created:
    - "tests/health/weight-logging.test.ts"
    - "src/lib/rolling-average.ts"
    - "src/hooks/useWeightLogs.ts"
    - "src/hooks/useLogWeight.ts"
    - "src/components/health/WeightEntrySheet.tsx"
  modified:
    - "src/screens/home/HomeScreen.tsx (WeightCard + imports)"
decisions:
  - "No dedicated Weight tab — entry via HomeScreen card bottom sheet. Tab count stays at 4; weight is a supporting metric, not a primary workflow."
  - "rollingAverage rounds each output value to 1dp — avoids display values like 63.28571…"
  - "Sparkline shows rolling average series, not raw weights — per CLAUDE.md rule 5."
  - "delta chip: negative = mint, positive = neutral (no coral framing) — CLAUDE.md rule 6: no red states."
  - "WeightEntrySheet uses z.coerce.number() — handles string-typed input values from <input type='number'>."
  - "useWeightLogs queries last 30 entries — enough to compute 7-day rolling averages for a month's worth of data."
  - "useLogWeight onSuccess invalidates ['weight-logs'] (no date suffix) — weight logs are not date-scoped in cache like food_logs."
metrics:
  duration: "~20 minutes"
  completed: "2026-05-18"
  tasks_completed: 3
  files_created: 5
---

# Phase 03 Plan 02: Weight Logging

**One-liner:** 6 new tests (56 total), rolling average lib, UPSERT hook, WeightEntrySheet with Zod validation, HomeScreen weight card with 7-day sparkline.

## What Was Built

### Task 1: Data layer (TDD — 6 tests)

| Component | Tests | Key behavior |
|-----------|-------|-------------|
| `rollingAverage` | 3 | Pure fn; window larger than array averages all; 7-day window verified at indices 6 and 9 |
| `useWeightLogs` | 2 | Queries ordered ascending, limit 30; returns empty array when no data |
| `useLogWeight` | 1 | UPSERT with user_id + log_date + weight_kg + onConflict: user_id,log_date |

### Task 2: WeightEntrySheet

Bottom sheet (same pattern as EditLogEntrySheet/WeightEntrySheet):
- Large centered numeric input (`text-[40px]`, `inputMode="decimal"`, step 0.1, min 20, max 300)
- React Hook Form + `z.coerce.number().min(20).max(300)` Zod schema
- Pre-fills with `existingWeight` when editing
- "Save weight" / "Update weight" button → `useLogWeight.mutateAsync` → `onClose()`

### Task 3: HomeScreen WeightCard

Positioned after SymptomSummaryCard in the scrollable body:

```
WEIGHT · 7-DAY AVG
63.3 kg  [−0.5 kg chip]   [sparkline 100×44]

[Log today's weight] ← or [Today: 63.3 kg — Update] if already logged
```

- `avgSeries = rollingAverage(weights, 7)` — sparkline data is rolling averages
- `currentAvg = avgSeries.at(-1)` — shown as the current value
- `delta` compares last avg vs avg 7 entries ago; mint chip for negative, neutral for positive
- "Log today's weight" button opens `WeightEntrySheet`
- If today already logged, button shows "Today: X kg — Update"

## Verification Results

| Check | Result |
|-------|--------|
| `npx vitest run` | 56/56 pass |
| `npx tsc --noEmit` | 0 errors |
| rollingAverage at index 6 of 10-value array | 62.7 (confirmed) |
| rollingAverage at index 9 of 10-value array | 61.3 (confirmed) |
| UPSERT onConflict: user_id,log_date | confirmed (test) |
| Sparkline uses avgSeries not raw weights | confirmed (code) |
| delta chip: negative = mint | confirmed |
| Zod min/max validation | confirmed (schema) |

## Self-Check: PASSED
