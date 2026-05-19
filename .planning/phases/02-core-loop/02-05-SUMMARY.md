---
phase: "02"
plan: "05"
subsystem: "core-loop"
tags: ["dashboard", "diary", "date-navigation", "macro-rings", "meal-slots", "tdd"]
dependency_graph:
  requires:
    - "02-04 (LogEntryRow, EditLogEntrySheet, useDeleteFoodLog, useEditFoodLog)"
    - "02-02 (useLogFood, food_logs schema)"
    - "02-01 (calculateGL, formatGL)"
  provides:
    - "useFoodLogs(dateStr) — queries food_logs by local day bounds"
    - "sumMacros(entries) — aggregate totals, null-safe, rounded"
    - "STATIC_TARGETS — Phase 2 reference targets (Phase 4 replaces with AI)"
    - "DateStrip — 7-day date selector, future days disabled"
    - "MealSlotsSection — 4 meal slots with LogEntryRow + add CTAs"
    - "HomeScreen — real Today dashboard with macro rings + date navigation"
    - "DiaryScreen at /diary — full day totals + meal slots"
    - "AppLayout — Diary tab added (Home | Diary | Profile)"
  affects:
    - "Phase 4 (STATIC_TARGETS replaced by useAITargets; dashboard receives real GL ceiling)"
key_files:
  created:
    - "tests/dashboard/use-food-logs.test.ts"
    - "tests/dashboard/sum-macros.test.ts"
    - "src/hooks/useFoodLogs.ts"
    - "src/lib/dates.ts"
    - "src/lib/macros.ts"
    - "src/lib/targets.ts"
    - "src/components/food/DateStrip.tsx"
    - "src/components/food/MealSlotsSection.tsx"
    - "src/screens/diary/DiaryScreen.tsx"
  modified:
    - "src/screens/home/HomeScreen.tsx (complete rewrite)"
    - "src/components/layout/AppLayout.tsx (Diary tab added)"
    - "src/App.tsx (/diary route + DiaryScreen import)"
decisions:
  - "queryKey: ['food-logs', dateStr] nests under ['food-logs'] — edit/delete invalidations cascade to all date queries automatically."
  - "dateBounds uses local midnight (new Date(dateStr + 'T00:00:00')) not UTC midnight — food logged at 11pm local doesn't disappear into the next day."
  - "sumMacros rounds each accumulated total after every entry (not just at the end) — prevents floating-point drift accumulating across many entries."
  - "STATIC_TARGETS in src/lib/targets.ts — Phase 4 useAITargets hook can replace without touching HomeScreen or DiaryScreen."
  - "DateStrip: future days disabled with pointer-events-none — no error state needed, just greyed-out pills."
  - "MealSlotsSection '+ Add' passes both slot and date to /log?slot=&date= — enables back-logging for past dates in v1."
  - "MacroRingCard GL ring uses lowerBetter display logic: fill = amount used of ceiling — not deficit framing (CLAUDE.md rule 6)."
  - "DiaryScreen DayTotalsCard: kcal shown as percentage of 1700 kcal reference (adequacy framing) not deficit."
metrics:
  duration: "~30 minutes"
  completed: "2026-05-18"
  tasks_completed: 4
  files_created: 9
---

# Phase 02 Plan 05: Today Dashboard + Food Diary

**One-liner:** HomeScreen is a real dashboard with date navigation, PCOS macro rings, and meals by slot; DiaryScreen at /diary shows day totals + full entries; 5 new tests → 45 total, 0 TS errors.

## What Was Built

### Task 1: Data layer (TDD — 5 tests)

| File | Purpose |
|------|---------|
| `useFoodLogs(dateStr)` | Queries food_logs by local day bounds (gte/lte); queryKey under `['food-logs']` |
| `sumMacros(entries)` | Null-safe aggregation, rounds to 1dp; treats null macros as 0 |
| `dateBounds(dateStr)` | Converts local YYYY-MM-DD to UTC ISO gte/lte pair |
| `toLocalDateStr()` | Returns YYYY-MM-DD in local time |
| `STATIC_TARGETS` | Phase 2 reference: protein 120g, fiber 30g, GL 100, sugar 25g, kcal 1700 |

### Task 2: Shared components

**`DateStrip`** — 7 days ending today; selected day = primary bg; today = small dot; future days greyed + disabled.

**`MealSlotsSection`** — 4 slot sections (Breakfast/Lunch/Dinner/Snack). Each shows:
- Header: slot name + slot kcal + "+ Add" CTA → `/log?slot={slot}&date={date}`
- Entries: `<LogEntryRow>` per entry (edit/delete wired from 02-04)
- Empty state: dashed border placeholder

### Task 3: HomeScreen (complete rewrite)

- Greeting header (time-of-day: morning/afternoon/evening) + display_name from profile
- "Log food" button → /log?slot=lunch
- `DateStrip` → `MacroProgressCard` → `MealSlotsSection`

`MacroProgressCard`: 3 `Ring` components (Protein / Fiber / GL) + kcal count. GL displayed as "how much of ceiling used" (adequacy framing, not deficit).

### Task 4: DiaryScreen + routing

**DiaryScreen** at `/diary`:
- `AppBar` (big, "Diary", day label subtitle)
- `DateStrip`
- `DayTotalsCard` (kcal ring + protein/fiber/GL progress bars + carbs/fat/sugar sub-row)
- `MealSlotsSection`

**AppLayout**: 3 tabs — Home | Diary | Profile. Diary uses a clipboard/document SVG icon.

**App.tsx**: `/diary` route added inside `RequireProfile > AppLayout`.

## Verification Results

| Check | Result |
|-------|--------|
| `npx vitest run` | 45/45 pass |
| `npx tsc --noEmit` | 0 errors |
| sumMacros null-safety (null treated as 0) | confirmed (test) |
| sumMacros float rounding (2.1 + 1.2 = 3.3) | confirmed (test) |
| useFoodLogs calls gte/lte with date bounds | confirmed (test) |
| ['food-logs', date] invalidated by edit/delete | confirmed (queryKey nesting) |
| Future days in DateStrip non-interactive | confirmed (disabled attr) |
| GL ring adequacy framing (not deficit) | confirmed (lowerBetter display logic) |
| DiaryScreen accessible via Diary tab | confirmed |

## Self-Check: PASSED
