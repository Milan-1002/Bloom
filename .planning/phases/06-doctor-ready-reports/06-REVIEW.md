---
phase: 06-doctor-ready-reports
reviewed: 2026-05-23T00:00:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - package.json
  - src/App.tsx
  - src/components/report/GLSymptomChart.tsx
  - src/hooks/useReportData.ts
  - src/lib/report-pdf.tsx
  - src/lib/report-stats.ts
  - src/screens/home/HomeScreen.tsx
  - src/screens/report/ReportScreen.tsx
findings:
  critical: 2
  warning: 4
  info: 3
  total: 9
status: issues_found
---

# Phase 06: Code Review Report

**Reviewed:** 2026-05-23T00:00:00Z
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

This phase introduces the Doctor-Ready Report feature: a `ReportScreen` with a GL/symptom chart, red-flag streak detection, meal timing stats, and PDF export via `@react-pdf/renderer` + `html2canvas`. The report data hook, pure stat aggregation library, chart component, and PDF document component were all reviewed.

Two blockers were found: (1) the red-flag streak detector does not verify calendar adjacency, so non-consecutive logged days can silently be collapsed into a single "streak" producing medically misleading output; (2) GL and fiber daily totals are keyed on UTC date slices from `timestamptz` strings rather than local date, causing cross-midnight misattribution for non-UTC users — the same log can appear on the wrong day in the report. Four warnings cover unordered values passed to the trend function, an `@types/html2canvas` version mismatch that can cause silent type errors, a missing `cravings` field in the `HomeScreen` symptom display, and an eating-window calculation that is arithmetically wrong. Three info-level items round out the review.

---

## Critical Issues

### CR-01: Red-flag streak detector treats non-consecutive logged days as consecutive

**File:** `src/lib/report-stats.ts:196–239`

**Issue:** `detectRedFlagStreaks` iterates `Object.keys(dailyGL).sort()` — the set of dates on which at least one food entry was logged. It increments the streak counter for every consecutive entry in that sorted list without checking whether the two adjacent dates are actually adjacent calendar days. If a user logs high-GL food on Mon, skips Tue (no food logged), and logs high-GL food again Wed–Sun, the function will produce a single 6-day "streak" spanning Mon–Sun instead of recognising the gap.

The comment at line 188 states the requirement is "5+ **consecutive calendar days**". The implementation does not enforce calendar adjacency.

This produces a medically actionable artefact (the red-flag streak card and PDF "High GL Periods" section) that misrepresents the user's data to a physician.

**Fix:** Check that the current date is exactly 1 calendar day after the previous date before extending the streak; break the streak when the gap is > 1 day.

```typescript
// Inside the loop, before the threshold check:
if (streakEnd !== null) {
  const prev = new Date(streakEnd + 'T12:00:00')
  const curr = new Date(dateStr + 'T12:00:00')
  const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86_400_000)
  if (diffDays > 1) closeStreak()
}
```

---

### CR-02: UTC date slice misattributes GL and fiber to wrong local day

**File:** `src/lib/report-stats.ts:109, 123, 252`

**Issue:** `computeDailyGL`, `computeDailyFiber`, and `computeMealTimingStats` all extract a date from `log.logged_at` using `log.logged_at.slice(0, 10)`. The `logged_at` column is a `timestamptz` returned by Supabase as a UTC ISO string (e.g. `"2024-05-22T23:30:00.000Z"`). For a user in UTC+1, that timestamp is `00:30` on May 23 local time. `slice(0, 10)` returns `"2024-05-22"` — the previous day — so the food entry is attributed to the wrong daily bucket.

This means daily GL totals, daily fiber totals, and meal-timing statistics can all be misattributed for any user not running in UTC. The GL trend line in the chart, all streak detection, and the PDF stats will show incorrect per-day values.

`computeMealTimingStats` already converts to local hours via `new Date(log.logged_at).getHours()` for the hour calculation, but then groups by the UTC date. This is an internal inconsistency in the same function.

**Fix:** Use the local date extracted via `new Date(log.logged_at)` to be consistent with the hour extraction already used in `computeMealTimingStats`:

```typescript
// Replace:
const dateStr = log.logged_at.slice(0, 10)

// With a local-date extraction:
function loggedAtToLocalDate(logged_at: string): string {
  const d = new Date(logged_at)
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}
```

Use `loggedAtToLocalDate(log.logged_at)` in all three call sites (lines 109, 123, 252).

---

## Warnings

### WR-01: `computeTrend` receives unordered `Object.values()` for GL and fiber

**File:** `src/lib/report-stats.ts:364–365`

**Issue:** `computeTrend` requires chronologically ordered values to compare first-half average vs second-half average and compute a meaningful trend direction. At lines 364–365, it is called with `Object.values(dailyGL)` and `Object.values(dailyFiber)`. Both maps are built by iterating `input.foodLogs` which is ordered by `logged_at ASC` per the query in `useReportData.ts`. However, `Object.values()` on a plain object preserves insertion order only as a side effect of V8's string-key ordering behaviour, and `dailyGL` is keyed by date strings (which happen to sort lexicographically in chronological order).

This works in practice today, but it creates a subtle implicit dependency: if food logs ever arrive unordered, or the accumulation loop is changed, the trend arrows will silently invert or become meaningless. The weight trend (line 366–370) already does this correctly by sorting explicitly before mapping.

**Fix:** Sort the daily map keys before extracting values:

```typescript
const glTrend = computeTrend(
  Object.keys(dailyGL).sort().map((d) => dailyGL[d])
)
const fiberTrend = computeTrend(
  Object.keys(dailyFiber).sort().map((d) => dailyFiber[d])
)
```

---

### WR-02: `@types/html2canvas` version is stale and mismatches runtime package

**File:** `package.json:39`

**Issue:** `html2canvas` runtime is `^1.4.1` but `@types/html2canvas` is pinned to `^0.5.35`. The types package at `0.5.x` describes an older API surface. The mismatch means the dynamic import `(await import('html2canvas')).default` in `ReportScreen.tsx:284` is checked against incorrect type signatures. Any new option or breaking change between the two versions is silently untyped. Specifically, the `html2canvas(element, options)` call at line 285 may accept/reject options differently than the stale types describe.

**Fix:** Remove `@types/html2canvas` from `devDependencies`. `html2canvas` 1.x ships its own bundled TypeScript declarations; the `@types/` package is not needed and actively causes confusion.

```json
// Remove from devDependencies:
"@types/html2canvas": "^0.5.35"
```

---

### WR-03: `SymptomSummaryCard` omits `cravings` field that exists on the log

**File:** `src/screens/home/HomeScreen.tsx:244–250`

**Issue:** The `symptoms` array in `SymptomSummaryCard` lists five fields: `energy`, `mood`, `sleep`, `bloating`, `skin`. The `SymptomLog` type (from `database.types.ts`) and the `SymptomsScreen` both include `cravings` as a sixth tracked field. The `SYMPTOM_COLORS` map at line 191 also omits `cravings`.

Consequence: a user who logged a cravings score will see it in the `SymptomsScreen` form but not in the `HomeScreen` summary card. The data silently disappears from the most-visible view. If `key` from the `symptoms` array is ever expanded to include `cravings`, `SYMPTOM_COLORS[key]` will return `undefined`, and `DotBar` will render with `color={undefined}`, which collapses to an empty style attribute (not a crash, but a visual defect).

**Fix:** Add `cravings` to both `SYMPTOM_COLORS` and the `symptoms` array, updating the grid to `grid-cols-6`:

```typescript
const SYMPTOM_COLORS: Record<string, string> = {
  energy: 'var(--b-mint)',
  mood: 'var(--b-accent)',
  sleep: 'var(--b-primary)',
  bloating: 'var(--b-coral)',
  skin: 'var(--b-amber)',
  cravings: 'var(--b-berry)',  // matches SymptomsScreen color
}

const symptoms: Array<{ key: keyof SymptomLog; label: string }> = [
  { key: 'energy', label: 'Energy' },
  { key: 'mood', label: 'Mood' },
  { key: 'sleep', label: 'Sleep' },
  { key: 'bloating', label: 'Bloating' },
  { key: 'skin', label: 'Skin' },
  { key: 'cravings', label: 'Cravings' },
]
// and change grid-cols-5 to grid-cols-6 at line 266
```

---

### WR-04: Eating-window formula is arithmetically wrong in `MealPatternsCard`

**File:** `src/screens/report/ReportScreen.tsx:189–193`

**Issue:** `MealTimingStats.avgFastingWindowHours` is defined as `24 − (avgLastMealHour − avgFirstMealHour)` (the hours between last meal and next day's first meal, i.e. the overnight fast). The eating window is the complement: `avgLastMealHour − avgFirstMealHour`.

However `MealPatternsCard` at line 189 displays "Avg eating window" as `formatHours(24 - mealTiming.avgFastingWindowHours)`. Substituting: `24 - (24 - (avgLast - avgFirst)) = avgLast - avgFirst`. This is mathematically correct, but it is computed by double-negating `avgFastingWindowHours`. The field `avgFastingWindowHours` already encodes `24 - eatingWindow`, so the display expression `24 - avgFastingWindowHours` is the round-trip inverse. While the arithmetic resolves correctly, the same double-negation also appears in `report-pdf.tsx` at line 220: `fmtHours(24 - stats.mealTiming.avgFastingWindowHours)`.

There is also a genuine display bug: if `avgFirstMealHour > avgLastMealHour` (which cannot happen given the min/max logic, but also) if the fasting window exceeds 24 hours due to floating-point accumulation, `24 - avgFastingWindowHours` can go negative. `formatHours` does not guard against a negative input; `Math.floor(-0.5)` = `-1`, producing `-1h 30m` in the UI.

**Fix:** Store the eating window directly in `MealTimingStats` and use it directly, or guard against negative values in `formatHours`:

```typescript
// In report-stats.ts MealTimingStats:
avgEatingWindowHours: number  // avgLastMealHour − avgFirstMealHour

// In computeMealTimingStats:
const avgEatingWindowHours = Math.round((avgLastMealHour - avgFirstMealHour) * 100) / 100

// In ReportScreen.tsx and report-pdf.tsx:
formatHours(mealTiming.avgEatingWindowHours)
```

Alternatively, add a guard to `formatHours`:
```typescript
function formatHours(hours: number): string {
  if (hours <= 0) return '0h'
  // ...
}
```

---

## Info

### IN-01: `ReportRawData` interface is a redundant re-declaration

**File:** `src/hooks/useReportData.ts:12`

**Issue:** `export interface ReportRawData extends ReportInput {}` is an empty interface that adds no members and carries no semantic distinction from `ReportInput`. It is exported but never imported elsewhere (the hook itself types its return as `useQuery<ReportInput>`).

**Fix:** Remove `ReportRawData`. Consumers should import `ReportInput` directly from `@/lib/report-stats` as needed.

---

### IN-02: `trendIcon` function is a trivial identity — remove it

**File:** `src/screens/report/ReportScreen.tsx:74–76`

**Issue:**
```typescript
function trendIcon(trend: '▲' | '▼' | '→'): string {
  return trend
}
```
This is a no-op wrapper. It adds indirection with no transformation. The call site at line 120 is `{trendIcon(trend)} vs earlier`, which is equivalent to `{trend} vs earlier`.

**Fix:** Delete `trendIcon` and use `{trend}` directly at line 120.

---

### IN-03: `console.error` left in production export path

**File:** `src/screens/report/ReportScreen.tsx:329`

**Issue:** `console.error('[ReportScreen] PDF export failed:', err)` is inside the catch block of the export handler. This is debug output that will appear in production consoles. While it is in a catch block (so it reports genuine failures), it is not surfaced to the user — the error is swallowed and the user receives no feedback that their PDF export failed.

**Fix:** Show an error toast or inline error state when the export fails, and remove the raw `console.error`. At minimum, add user-facing feedback:

```typescript
} catch (err) {
  // Replace console.error with user-visible feedback
  // e.g. set a local error state and display a toast or inline message
  setExportError(true)  // new state: boolean
}
```

---

_Reviewed: 2026-05-23T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
