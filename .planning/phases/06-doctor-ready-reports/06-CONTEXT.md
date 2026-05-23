# Phase 6: Doctor-Ready Reports - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 6 delivers a read-only analytics report screen the user can generate and export to share with their doctor. It compiles data from food_logs, symptom_logs, weight_logs, and cycle data across a selectable 30/60/90-day window.

**Delivered in this phase:**
- **Report entry point:** A "Generate Report" CTA button on the Home screen (bottom of scroll) that pushes a new `/report` full-screen route
- **Data aggregation layer:** Pure query functions computing 30/60/90-day averages for GL, fiber, weight, and cycle length; composite symptom score (avg of all tracked symptoms); meal timing stats (first meal, last meal, fasting window from `food_logs.logged_at`); red-flag streak detection (5+ consecutive days where daily avg GL exceeds target by ≥20%)
- **Report screen UI:** Time-window segmented control (30d · 60d · 90d, default 30d); executive summary stat cards; Recharts ComposedChart (GL Line + composite symptom Scatter dots, shared date x-axis); coral-shaded x-axis regions for red-flag streaks + callout card listing streak dates/avg overage; meal pattern highlights card; red-flag summary
- **PDF export:** `react-pdf/renderer` for document structure; `html2canvas` used to capture the chart element as a PNG image embedded in the PDF; remaining sections (summary stats, meal patterns, red flags) rendered as react-pdf tables/text — searchable and clean

**What Phase 6 does NOT deliver:** Coach access to reports (v2), AI-generated narrative interpretation of the report (v2 — this phase uses static descriptions), email delivery (v2), scheduled/automated report generation, real-time sync or webhooks, push notification when report is ready.

</domain>

<decisions>
## Implementation Decisions

### Navigation & Entry Point
- **D-01: Home screen CTA → /report push route** — A "Generate Report" button on the Today Home screen opens the full report as a separate route (`/report`). The route is pushed onto the react-router stack with standard header back navigation. No tab bar change needed.
- **D-02: CTA placement is Claude's discretion** — The user delegated exact placement within the Home screen scroll. Place it after the weight card at the bottom of the scroll — below the daily tracking content, above any existing footer. It should use a secondary (ghost/outline) Btn style so it doesn't compete with the daily "Log meal" CTA.

### Time Window
- **D-03: Segmented control, default 30 days** — The Report screen opens with a 30-day window by default. A segmented control at the top (`30d · 60d · 90d`) re-queries and re-renders all report sections when switched. The control sticks below the AppBar header.
- **D-04: Window persists for the session** — Selected window is local component state (not persisted to DB or localStorage). Re-opening the Report resets to 30d default.

### GL + Symptom Timeline Chart
- **D-05: Recharts ComposedChart — GL Line + composite symptom Scatter** — A single `ComposedChart` with:
  - `Line` series: daily average GL (y-left axis)
  - `Scatter` series: composite symptom score per day (y-right axis, 1–5 scale)
  - Composite symptom score = average of all logged symptom values that day (energy, mood, sleep, bloating, skin, cravings) — days with no symptom log are rendered as a gap (no dot)
  - Shared x-axis: date labels (weekly ticks for 30d, bi-weekly for 60/90d)
- **D-06: GL line color** — Use `--b-fiber` (teal) for the GL line to match the existing GL metric color used in the dashboard rings. Symptom dots use `--b-berry` (cycle/menstrual color — works semantically as a health indicator).
- **D-07: Red-flag streak shading** — For each detected red-flag streak, add a `ReferenceArea` in the ComposedChart covering that date range, filled with `var(--b-coral)` at 15% opacity. Below the chart, a "Red Flag Periods" callout card lists each streak: dates, number of consecutive days, and average GL overage (%).
- **D-08: Red-flag detection logic** — A streak is 5+ consecutive calendar days where `dailyAvgGL > aiTarget.gl_ceiling × 1.20`. When no AI target exists for a given period, fall back to the static GL target from `STATIC_TARGETS` in `src/lib/targets.ts`. Streak detection runs client-side on the aggregated daily GL data.

### Executive Summary Stats
- **D-09: Summary cards at top of report** — Before the chart, show a horizontal scroll of stat cards (or 2-column grid on wider layouts): Avg Daily GL, Avg Fiber, Weight Change, Avg Cycle Length (if cycle data exists). Each card shows: value, label, and a small trend indicator (▲/▼ vs prior period, calculated by comparing first half vs second half of the window).

### Meal Pattern Highlights
- **D-10: Fasting window from logged_at timestamps** — `food_logs.logged_at` is a full `timestamptz`. Compute avg first meal time and avg last meal time from the window. Avg fasting window = `24h − (avg last meal time − avg first meal time)`. Show as a simple card: "Avg eating window: 10h 30m | Avg first meal: 8:15am | Avg last meal: 6:45pm".
- **D-11: Meal slot distribution** — A simple horizontal bar (or Recharts BarChart) showing % of log entries in each slot (Breakfast / Lunch / Dinner / Snack) across the window.

### PDF Export
- **D-12: react-pdf/renderer for document structure** — The PDF is built as a React tree using `@react-pdf/renderer` components (`Document`, `Page`, `View`, `Text`, `Image`). Installed as a prod dependency.
- **D-13: Chart captured as PNG via html2canvas** — Before generating the PDF, `html2canvas` captures the rendered Recharts ComposedChart DOM element to a PNG data URL. This image is embedded in the PDF using `react-pdf`'s `<Image>` component. The chart capture is triggered on the report screen (chart must be rendered before export is triggered).
- **D-14: Export button placement** — A prominent "Export PDF" button in the AppBar/header of the Report screen (top right, using `IconBtn` with a share/download icon). On tap: (1) show a brief "Generating…" state, (2) capture chart PNG, (3) generate PDF blob, (4) trigger download or native share sheet depending on platform.
- **D-15: PDF filename** — `bloom-report-{window}d-{YYYY-MM-DD}.pdf` (e.g., `bloom-report-30d-2026-05-23.pdf`).

### Claude's Discretion
- Exact CTA wording on the Home screen button (e.g., "View Health Report", "Generate Doctor Report", "Create Report")
- Exact Report screen AppBar title (e.g., "Health Report", "Doctor Report")
- Whether the executive summary uses a horizontal scroll of cards or a 2×2 grid (based on what fits the 390px phone width better)
- Exact error/empty state messaging when there's insufficient data for the selected window (< 7 days of logs)
- Color treatment for the symptom Scatter dots when composite score is below 3 (poor) vs above 3 (good) — consider using `--b-coral` for low scores, `--b-mint` for high scores

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Schema (data sources for aggregation)
- `supabase/migrations/20260518000001_init.sql` — `food_logs` table (esp. `logged_at timestamptz`, `gl`, `meal_slot`, `fiber_g`), `weight_logs`, `symptom_logs` schema
- `supabase/migrations/20260520000001_phase5_cycle_columns.sql` — `cycle_phase` column in `ai_daily_targets`, cycle columns in `profiles`
- `supabase/migrations/20260518000002_ai_targets_insulin_score.sql` — `ai_daily_targets` structure (for GL ceiling targets used in red-flag detection)

### Existing hooks and lib (extend, don't duplicate)
- `src/hooks/useFoodLogs.ts` — How food logs are fetched; extend or compose for the 30/60/90d window queries
- `src/hooks/useWeightLogs.ts` — Weight log fetch pattern
- `src/hooks/useSymptomLog.ts` — Symptom log fetch pattern
- `src/hooks/useAITargets.ts` — GL ceiling targets (needed for red-flag threshold calculation)
- `src/lib/targets.ts` — `STATIC_TARGETS` fallback when no AI target exists for a period
- `src/lib/rolling-average.ts` — Existing rolling average utility; check for reuse in GL trend calculations
- `src/lib/cycle.ts` — `getCyclePhase` function; cycle length data may be needed for avg cycle length stat

### Screens and components to reference
- `src/screens/home/HomeScreen.tsx` — Where the "Generate Report" CTA is added (read before modifying)
- `src/components/home/LutealTipCard.tsx` — Example of a conditional card in the Home screen (similar pattern for the Report CTA card)
- `src/components/ui/` (all UI components) — Reuse `Card`, `Btn`, `IconBtn`, `Chip`, `AppBar`, `Progress`, `Sparkline` before creating new components
- `src/lib/supabase.ts` — Singleton client (never import `createClient` anywhere else)

### Design system
- `bloom-app-design/project/tokens.css` — All `--b-*` tokens; use `--b-coral` for red flags, `--b-berry` for symptom data, `--b-fiber` (teal) for GL line, `--b-mint` for positive indicators
- `bloom-app-design/project/components/Bits.jsx` — Reference for Card, Chip, Btn, Progress component patterns to match visual style
- `bloom-app-design/project/screens/Home.jsx` — Home screen layout (where CTA is added)

### Prior phase decisions (must not contradict)
- `.planning/phases/05-cycle-synced-targets/05-CONTEXT.md` — D-15: cravings is now a tracked symptom dimension; must be included in composite symptom score calculation
- `.planning/phases/04-ai-targets/04-CONTEXT.md` — D-05: adequacy framing (no red states for eating under target); D-09: PROMPT_VERSION strategy
- `CLAUDE.md` — Rule 4 (GL displays as "—" when unknown), Rule 5 (7-day rolling average for weight), Rule 6 (adequacy not deficit framing), Rule 8 (AI targets cache)

### Requirements
- `.planning/REQUIREMENTS.md` — RPT-01 through RPT-05 (all five must be covered)

### Libraries to install
- `@react-pdf/renderer` — PDF generation (prod dependency)
- `html2canvas` — Chart-to-PNG capture (prod dependency)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/rolling-average.ts` — May be reusable for GL/fiber rolling calculations; check before writing new aggregation logic
- `src/hooks/useFoodLogs.ts` — Existing query pattern for food log data; new report hooks should follow the same TanStack Query (`useQuery`) shape
- `src/components/ui/Card.tsx` — Reuse for all summary stat cards and section cards in the report
- `src/components/ui/Btn.tsx` and `IconBtn.tsx` — Export PDF button and Home screen CTA
- `src/components/ui/Sparkline.tsx` — Reference implementation of a Recharts SVG chart; `ComposedChart` follows the same import/wrapper pattern
- `src/lib/dates.ts` — Likely contains date utility functions useful for window boundary calculations and x-axis label formatting

### Established Patterns
- **TanStack Query for all data fetching** — New hooks (`useReportData`, `useAggregatedStats`) must use `useQuery` from `@tanstack/react-query`. Never fetch directly in component body.
- **Pure utility functions in `src/lib/`** — All aggregation logic (GL average, streak detection, meal timing, composite symptom score) belongs in `src/lib/report-stats.ts` as pure functions. Testable in isolation.
- **`className` only on UI components** — No `style` prop on any `src/components/ui/` component (CLAUDE.md Rule 8). Use Tailwind utility classes or `clsx`.
- **No hex values in component code** — Always `var(--b-*)` or the Tailwind class equivalent.
- **Supabase client singleton** — All DB queries go through `src/lib/supabase.ts`. Never call `createClient` elsewhere.

### Integration Points
- `src/App.tsx` (or router file) → add `/report` route pointing to new `ReportScreen`
- `src/screens/home/HomeScreen.tsx` → add "Generate Report" CTA at bottom of scroll
- New files needed:
  - `src/screens/report/ReportScreen.tsx` — main report page component
  - `src/lib/report-stats.ts` — pure aggregation functions (GL avg, streak detection, meal timing, composite symptom score)
  - `src/hooks/useReportData.ts` — TanStack Query hook composing food_logs + weight_logs + symptom_logs + ai_daily_targets for the selected window
  - `src/components/report/GLSymptomChart.tsx` — Recharts ComposedChart wrapper
  - `src/lib/report-pdf.tsx` — react-pdf Document component (separate from the screen component)

</code_context>

<specifics>
## Specific Ideas

- The report should open with a brief "loading" skeleton state while data is aggregated — use the same skeleton pattern if one exists in the codebase, otherwise a simple spinner
- For the chart x-axis: 30d → weekly date labels (4-5 ticks), 60d → bi-weekly (4-5 ticks), 90d → monthly (3 ticks). Keep it readable on a 390px phone screen.
- The "Export PDF" flow: show a brief toast or inline loading indicator ("Generating report…") while html2canvas + react-pdf runs. The PDF download should use a `<a href={blobUrl} download={filename}>` programmatically triggered, or `navigator.share()` on iOS if the Share API is available.
- Empty state: if the user has fewer than 7 days of food logs in the selected window, show an empty state card ("Not enough data for a 30-day report — keep logging for at least 7 days") instead of the summary/chart. Don't show a broken chart.
- The callout card for red-flag streaks should use `--b-coral-soft` background with a ⚠️ or flag icon, and list each streak like: "Jan 15–22 (8 days) — GL averaged 42% above target"

</specifics>

<deferred>
## Deferred Ideas

- AI-generated narrative interpretation of the report (e.g., Claude writes a 3-paragraph summary of the report data) — v2; would require a new Edge Function and adds latency to report generation
- Email delivery of the PDF (send to user's email or doctor's email) — v2; requires email service integration
- Scheduled/automated report generation (auto-generate monthly) — v2; requires background jobs
- Coach read access to patient reports — v2 (coach portal is out of scope for v1)
- Per-symptom trend lines in the chart (separate lines for energy, mood, etc.) — complexity too high for v1; composite score is sufficient
- Cycle phase overlay on the GL chart (colored bands per menstrual phase) — interesting but adds visual complexity; consider in v2
- Comparing reports across windows on same screen (side-by-side 30d vs 90d) — out of scope; segmented control is the simpler approach

</deferred>

---

*Phase: 6-Doctor-Ready-Reports*
*Context gathered: 2026-05-23*
