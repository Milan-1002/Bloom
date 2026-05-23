---
phase: 06-doctor-ready-reports
plan: "02"
subsystem: report-ui
tags: [report, recharts, ui, composedchart, homescreen, typescript]
dependency_graph:
  requires:
    - "06-01 (report-stats.ts pure functions, useReportData hook, recharts installed)"
  provides:
    - "src/components/report/GLSymptomChart.tsx — Recharts ComposedChart: GL Line + symptom Scatter + red-flag ReferenceAreas"
    - "src/screens/report/ReportScreen.tsx — full report screen: window picker, stat cards, chart, red-flag callout, meal patterns"
    - "src/screens/home/HomeScreen.tsx — updated with ReportCTACard after WeightCard"
  affects:
    - "src/screens/home/HomeScreen.tsx — ReportCTACard addition"
tech_stack:
  added: []
  patterns:
    - "Recharts ComposedChart with dual y-axes (GL left, symptom score right)"
    - "Custom Recharts shape prop for per-dot color based on symptom score value"
    - "useRef<HTMLDivElement> forwarded on chart wrapper div — consumed by Plan 03 html2canvas"
    - "computeReportStats called inline in component from Plan 01 pure-function module"
key_files:
  created:
    - src/components/report/GLSymptomChart.tsx
  modified:
    - src/screens/report/ReportScreen.tsx
    - src/screens/home/HomeScreen.tsx
decisions:
  - "ReportStats type import removed from ReportScreen (unused at type level — stats is inferred from computeReportStats return)"
  - "cycleLengthDays null case renders StatCard with value='—' rather than omitting the grid cell (keeps 2x2 grid symmetric)"
  - "MealPatternsCard slot distribution bar uses style prop on plain <div> (not a src/components/ui/ component — CLAUDE.md Rule 8 applies only to ui/ components)"
metrics:
  duration: "~20 minutes"
  completed: "2026-05-23"
  tasks_completed: 3
  files_created: 1
  files_modified: 2
---

# Phase 6 Plan 02: Report Screen UI Summary

Full report screen UI on top of Plan 01 data foundation: GLSymptomChart (Recharts ComposedChart), ReportScreen (window picker, 2×2 stat cards, chart, red-flag callout, meal patterns), and HomeScreen CTA button.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create GLSymptomChart.tsx | 4d24cc1 | src/components/report/GLSymptomChart.tsx |
| 2 | Build full ReportScreen.tsx | 34ae2a3 | src/screens/report/ReportScreen.tsx |
| 3 | Add View Health Report CTA to HomeScreen | 5bf0174 | src/screens/home/HomeScreen.tsx |

## What Was Built

### src/components/report/GLSymptomChart.tsx

Recharts `ComposedChart` wrapper:
- `Line` series for daily GL on left y-axis, `--b-fiber` (teal) stroke
- `Scatter` series for composite symptom score on right y-axis (1–5 domain), custom `SymptomDot` shape
- `SymptomDot`: `--b-coral` fill when score < 3, `--b-mint` fill when score >= 3
- `ReferenceArea` for each `RedFlagStreak` — `--b-coral` at 15% opacity
- `computeXTicks` helper: 7-day ticks for 30d window, 14-day for 60d, 30-day for 90d
- `ChartTooltip` with date label, GL value, and symptom score
- Inline legend row below chart (no `style` props, no hex values)

### src/screens/report/ReportScreen.tsx

Full report screen replacing the Plan 01 spinner placeholder:
- `AppBar` with back navigation (`navigate(-1)`) and share button (wired in Plan 03)
- Window picker: 30d/60d/90d toggle buttons using `bg-b-primary` active state
- `useReportData(windowDays)` for data fetching, `computeReportStats(rawData)` for aggregation
- `LoadingSkeleton`: 3 animated pulse placeholders while loading
- `EmptyState`: card with 📊 icon when `hasEnoughData = false` (< 7 days of food logs)
- `StatCard` sub-component: 2×2 grid (Avg Daily GL, Avg Fiber, Weight Change, Cycle Length)
  - Weight Change shows `'—'` when `weightChange` is null
  - Cycle Length shows `'—'` when `cycleLengthDays` is null (keeps grid symmetric)
  - Trend indicators colored via `trendColor()` (mint = good, coral = bad, ink-3 = neutral)
- `GLSymptomChart` wrapped in a `<div ref={chartRef}>` for Plan 03 html2canvas
- `RedFlagCard`: coral-soft background, ⚠️ icon, list of streak periods with overage %
- `MealPatternsCard`: eating window, first/last meal times, fasting window, slot distribution bar

### src/screens/home/HomeScreen.tsx

`ReportCTACard` sub-component added before closing tags of the scrollable body:
- Own `useNavigate()` call — no changes to `HomeScreen` component's hooks
- Secondary styling: `rounded-b-lg border border-b-hairline bg-b-surface-2`
- Chevron-right SVG indicates navigation affordance
- Calls `navigate('/report')` on click

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

- `ReportScreen.tsx` ShareIcon `onClick` handler is a no-op `() => { /* wired in Plan 03 */ }`. This is intentional: Plan 03 wires the html2canvas + PDF export flow into this button. The button renders and is accessible; it simply has no action yet.

## Threat Surface Scan

No new security surface. All data rendering comes from `useReportData` which uses the Supabase singleton with RLS (already covered by T-06-01 in the plan's threat model). The `chartRef` div is a local DOM ref with no external exposure (T-06-05: accepted). The `/report` route remains inside `RequireProfile` (T-06-06: accepted).

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| src/components/report/GLSymptomChart.tsx exists | FOUND |
| src/screens/report/ReportScreen.tsx (full implementation) | FOUND |
| src/screens/home/HomeScreen.tsx has ReportCTACard | FOUND |
| Commit 4d24cc1 (GLSymptomChart) | FOUND |
| Commit 34ae2a3 (ReportScreen full) | FOUND |
| Commit 5bf0174 (HomeScreen CTA) | FOUND |
| npx tsc --noEmit | 0 errors |
| GLSymptomChart imported in ReportScreen | FOUND (line 5) |
| navigate('/report') in HomeScreen | FOUND (line 360) |
| chartRef useRef + wrapping div in ReportScreen | FOUND (lines 262, 379) |
