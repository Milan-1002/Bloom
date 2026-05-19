---
phase: "02"
plan: "04"
subsystem: "core-loop"
tags: ["recent-foods", "edit", "delete", "tdd", "food-components"]
dependency_graph:
  requires:
    - "02-02 (useLogFood, food_logs schema)"
    - "02-01 (calculateGL, formatGL)"
  provides:
    - "deduplicateByFdcId — pure fn, exported and tested"
    - "useRecentFoods — last 20 unique foods from food_logs"
    - "useEditFoodLog — UPDATE with proportional macro recalc"
    - "useDeleteFoodLog — DELETE by id, invalidates ['food-logs']"
    - "Recent foods quick-add chips in FoodSearchScreen"
    - "LogEntryRow — food log card with edit + delete, exported for diary/dashboard"
    - "EditLogEntrySheet — bottom sheet with serving stepper + slot picker"
  affects:
    - "02-05 (diary + dashboard import LogEntryRow; useRecentFoods already queryKey-compatible)"
key_files:
  created:
    - "tests/logging/use-recent-foods.test.ts"
    - "tests/logging/use-edit-food-log.test.tsx"
    - "tests/logging/use-delete-food-log.test.tsx"
    - "src/hooks/useRecentFoods.ts"
    - "src/hooks/useEditFoodLog.ts"
    - "src/hooks/useDeleteFoodLog.ts"
    - "src/components/food/LogEntryRow.tsx"
    - "src/components/food/EditLogEntrySheet.tsx"
  modified:
    - "src/screens/logging/FoodSearchScreen.tsx"
decisions:
  - "deduplicateByFdcId exported as pure function — enables direct unit testing without Supabase mock."
  - "Edit macro recalculation uses ratio (newServingG / oldServingG) applied to stored values — avoids a second DB/API call; floating-point rounding error negligible at practical serving sizes."
  - "GL re-derived from calculateGL(food_name, newCarbs) after edit — ensures the stored gl is always consistent with the actual new carbs, not just scaled proportionally."
  - "Recent foods one-tap re-add uses food's last-used meal_slot (spec: 'slot preserved') — not the current search screen's slot context."
  - "Delete requires explicit 'Delete' confirmation tap — 'Cancel' always visible to prevent accidental deletion."
  - "LogEntryRow manages its own showEdit + confirmDelete state — keeps diary/dashboard parent screens stateless for this concern."
  - "EditLogEntrySheet initialized with entry's current serving_g and meal_slot — user sees current values, not defaults."
metrics:
  duration: "~25 minutes"
  completed: "2026-05-18"
  tasks_completed: 5
  files_created: 8
---

# Phase 02 Plan 04: Recent Foods + Edit/Delete

**One-liner:** 9 new tests (40 total), deduplicateByFdcId + 3 mutation hooks, quick-add chips in search screen, LogEntryRow + EditLogEntrySheet ready for diary/dashboard wiring in 02-05.

## What Was Built

### Task 1: Three hooks (TDD — 9 tests)

| Hook | Tests | Key behavior |
|------|-------|-------------|
| `useRecentFoods` | 4 | Deduplicates by fdc_id (pure fn tested separately), limits to 20, filters null fdc_ids |
| `useEditFoodLog` | 2 | Proportional macro recalc (ratio method), GL re-derived from calculateGL |
| `useDeleteFoodLog` | 3 | DELETE by id, invalidates ['food-logs'], propagates error |

Macro recalc formula: `ratio = newServingG / oldServingG`; each macro `× ratio` with rounding; `gl = calculateGL(food_name, newCarbs)`.

### Task 2: Recent foods in FoodSearchScreen

Added "Quick add · Recently logged" horizontal scroll strip when:
- `debouncedQuery.length < 2` AND `recentFoods.length > 0`

Each `RecentFoodChip` shows: food name (truncated), serving + kcal, slot chip, "+" button.  
One-tap re-add: calls `useLogFood.mutateAsync` with food's stored values → "+" turns into "✓" for 1.5s.

### Task 3: Shared food components

**`LogEntryRow`** — full card for diary/dashboard:
- Slot chip (tone varies by slot) + time + food name + serving + macro dots (P / Fiber / GL)
- Edit button → `EditLogEntrySheet`
- Delete button → inline confirmation ("Delete?" / "Cancel") → `useDeleteFoodLog`

**`EditLogEntrySheet`** — bottom sheet overlay:
- Backdrop closes sheet; drag handle bar
- Serving stepper (±25g, min 1g)
- 4-chip slot picker (pre-selected to entry's current slot)
- "Save changes" → `useEditFoodLog.mutateAsync` → `onClose()`

## Verification Results

| Check | Result |
|-------|--------|
| `npx vitest run` | 40/40 pass |
| `npx tsc --noEmit` | 0 errors |
| deduplicateByFdcId keeps most recent entry per fdc_id | confirmed (test) |
| Edit mutation: kcal=178 when doubling 89 kcal entry | confirmed (test) |
| Delete: invalidates ['food-logs'] | confirmed (test) |
| One-tap re-add: ✓ shown 1.5s | confirmed (code) |
| Delete requires explicit confirm tap | confirmed (confirmDelete state) |
| EditLogEntrySheet min serving 1g | confirmed (Math.max(1, g - 25)) |

## Self-Check: PASSED
