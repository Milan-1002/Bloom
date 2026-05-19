---
phase: "02"
plan: "02"
subsystem: "core-loop"
tags: ["food-logging", "tanstack-query", "supabase-insert", "tdd", "serving-stepper"]
dependency_graph:
  requires:
    - "02-01 (getFoodByFdcId, scaleMacros, calculateGL, formatGL, lookupGIForDisplay)"
    - "01-02 (food_logs table + RLS)"
    - "01-03 (useAuth for user.id)"
  provides:
    - "useLogFood mutation hook — inserts denormalized food_logs row"
    - "FoodDetailScreen at /log/detail/:fdcId?slot=<slot>"
    - "Serving size stepper (±25g, min 1g)"
    - "Meal slot picker (Breakfast/Lunch/Dinner/Snack, pre-filled from URL)"
    - "Macro display: Ring (kcal) + MacroPill grid (protein/carbs/fat/fiber)"
    - "PCOS panel: GL / added sugar / GI"
    - "Log CTA: food_logs INSERT with all denormalized macros"
  affects:
    - "02-04 (recent foods re-add uses same food_logs row shape)"
    - "02-05 (Today dashboard reads food_logs via useQuery(['food-logs']))"
key_files:
  created:
    - "tests/logging/use-log-food.test.tsx"
    - "src/hooks/useLogFood.ts"
    - "src/screens/logging/FoodDetailScreen.tsx"
  modified:
    - "src/App.tsx"
decisions:
  - "MacroPill color dots use inline style={{ background: 'var(--b-...)' }} — token name is dynamic per macro, cannot use Tailwind class directly."
  - "Serving step is ±25g (not ±10g) — matches practical USDA serving increments and avoids excessive tapping."
  - "GL and GI stored as null (not 0) when unknown — enforces CLAUDE.md rule 4 at the INSERT layer, not just the display layer."
  - "CTA button title updates live as serving changes — user sees correct kcal before tapping."
  - "navigate('/home', { replace: true }) after log — prevents back-button returning to detail screen after a successful log."
metrics:
  duration: "~25 minutes"
  completed: "2026-05-18"
  tasks_completed: 3
  files_created: 3
---

# Phase 02 Plan 02: Food Logging

**One-liner:** FoodDetailScreen with live serving stepper, meal slot picker, PCOS macros panel, and food_logs INSERT — 28/28 tests passing, 0 TS errors.

## What Was Built

### Task 1: useLogFood (TDD — RED → GREEN)

3 tests → all pass:

| Test | Result |
|------|--------|
| INSERT called with denormalized macros + correct user_id | PASS |
| gl stored as null (not 0) when GI unknown | PASS |
| Throws when supabase returns error | PASS |

INSERT payload fields: `user_id`, `fdc_id`, `food_name`, `meal_slot`, `serving_g`, `logged_at` (ISO), `kcal`, `protein_g`, `carbs_g`, `fat_g`, `fiber_g`, `sugar_g`, `gi`, `gl`. On success: invalidates `['food-logs']` query cache.

### Task 2: FoodDetailScreen

Route: `/log/detail/:fdcId?slot=<slot>`

| Section | Behavior |
|---------|----------|
| AppBar | "Add to [Slot]" title; back button navigates -1 |
| Food name | `food.description` + `brand_owner` subtitle |
| Serving stepper | ±25g steps, min 1g enforced, live label shows g count |
| Macros card | Ring (kcal, max 2000) + 2×2 MacroPill grid (protein/carbs/fat/fiber) |
| PCOS panel | Glyc. load (formatGL), Added sugar, GI — all show "—" when unknown |
| Meal slot picker | 4 Chips, active=primary tone, inactive=ghost, pre-filled from ?slot= |
| CTA | "Add to [Slot] · X kcal" — updates live with serving; logs + navigates /home |

### Task 3: App.tsx wiring

Replaced `const FoodDetailScreen = () => null` with real import from `@/screens/logging/FoodDetailScreen`.

## Verification Results

| Check | Result |
|-------|--------|
| `npx vitest run` | 28/28 pass |
| `npx tsc --noEmit` | 0 errors |
| Serving stepper min=1g enforced | confirmed (disabled attr on minus btn) |
| GL = null when GI unknown, not 0 | confirmed (test + formatGL returns "—") |
| navigate('/home', { replace: true }) after log | confirmed |
| No style prop on UI components | confirmed (MacroPill uses inline style only for the color dot) |
| No hardcoded hex values | confirmed — all var(--b-*) or Tailwind b-* |

## Self-Check: PASSED
