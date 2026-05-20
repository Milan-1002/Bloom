# Phase 5: Cycle-Synced Nutrition Targets - Context

**Gathered:** 2026-05-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 5 delivers cycle-aware target generation:
- **Schema additions:** `last_period_date date`, `cycle_length_days integer` on `profiles`; `cravings smallint` on `symptom_logs`; `cycle_phase text` on `ai_daily_targets`
- **Cycle engine:** Pure client-side `getCyclePhase(lastPeriodDate, cycleLength)` function returning one of: `menstrual | follicular | ovulation | luteal`
- **Cycle data entry UI:** "My Cycle" section in Profile settings — date picker for last period + day-stepper for cycle length (21–45, default 28)
- **Extended `generate-targets` Edge Function:** passes `current_cycle_phase` and `cycle_day` to Claude; system prompt includes per-phase macro guidance
- **Phase-aware cache invalidation:** `useAITargets` hook regenerates targets when computed cycle phase ≠ `ai_daily_targets.cycle_phase` (in addition to existing profile-change invalidation)
- **Phase chip on dashboard:** Non-intrusive pill showing current phase + day (e.g., "Luteal · Day 21") with an info tap to read a plain-language explanation
- **Luteal phase tip card:** Conditional dashboard card (Luteal phase only) with 3 static low-GL comfort food swaps + "Explore recipes" CTA linking to Recipes screen with Luteal filter pre-applied
- **Cravings symptom dimension:** `cravings smallint` (1–5) added to `symptom_logs`; Symptoms screen gains a "Cravings" row; correlation analysis deferred to Phase 6

**What Phase 5 does NOT deliver:** Cycle prediction / irregular cycle AI, correlation timeline/chart (Phase 6), coach-visible cycle data (v2), Apple Health integration (v2).

</domain>

<decisions>
## Implementation Decisions

### Cycle Data Entry
- **D-01: Profile settings, not onboarding** — Cycle data is dynamic (changes monthly); onboarding stays 4 steps. Add a "My Cycle" card to the Profile settings screen with: (a) a date picker for `last_period_date`, (b) a numeric stepper for `cycle_length_days` (range 21–45, default 28), and (c) a `period_length_days` stepper (range 3–8, default 5).
- **D-02: Updating period date triggers target regeneration** — Updating `last_period_date` or `cycle_length_days` updates `profiles.updated_at`, which the `useAITargets` hook already uses as a stale signal. No additional invalidation logic needed for profile-change path.
- **D-03: PCOS and irregular cycles** — Do not try to predict cycles. User sets their "typical" length. The app computes phase from (today − last_period_date) mod cycle_length_days. If `last_period_date` is null, cycle phase features are hidden gracefully (no error states, no forced entry).

### Cycle Phase Engine
- **D-04: Client-side pure function** — `getCyclePhase(lastPeriodDate: Date, cycleLengthDays: number): CyclePhase | null` lives in `src/lib/cycle.ts`. Returns `null` when lastPeriodDate is null. No server-side cron or background job.
- **D-05: Phase boundaries (28-day base, scale for other lengths)** —
  - Menstrual: days 1–5
  - Follicular: days 6 through (cycleLength × 0.46) rounded
  - Ovulation: (cycleLength × 0.46) + 1 through (cycleLength × 0.54) rounded
  - Luteal: (cycleLength × 0.54) + 1 through cycleLength
  These boundaries are evidence-based (Thiyagarajan et al., 2022) and scale proportionally for cycle lengths 21–45.
- **D-06: Phase-change cache invalidation** — The `useAITargets` hook computes current phase client-side and compares it against `ai_daily_targets.cycle_phase` (new column). If they differ AND `last_period_date` is set, trigger target regeneration. This catches automatic phase transitions without any user action.

### AI Target Adjustments per Phase
- **D-07: Claude receives cycle_phase + cycle_day in prompt** — `buildUserPrompt` in `generate-targets` gains two new lines: `Cycle phase: luteal (day 21 of 28)`. The system prompt gains per-phase macro guidance:
  - **Luteal:** Lower GL ceiling (−10–15 from baseline), higher protein floor (+ 10g), mention progesterone-driven insulin resistance
  - **Follicular:** Slightly higher carb flexibility (GL ceiling + 10), note improving insulin sensitivity
  - **Ovulation:** Near-baseline; note peak energy and estrogen support
  - **Menstrual:** Moderate GL, emphasize iron-rich foods (lean protein), note prostaglandin influence on energy
- **D-08: Store cycle_phase in ai_daily_targets** — New `cycle_phase text` column (nullable) stores the phase used when generating targets. Used by the cache staleness check (D-06). No migration to existing rows needed (null is valid for pre-Phase-5 rows).
- **D-09: prompt_version bump** — Increment `PROMPT_VERSION` from 1 → 2 in `generate-targets` when the cycle-aware system prompt is deployed. Stale rows (version 1) trigger regeneration on first load.

### Dashboard Phase UI
- **D-10: Phase chip placement** — A small pill badge below the date header on the Today dashboard. Text: `{Phase Name} · Day {N}`. Tap opens a bottom sheet with a 3–4 sentence plain-language explanation of what this phase means for insulin sensitivity and energy. Hidden when `last_period_date` is null.
- **D-11: Luteal phase tip card** — A conditionally-rendered card on the dashboard (below macro rings, above meal log) that appears ONLY during Luteal phase. Contains:
  - Heading: "Luteal phase cravings incoming"
  - 3 static low-GL comfort food swaps (hardcoded, not AI-generated — fast and reliable)
  - "Explore PCOS-friendly recipes →" CTA → navigates to Recipes screen with `?phase=luteal` query param that pre-applies a Luteal-friendly filter
- **D-12: Phase explanations are static copy** — Per-phase educational text (the bottom sheet content and tip card) is hardcoded English strings in `src/lib/cycleContent.ts`. Not AI-generated — keeps it consistent and free.

### Cravings Symptom Tracking
- **D-13: Add `cravings` column to `symptom_logs`** — `cravings smallint check (cravings between 1 and 5)`, nullable (existing rows unaffected). Migrations file follows the existing pattern.
- **D-14: Symptoms screen gains a Cravings row** — Same 1–5 slider UI as the existing energy/mood/sleep/bloating/skin rows. Label: "Cravings". No visual differentiation from other symptoms in Phase 5.
- **D-15: Correlation analysis deferred** — Cross-referencing cravings intensity with cycle phase and GL intake belongs in Phase 6 (Doctor-Ready Reports). Phase 5 only captures the data.

### Claude's Discretion
- All decisions above are Claude's choices. The user delegated all four gray areas ("you decide wherever is best").
- The exact wording of the 3 Luteal comfort food swaps in D-11 is Claude's choice during implementation.
- The exact wording of per-phase bottom sheet copy in D-12 is Claude's choice during implementation.
- The exact GL ceiling/floor delta numbers in D-07 are Claude's choice within the stated ranges.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Schema (read before writing migrations)
- `supabase/migrations/20260518000001_init.sql` — `profiles` table (columns to extend with cycle fields), `symptom_logs` table (columns to extend with cravings)
- `supabase/migrations/20260518000002_ai_targets_insulin_score.sql` — `ai_daily_targets` schema (add `cycle_phase text` column)

### Edge Function (extend, don't replace)
- `supabase/functions/generate-targets/index.ts` — Complete current function. Extend `ProfileRow` type and `buildUserPrompt` to include cycle data. Bump `PROMPT_VERSION` to 2.

### Existing hooks and patterns to follow
- `src/hooks/useAITargets.ts` — Cache invalidation logic. Add phase-drift check: if `computedPhase !== storedTargets.cycle_phase` → regenerate.
- `src/hooks/useProfile.ts` — How profile data is fetched. Cycle fields (`last_period_date`, `cycle_length_days`) are part of the profiles row, so this hook needs updating.
- `src/hooks/useSymptomLog.ts` + `useUpsertSymptomLog.ts` — Pattern for symptom data. The `cravings` field follows the same pattern as `energy`, `mood`, etc.

### Screens to modify
- `src/screens/profile/` — Where to add the "My Cycle" section. Read existing profile screen before planning.
- `src/screens/home/` — Where to add phase chip and Luteal tip card. Read existing dashboard before planning.
- `src/screens/symptoms/` — Where to add Cravings row. Read existing symptom screen before planning.

### Design system
- `bloom-app-design/project/screens/Home.jsx` — Dashboard layout reference (where phase chip + tip card slot in)
- `bloom-app-design/project/tokens.css` — Design tokens for all new UI components
- `bloom-app-design/project/components/Bits.jsx` — Reusable component patterns

### Prior phase decisions (must not contradict)
- `.planning/phases/04-ai-targets/04-CONTEXT.md` — D-01 through D-18 (especially D-05: always frame as adequacy; D-09: PROMPT_VERSION strategy; D-11: cache invalidation logic extended in Phase 5)
- `CLAUDE.md` rules 3, 6, 8 — API key in Edge Functions only; adequacy framing; AI targets cache in ai_daily_targets

### Requirements
- `.planning/REQUIREMENTS.md` — CYCL-01 through CYCL-05 (must all be covered by Phase 5 plans)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/targets.ts` — `STATIC_TARGETS` and `DailyTargets` type. Extend `DailyTargets` to add optional `cycle_phase?: CyclePhase` field so the hook and dashboard can consume it.
- `src/hooks/useAITargets.ts` — The stale check comparing `profiles.updated_at` > `ai_daily_targets.generated_at` is the model for the new phase-drift check.
- `supabase/functions/generate-targets/index.ts` — `buildUserPrompt` function and `ProfileRow` type are the exact extension points. `PROMPT_VERSION` = 1 → bump to 2.
- Existing symptom log pattern (`energy`, `mood`, `sleep`, `bloating`, `skin` as `smallint` columns) — `cravings` follows the exact same pattern.

### Established Patterns
- All DB migrations follow the `supabase/migrations/YYYYMMDDNNNNN_description.sql` naming convention.
- New DB columns on existing tables always add RLS policies if user-owned data (cycle data is in `profiles` which already has RLS).
- All hooks use TanStack Query (`useQuery` / `useMutation`). New `useCyclePhase` composable (if needed) follows the same pattern.
- Edge Function extension: add fields to the `select` clause in the Supabase query + add lines to `buildUserPrompt`. Keep the validation function backward-compatible (new Claude output fields are additive if needed).

### Integration Points
- `src/lib/cycle.ts` (new) — Pure function `getCyclePhase` + `CyclePhase` type + `CYCLE_CONTENT` static strings for educational copy
- `profiles` table → add 3 columns: `last_period_date date`, `cycle_length_days integer default 28`, `period_length_days integer default 5`
- `symptom_logs` table → add 1 column: `cravings smallint check (cravings between 1 and 5)`
- `ai_daily_targets` table → add 1 column: `cycle_phase text`
- `useAITargets` hook → add phase-drift check before the profile-change check
- Dashboard `HomeScreen` → add `<CyclePhaseChip>` and conditional `<LutealTipCard>` components
- Recipes screen → accept `?phase=luteal` query param and pre-apply filter

</code_context>

<specifics>
## Specific Ideas

- `getCyclePhase` should return `{ phase: CyclePhase, cycleDay: number, cycleLength: number }` so the prompt builder and dashboard chip both get what they need from a single call.
- The 3 Luteal comfort food swaps in the tip card: something like "Craving chocolate? → dark cacao rice cakes (GL ~8)", "Craving pasta? → lentil pasta with olive oil (GL ~26)", "Craving crisps? → roasted chickpeas (GL ~10)". These should be hardcoded in `cycleContent.ts`, not fetched.
- Cycle data entry: use a `<DatePicker>` for `last_period_date` (date input, max = today) and a stepper component (increment/decrement buttons) for `cycle_length_days`.
- Bottom sheet for phase explanation: reuse whatever sheet/modal pattern exists in the app (check `src/components/ui/` for Sheet or BottomSheet component).
- The `?phase=luteal` query param on the Recipes screen pre-filters to show the same PCOS-friendly, low-GL recipes — the Recipes screen already exists with filter chips, so this is a URL-driven pre-selection of an existing filter.

</specifics>

<deferred>
## Deferred Ideas

- Cycle prediction for irregular cycles (common in PCOS) — requires historical period data and ML/heuristic prediction; v2 feature
- Correlation timeline overlay (cravings vs GL vs cycle phase) — Phase 6 (Doctor-Ready Reports)
- Push notifications when cycle phase changes — iOS PWA limitation (explicitly out of scope in CLAUDE.md)
- Coach-visible cycle data — v2 (coach portal is out of scope for v1)
- Symptom → cycle phase correlation insights screen — Phase 6
- Apple Health / Oura cycle sync — v2 (explicitly out of scope in CLAUDE.md)
- Ovulation prediction / LH tracking — v2, out of scope

</deferred>

---

*Phase: 5-Cycle-Synced-Nutrition-Targets*
*Context gathered: 2026-05-20*
