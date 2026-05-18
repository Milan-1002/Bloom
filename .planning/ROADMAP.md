# Roadmap: Bloom

**Milestone 1 — v1.0 Core App**
*Goal: Ship a working PCOS nutrition companion that covers food logging, today's dashboard, health tracking, and AI targets.*

---

## Phases

- [ ] **Phase 1: Foundation** - Scaffold, auth, onboarding, database schema + RLS, design system, PWA
- [ ] **Phase 2: Core Loop — Food Logging + Today Dashboard** - USDA food search, GL calculation, food diary, dashboard
- [ ] **Phase 3: Health Tracking — Symptoms + Weight** - Symptom logging, weight logging, dashboard integration
- [ ] **Phase 4: AI Targets — Claude Edge Function + Insulin Balance** - Personalized macro targets, Insulin Balance score

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
**Plans:** TBD

Plans:
- [ ] 01-01: Vite + React + TS scaffold, ESLint/Prettier config, design token CSS, component stubs
- [ ] 01-02: Supabase project wiring — all table migrations, RLS policies, TypeScript type generation
- [ ] 01-03: Auth flow — AuthContext singleton, AuthLayout, sign-up/login/reset screens, email verification
- [ ] 01-04: Router shell — AppLayout, RequireAuth + RequireProfile guards, tab bar, route structure
- [ ] 01-05: Onboarding flow — 4-step wizard, profile save, gate guard; PWA manifest + service worker; account deletion

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
**Plans:** TBD

Plans:
- [ ] 04-01: Edge Function scaffold — generate-targets function, Claude API invocation, system prompt with guardrails, ai_daily_targets cache table
- [ ] 04-02: Target delivery — useAITargets hook, dashboard wiring, fallback static targets, profile-change invalidation

---

## Progress

**Execution Order:** 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/5 | Not started | - |
| 2. Core Loop — Food Logging + Today Dashboard | 0/5 | Not started | - |
| 3. Health Tracking — Symptoms + Weight | 0/2 | Not started | - |
| 4. AI Targets — Claude Edge Function + Insulin Balance | 0/2 | Not started | - |
