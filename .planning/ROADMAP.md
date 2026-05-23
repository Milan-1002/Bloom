# Roadmap: Bloom

**Milestone 1 — v1.0 Core App**
*Goal: Ship a working PCOS nutrition companion that covers food logging, today's dashboard, health tracking, and AI targets.*

---

## Phases

- [x] **Phase 1: Foundation** - Scaffold, auth, onboarding, database schema + RLS, design system, PWA *(completed 2026-05-18)*
- [x] **Phase 2: Core Loop — Food Logging + Today Dashboard** - USDA food search, GL calculation, food diary, dashboard *(completed)*
- [x] **Phase 3: Health Tracking — Symptoms + Weight** - Symptom logging, weight logging, dashboard integration *(completed)*
- [x] **Phase 4: AI Targets — Claude Edge Function + Insulin Balance** - Personalized macro targets, Insulin Balance score *(completed)*
- [x] **Phase 5: Cycle-Synced Nutrition Targets** - Menstrual phase detection, dynamic GL/macro targets, craving interception, cycle symptom tracking *(completed 2026-05-20)*
- [ ] **Phase 6: Automated "Doctor-Ready" Reports** - 30/60/90-day summaries, GL vs symptom timeline, PDF export

---

## Phase Details

### Phase 1: Foundation
**Goal:** Vite + React + TS scaffold, all Supabase tables + RLS migrations, AuthContext singleton, React Router shell (AuthLayout + AppLayout + guards), UI component library from bloom-app-design tokens, 4-step onboarding, PWA manifest + service worker, data deletion workflow.
**Mode:** mvp
**UI hint**: yes
**Depends on:** Nothing (first phase)
**Requirements:** AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, ONBD-01, ONBD-02, ONBD-03, ONBD-04, PROF-01, PROF-02, PROF-03, INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06
**Success Criteria** (what must be TRUE):
  1. A new user can sign up with email and password, verify their email, and reach the onboarding flow
  2. A returning user's session persists across browser refresh and they land directly on the home screen
  3. A new user completes all 4 onboarding steps (welcome, profile, PCOS type, goals) and cannot skip to the main app until the profile is saved
  4. The app installs as a PWA on mobile with the correct Bloom name, icon, and theme color
  5. A user can delete their account and all associated data from profile settings
**Plans:** 5/5 plans executed

Plans:
- [x] 01-01: Vite + React + TS scaffold, ESLint/Prettier config, design token CSS, component stubs
- [x] 01-02: Supabase project wiring — all table migrations, RLS policies, TypeScript type generation
- [x] 01-03: Auth flow — AuthContext singleton, AuthLayout, sign-up/login/reset screens, email verification
- [x] 01-04: Router shell — AppLayout, RequireAuth + RequireProfile guards, tab bar, route structure
- [x] 01-05: Onboarding flow — 4-step wizard, profile save, gate guard; PWA manifest + service worker; account deletion

### Phase 2: Core Loop — Food Logging + Today Dashboard
**Goal:** USDA food search + Supabase cache, GL calculation (src/lib/gl.ts with local GI table), food_logs INSERT with denormalized macros, Today dashboard (static targets until Phase 4 adds AI), Food Diary screen, barcode scan, recent foods, edit/delete log entries.
**Mode:** mvp
**UI hint**: yes
**Depends on:** Phase 1
**Requirements:** FOOD-01, FOOD-02, FOOD-03, FOOD-04, FOOD-05, FOOD-06, FOOD-07, FOOD-08, FOOD-09, FOOD-10, DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06, DASH-07, DIARY-01, DIARY-02, DIARY-03
**Success Criteria** (what must be TRUE):
  1. A user can search for food by name (debounced), view macros including glycemic load on the food detail screen, adjust serving size, assign a meal slot, and log the entry
  2. A user can scan a product barcode with their camera and have the food detail screen auto-filled from USDA branded foods
  3. A user can re-add a recently logged food in one tap, with the last-used serving size and slot preserved
  4. A user can edit the serving size or meal slot of a logged entry, and delete an entry, from both the dashboard and the Food Diary screen
  5. The Today dashboard shows macro progress rings, today's logged meals grouped by slot, and allows navigating to previous days via the date strip
**Plans:** TBD

Plans:
- [ ] 02-01: USDA food search — debounced API call, usda_foods cache table, food detail screen, GL calculation (gl.ts)
- [ ] 02-02: Food logging — serving size stepper, meal slot picker, food_logs INSERT with denormalized macros
- [ ] 02-03: Barcode scan — camera capture, UPC lookup in usda_foods cache, manual-entry fallback
- [ ] 02-04: Recent foods list — last 20 unique foods, one-tap re-add; edit and delete log entry flows
- [ ] 02-05: Today dashboard + Food Diary screen — macro progress rings, meals by slot, date navigation, diary totals

### Phase 3: Health Tracking — Symptoms + Weight
**Goal:** Symptoms screen with 1–5 scale logging, symptom_logs table, weight logging with sparkline, weight_logs table, both visible on the dashboard.
**Mode:** mvp
**Depends on:** Phase 1
**Requirements:** SYMPT-01, SYMPT-02, SYMPT-03, WGHT-01, WGHT-02, WGHT-03
**Success Criteria** (what must be TRUE):
  1. A user can log today's symptoms (energy, mood, sleep, bloating, skin) on a 1–5 scale from the Symptoms screen
  2. Today's logged symptoms appear as a summary card on the Today dashboard
  3. A user can view and edit symptom entries for past days
  4. A user can log today's weight (kg) and see a 7-day rolling average sparkline on the dashboard weight card
**Plans:** TBD

Plans:
- [ ] 03-01: Symptom logging — symptom_logs table, Symptoms screen UI, 1–5 scale inputs, past-day editing
- [ ] 03-02: Weight logging — weight_logs table, weight entry flow, 7-day rolling average sparkline, dashboard integration

### Phase 4: AI Targets — Claude Edge Function + Insulin Balance
**Goal:** Supabase Edge Function calls Claude API to generate personalized macro targets and Insulin Balance score narrative, cached in ai_daily_targets, with guardrails in system prompt and USDA fallback targets when Claude is unavailable. Dashboard updates to display real AI targets.
**Mode:** mvp
**Depends on:** Phase 2, Phase 3
**Requirements:** AI-01, AI-02, AI-03, AI-04, AI-05, AI-06
**Success Criteria** (what must be TRUE):
  1. The Today dashboard displays an Insulin Balance score (0–100) with a 1–2 sentence plain-language narrative generated by Claude
  2. The dashboard macro progress rings reflect personalized AI-generated targets (protein floor, fiber floor, GL ceiling, added sugar ceiling, calorie range, P:C ratio) rather than static values
  3. AI targets are regenerated only when the user's profile changes, not on every dashboard load
  4. When the Claude API is unavailable, the dashboard falls back to static USDA reference targets without errors
  5. The Claude API key is accessible only inside the Edge Function and cannot be extracted from the client bundle
**Plans:** 2 plans

Plans:
- [ ] 04-01-PLAN.md — insulin_score migration + type regen, ai-validation pure functions (TDD), generate-targets Edge Function
- [ ] 04-02-PLAN.md — useAITargets hook, dashboard wiring, fallback static targets, profile-change invalidation

### Phase 5: Cycle-Synced Nutrition Targets
**Goal:** Identify the user's current menstrual phase (Follicular, Ovulation, Luteal, Menstrual) from their profile/cycle data, dynamically adjust daily GL ceiling, macro ratios, and calorie baseline per phase, notify the user when goals shift with a plain-language rationale, surface low-GL craving alternatives during high-craving phases, and track cycle-specific symptoms to validate target effectiveness over time.
**Mode:** mvp
**UI hint**: yes
**Depends on:** Phase 3 (symptom logs), Phase 4 (AI targets)
**Requirements:** CYCL-01, CYCL-02, CYCL-03, CYCL-04, CYCL-05
**Success Criteria** (what must be TRUE):
  1. The app identifies and displays the user's current cycle phase based on their last period date
  2. Daily GL, macro ratios, and calorie targets shift automatically when the cycle phase changes
  3. The user can view a plain-language explanation of their current cycle phase and how it affects their targets by tapping the phase chip; Claude's narrative includes phase-specific language when targets are generated
  4. During Luteal phase the app surfaces at least 3 low-GL alternatives to common comfort foods
  5. Cycle-specific symptoms (fatigue, bloating, cravings) can be logged and correlate with phase data
**Plans:** 3/3 plans executed

Plans:
- [x] 05-01-PLAN.md — Schema migration (5 new columns), getCyclePhase engine, cycleContent static copy, Edge Function PROMPT_VERSION 2
- [x] 05-02-PLAN.md — useProfile cycle fields, useAITargets phase-drift check, CyclePhaseChip, LutealTipCard, HomeScreen wiring
- [x] 05-03-PLAN.md — Cravings symptom tracking, My Cycle ProfileScreen section, Recipes ?phase=luteal filter

### Phase 6: Automated "Doctor-Ready" Reports
**Goal:** Compile 30/60/90-day averages for GL, fiber, weight, and cycle length into an executive summary; overlay symptom logs on a GL timeline to surface diet–symptom correlations; highlight eating habit patterns (fasting windows, meal timing); flag "red flag" streaks where GL exceeded target; and export the full report as a shareable PDF.
**Mode:** mvp
**UI hint**: yes
**Depends on:** Phase 2 (food logs), Phase 3 (symptom + weight logs), Phase 5 (cycle data)
**Requirements:** RPT-01, RPT-02, RPT-03, RPT-04, RPT-05
**Success Criteria** (what must be TRUE):
  1. A user can generate a 30-, 60-, or 90-day summary showing average GL, fiber, weight change, and cycle length at a glance
  2. A timeline view overlays logged symptoms directly on the GL graph to reveal diet–symptom correlations
  3. The report highlights typical eating patterns — average fasting window, meal timing distribution
  4. "Red flag" streaks (5+ consecutive days exceeding GL target by ≥20%) are automatically flagged
  5. The complete report exports to a clean PDF the user can email or print for their clinic visit
**Plans:** 3 plans

Plans:
- [x] 06-01: Data aggregation layer — report-stats.ts pure functions, useReportData hook, placeholder ReportScreen, /report route registration
- [x] 06-02: Report UI — GLSymptomChart (Recharts ComposedChart), full ReportScreen, Home screen CTA
- [ ] 06-03: PDF export — @react-pdf/renderer + html2canvas, report-pdf.tsx Document, Export PDF button wired

---

## Progress

**Execution Order:** 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 5/5 | Complete | 2026-05-18 |
| 2. Core Loop — Food Logging + Today Dashboard | 4/5 | Complete* | - |
| 3. Health Tracking — Symptoms + Weight | 2/2 | Complete | - |
| 4. AI Targets — Claude Edge Function + Insulin Balance | 2/2 | Complete | - |
| 5. Cycle-Synced Nutrition Targets | 3/3 | Complete | 2026-05-20 |
| 6. Automated "Doctor-Ready" Reports | 1/3 | In progress | - |
