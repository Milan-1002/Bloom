---
phase: "03"
plan: "01"
subsystem: "health-tracking"
tags: ["symptoms", "upsert", "tdd", "date-navigation", "dot-bar"]
dependency_graph:
  requires:
    - "02-05 (DateStrip, toLocalDateStr, formatDateLabel)"
    - "01-02 (symptom_logs table + unique(user_id, log_date) constraint + RLS)"
  provides:
    - "useSymptomLog(dateStr) — SELECT symptom_logs by log_date"
    - "useUpsertSymptomLog — UPSERT symptom_logs with onConflict: user_id,log_date"
    - "SymptomsScreen at /symptoms — energy tiles, dot-bar rows, date nav, save/update"
    - "HomeScreen SymptomSummaryCard — dot-bar display with Log/Edit CTA"
    - "AppLayout — 4 tabs: Home | Diary | Symptoms | Profile"
  affects:
    - "03-02 (weight logging — independent; both use log_date pattern)"
    - "Phase 4 (symptoms data available for AI context if needed)"
key_files:
  created:
    - "tests/health/use-symptom-log.test.ts"
    - "src/hooks/useSymptomLog.ts"
    - "src/hooks/useUpsertSymptomLog.ts"
    - "src/screens/symptoms/SymptomsScreen.tsx"
  modified:
    - "src/screens/home/HomeScreen.tsx (SymptomSummaryCard + useSymptomLog)"
    - "src/components/layout/AppLayout.tsx (Symptoms tab added)"
    - "src/App.tsx (/symptoms route)"
decisions:
  - "UPSERT uses onConflict: 'user_id,log_date' — one row per user per calendar day; INSERT-or-UPDATE without client-side read-before-write."
  - "useSymptomLog queries by log_date only (no user_id filter) — RLS enforces user isolation; explicit user_id filter would be redundant."
  - "Form values initialized to 0 (unset) not 3 (midpoint) — prevents accidentally saving a neutral check-in; Save button disabled until at least one value > 0."
  - "useEffect syncs form values from savedLog after isFetching resolves — avoids stale form showing previous day's data during loading."
  - "Dot-bar tap sets value to exact tapped segment number (1–5) — not an increment toggle."
  - "lowerBetter symptoms (bloating, skin): fill still left-to-right (1=leftmost), label text changes per value to convey severity."
  - "SymptomSummaryCard on HomeScreen navigates to /symptoms for both Log and Edit — Symptoms tab is the canonical edit surface."
metrics:
  duration: "~25 minutes"
  completed: "2026-05-18"
  tasks_completed: 4
  files_created: 4
---

# Phase 03 Plan 01: Symptom Logging

**One-liner:** 5 new tests (50 total), UPSERT hooks, SymptomsScreen with energy tiles + dot-bar inputs + date nav, HomeScreen summary card, 4-tab AppLayout.

## What Was Built

### Task 1: Hooks (TDD — 5 tests)

| Hook | Tests | Key behavior |
|------|-------|-------------|
| `useSymptomLog(dateStr)` | 2 | SELECT by log_date; returns row or null |
| `useUpsertSymptomLog` | 3 | UPSERT with onConflict; invalidates [symptom-log, date]; propagates error |

### Task 2: SymptomsScreen

Route: `/symptoms` (tab)

| Section | Detail |
|---------|--------|
| AppBar | Big, "How are you?", day label subtitle |
| DateStrip | Same shared component from 02-05; past-day editing enabled |
| Energy card | 5 emoji tiles (😴 Drained → ✨ Bright); active tile = primary bg |
| Other symptoms card | Mood / Sleep / Bloating / Skin each as a dot-bar row (tap segment 1–5) |
| Save button | Disabled until `hasChanges`; shows "Update check-in" when editing saved entry |
| Saved banner | "Saved ✓" shown 2s after successful UPSERT |

Form sync: `useEffect` watches `[savedLog, isFetching]`; resets local values from DB when query resolves. Prevents stale data on date change.

### Task 3: HomeScreen symptom summary card

- No entry → card: "How are you feeling?" + "Log →" CTA
- Has entry → card: 5 compact dot-bar columns (Energy / Mood / Sleep / Bloating / Skin) + "Edit →" link
- Each dot-bar: 5 circles, filled = `value` filled from left, color per symptom token

### Task 4: Routing

AppLayout: 4 tabs — Home | Diary | Symptoms | Profile. Symptoms icon = heart SVG.
App.tsx: `/symptoms` route inside RequireProfile > AppLayout.

## Verification Results

| Check | Result |
|-------|--------|
| `npx vitest run` | 50/50 pass |
| `npx tsc --noEmit` | 0 errors |
| UPSERT onConflict: 'user_id,log_date' | confirmed (test) |
| invalidates ['symptom-log', date] | confirmed (test) |
| Form reset on date change | confirmed (useEffect on savedLog + isFetching) |
| Save disabled when all values = 0 | confirmed (hasChanges guard) |
| lowerBetter label changes | confirmed (VALUE_LABELS lookup) |

## Self-Check: PASSED
