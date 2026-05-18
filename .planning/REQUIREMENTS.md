# Requirements: Bloom

**Defined:** 2026-05-18
**Core Value:** A woman with PCOS can understand how today's food choices affect her insulin balance and symptoms — and receive a personalized, actionable target for the day.

---

## v1 Requirements

### Authentication

- [ ] **AUTH-01**: User can sign up with email and password
- [ ] **AUTH-02**: User receives email verification after signup
- [ ] **AUTH-03**: User can reset password via email link
- [ ] **AUTH-04**: User session persists across browser refresh
- [ ] **AUTH-05**: User can log out from any screen

### Onboarding

- [ ] **ONBD-01**: New user is guided through a 4-step onboarding flow (welcome → profile → PCOS type → goals)
- [ ] **ONBD-02**: User enters profile data: preferred name, age, height, current weight, goal weight (optional), PCOS diagnosis type (Confirmed / Suspected / Managing symptoms)
- [ ] **ONBD-03**: User selects goals (weight loss, steady energy, fewer cravings, clearer skin, regular cycle, fertility, mood)
- [ ] **ONBD-04**: Onboarding completion is gated — user cannot access main app until profile is saved

### Profile & Settings

- [ ] **PROF-01**: User can view and edit their profile (name, age, height, weight, PCOS type, goals)
- [x] **PROF-02**: User can select app theme (slate, warm, sage palettes; light/dark mode)
- [ ] **PROF-03**: User can delete their account and all associated data (GDPR right-to-erasure)

### Food Logging

- [ ] **FOOD-01**: User can search USDA FoodData Central by food name (debounced at 400ms, shows top 10 results)
- [ ] **FOOD-02**: User can view food detail screen with macros (protein, fiber, carbs, calories, GL, added sugar)
- [ ] **FOOD-03**: User can adjust serving size via stepper (0.5x–2x) and gram-level input
- [ ] **FOOD-04**: User can assign a meal slot (Breakfast, Lunch, Dinner, Snack) before logging
- [ ] **FOOD-05**: User can log a food entry to their diary for today or a past day
- [ ] **FOOD-06**: User can scan a product barcode (UPC/EAN-13) to auto-fill food details from USDA branded foods
- [ ] **FOOD-07**: User can view their recently logged foods (last 20 unique foods)
- [ ] **FOOD-08**: User can re-add a recent food in one tap (preserves last-used serving size and slot)
- [ ] **FOOD-09**: User can edit a logged food entry (serving size and meal slot)
- [ ] **FOOD-10**: User can delete a logged food entry

### Today Dashboard

- [ ] **DASH-01**: User sees today's Insulin Balance score (0–100 composite) with a 1–2 sentence AI-generated narrative ("You're trending steady 🌱")
- [ ] **DASH-02**: User sees today's macros (protein, fiber, GL, P:C ratio, added sugar, calories) vs. AI targets with progress rings (MultiRing and MetricLine pattern from design)
- [ ] **DASH-03**: User sees today's meal list grouped by slot with photo, name, macros, and kcal
- [ ] **DASH-04**: User sees today's symptom summary (energy, mood, sleep, bloating, skin dots + cycle badge if available)
- [ ] **DASH-05**: User sees 7-day weight sparkline with latest weight reading and 7-day delta
- [ ] **DASH-06**: User can navigate to previous days via date strip (up to 90 days back)
- [ ] **DASH-07**: User can tap "Log meal" CTA from dashboard to open food logging flow

### Food Diary

- [ ] **DIARY-01**: User can view full food diary for any day, grouped by meal slot
- [ ] **DIARY-02**: User sees daily macro totals and targets on diary screen
- [ ] **DIARY-03**: User can edit or delete any logged entry from the diary screen

### Symptoms

- [ ] **SYMPT-01**: User can log daily symptoms: energy, mood, sleep, bloating, skin on a 1–5 scale
- [ ] **SYMPT-02**: Today's logged symptoms appear on the dashboard
- [ ] **SYMPT-03**: User can view and edit symptoms for past days

### Weight

- [ ] **WGHT-01**: User can log daily weight (kg)
- [ ] **WGHT-02**: User can view 7-day weight trend (rolling average, not raw daily values)
- [ ] **WGHT-03**: Weight mini card appears on today's dashboard

### AI Targets

- [ ] **AI-01**: A Supabase Edge Function calls Claude API to generate personalized macro targets based on user profile (age, height, weight, PCOS type, goals)
- [ ] **AI-02**: Targets include: protein floor (g), fiber floor (g), GL ceiling, added sugar ceiling, calorie range, and P:C ratio target
- [ ] **AI-03**: Edge Function generates Insulin Balance score (0–100) with a 1–2 sentence plain-language narrative
- [ ] **AI-04**: Generated targets are cached in `ai_daily_targets` and regenerated only on profile change (not per-request)
- [ ] **AI-05**: AI system prompt includes guardrails prohibiting medical diagnosis, supplement dosage advice, and drug interaction advice
- [ ] **AI-06**: Claude API key is stored in Edge Function secrets only — never in Vite env files

### Infrastructure & Security

- [ ] **INFRA-01**: All user-owned tables (food_logs, weight_logs, symptom_logs, profiles) have RLS enabled with `(select auth.uid()) = user_id` policies from migration 1
- [x] **INFRA-02**: Supabase client is a module-level singleton — never instantiated in component render
- [ ] **INFRA-03**: USDA API responses are cached in a shared `usda_foods` table (30-day TTL) to protect against the 1,000 req/hr rate limit
- [ ] **INFRA-04**: TypeScript database types are generated from schema (`supabase gen types typescript`) and committed
- [ ] **INFRA-05**: PWA manifest and service worker are configured (Vite PWA plugin, `generateSW` strategy)
- [ ] **INFRA-06**: App installs as a mobile PWA with correct name, icon, and theme color

---

## v2 Requirements

Deferred — not in current roadmap.

### Cycle Tracking
- **CYCL-01**: User can log period start date
- **CYCL-02**: App auto-calculates cycle day and phase (menstrual / follicular / ovulation / luteal)
- **CYCL-03**: AI macro targets shift based on cycle phase (tighter GL ceiling in luteal, higher protein in follicular)
- **CYCL-04**: Cycle phase badge displayed on dashboard

### Macro & GL Trends
- **MACR-01**: User can view 7-day macro trend charts (protein, fiber, GL as bar charts)
- **MACR-02**: User can view GL breakdown by meal across the week

### Insights
- **INSG-01**: Weekly AI-generated insight cards correlating symptoms with food choices
- **INSG-02**: Scatter chart showing symptom scores vs. GL days
- **INSG-03**: Plain-language pattern detection ("Your energy is higher on low-GL days")

### Coach Features
- **COACH-01**: User can generate a coach invite token/link
- **COACH-02**: Coach can accept invite and view user's food logs, macros, symptoms, and weight (read-only)
- **COACH-03**: Coach protocol (meal templates, targets, notes) is shown to user in Coach screen

### Food Library Enhancements
- **FOOD-11**: User can create a custom food (name + macros) for homemade meals
- **FOOD-12**: User can star foods as favorites for permanent quick-access
- **FOOD-13**: Recipe library with PCOS-friendly filter (GL, protein, fiber per serving)

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Native iOS / Android app | Web PWA first; native is v2+ |
| Google / Apple OAuth | Email/password sufficient for v1 |
| Real-time coach messaging | Coach is read-only viewer; out-of-app communication |
| Full coach management portal | Separate product scope; v1 coach is a viewer only |
| Apple Health / Oura / Withings integration | Adds significant complexity; v2 |
| Subscription / payments | v1 is free; monetization is v2 |
| Coach marketplace / finding coaches | Invite-only for v1 |
| Social features (sharing, community) | Not core to PCOS nutrition value |
| Weekly macro & GL trends screen | Deferred to v2 — dashboard covers today |
| Push notifications | iOS Safari limitations make this unreliable for PWA |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 — Foundation | Pending |
| AUTH-02 | Phase 1 — Foundation | Pending |
| AUTH-03 | Phase 1 — Foundation | Pending |
| AUTH-04 | Phase 1 — Foundation | Pending |
| AUTH-05 | Phase 1 — Foundation | Pending |
| ONBD-01 | Phase 1 — Foundation | Pending |
| ONBD-02 | Phase 1 — Foundation | Pending |
| ONBD-03 | Phase 1 — Foundation | Pending |
| ONBD-04 | Phase 1 — Foundation | Pending |
| PROF-01 | Phase 1 — Foundation | Pending |
| PROF-02 | Phase 1 — Foundation | Complete |
| PROF-03 | Phase 1 — Foundation | Pending |
| INFRA-01 | Phase 1 — Foundation | Pending |
| INFRA-02 | Phase 1 — Foundation | Complete |
| INFRA-03 | Phase 1 — Foundation | Pending |
| INFRA-04 | Phase 1 — Foundation | Pending |
| INFRA-05 | Phase 1 — Foundation | Pending |
| INFRA-06 | Phase 1 — Foundation | Pending |
| FOOD-01 | Phase 2 — Core Loop | Pending |
| FOOD-02 | Phase 2 — Core Loop | Pending |
| FOOD-03 | Phase 2 — Core Loop | Pending |
| FOOD-04 | Phase 2 — Core Loop | Pending |
| FOOD-05 | Phase 2 — Core Loop | Pending |
| FOOD-06 | Phase 2 — Core Loop | Pending |
| FOOD-07 | Phase 2 — Core Loop | Pending |
| FOOD-08 | Phase 2 — Core Loop | Pending |
| FOOD-09 | Phase 2 — Core Loop | Pending |
| FOOD-10 | Phase 2 — Core Loop | Pending |
| DASH-01 | Phase 2 — Core Loop | Pending |
| DASH-02 | Phase 2 — Core Loop | Pending |
| DASH-03 | Phase 2 — Core Loop | Pending |
| DASH-04 | Phase 2 — Core Loop | Pending |
| DASH-05 | Phase 2 — Core Loop | Pending |
| DASH-06 | Phase 2 — Core Loop | Pending |
| DASH-07 | Phase 2 — Core Loop | Pending |
| DIARY-01 | Phase 2 — Core Loop | Pending |
| DIARY-02 | Phase 2 — Core Loop | Pending |
| DIARY-03 | Phase 2 — Core Loop | Pending |
| SYMPT-01 | Phase 3 — Health Tracking | Pending |
| SYMPT-02 | Phase 3 — Health Tracking | Pending |
| SYMPT-03 | Phase 3 — Health Tracking | Pending |
| WGHT-01 | Phase 3 — Health Tracking | Pending |
| WGHT-02 | Phase 3 — Health Tracking | Pending |
| WGHT-03 | Phase 3 — Health Tracking | Pending |
| AI-01 | Phase 4 — AI Targets | Pending |
| AI-02 | Phase 4 — AI Targets | Pending |
| AI-03 | Phase 4 — AI Targets | Pending |
| AI-04 | Phase 4 — AI Targets | Pending |
| AI-05 | Phase 4 — AI Targets | Pending |
| AI-06 | Phase 4 — AI Targets | Pending |

**Coverage:**
- v1 requirements: 50 total
- Mapped to phases: 50
- Unmapped: 0 ✓

---

*Requirements defined: 2026-05-18*
*Last updated: 2026-05-18 — traceability updated after roadmap creation*
