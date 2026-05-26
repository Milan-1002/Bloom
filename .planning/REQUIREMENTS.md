# Requirements: Bloom

**Defined:** 2026-05-18
**v1.1 scope added:** 2026-05-26
**Core Value:** A woman with PCOS can understand how today's food choices affect her insulin balance and symptoms — and receive a personalized, actionable target for the day.

---

## v1.1 Requirements (Current Milestone)

### PWA Brand Icons

- [ ] **PWA-01**: App installs with real Bloom brand icons in all standard PWA sizes (72, 96, 128, 144, 152, 192, 384, 512px PNG) — replaces 1×1px placeholder icons

### Weekly Insights

- [ ] **INSG-01**: Home dashboard shows a weekly insights card with the top food↔symptom correlation for the past 7 days (e.g. "On days you exceeded GL target, bloating was 40% higher")
- [ ] **INSG-02**: Weekly insights card shows the user's current cycle phase summary and what to expect from the upcoming phase (plain-language, no medical diagnosis)

### Coach Invite Flow

- [ ] **COACH-01**: User can generate a shareable coach invite link from Profile Settings (tokenized URL, no coach account required)
- [ ] **COACH-02**: Coach can open the shared link in a browser and view user's food logs for the last 30 days (read-only, no login required)
- [ ] **COACH-03**: Coach view includes 7-day and 30-day macro averages (protein, fiber, glycemic load, calories)
- [ ] **COACH-04**: Coach view includes symptom trends over time (energy, mood, bloating, skin, sleep)
- [ ] **COACH-05**: Coach view includes 7-day rolling average weight trend chart

---

## v1.0 Requirements (Shipped)

### Authentication

- [x] **AUTH-01**: User can sign up with email and password
- [x] **AUTH-02**: User receives email verification after signup
- [x] **AUTH-03**: User can reset password via email link
- [x] **AUTH-04**: User session persists across browser refresh
- [x] **AUTH-05**: User can log out from any screen

### Onboarding

- [x] **ONBD-01**: New user is guided through a 4-step onboarding flow (welcome → profile → PCOS type → goals)
- [x] **ONBD-02**: User enters profile data: preferred name, age, height, current weight, goal weight (optional), PCOS diagnosis type (Confirmed / Suspected / Managing symptoms)
- [x] **ONBD-03**: User selects goals (weight loss, steady energy, fewer cravings, clearer skin, regular cycle, fertility, mood)
- [x] **ONBD-04**: Onboarding completion is gated — user cannot access main app until profile is saved

### Profile & Settings

- [x] **PROF-01**: User can view and edit their profile (name, age, height, weight, PCOS type, goals)
- [x] **PROF-02**: User can select app theme (slate, warm, sage palettes; light/dark mode)
- [x] **PROF-03**: User can delete their account and all associated data (GDPR right-to-erasure)

### Food Logging

- [x] **FOOD-01**: User can search USDA FoodData Central by food name (debounced at 400ms, shows top 10 results)
- [x] **FOOD-02**: User can view food detail screen with macros (protein, fiber, carbs, calories, GL, added sugar)
- [x] **FOOD-03**: User can adjust serving size via stepper (0.5x–2x) and gram-level input
- [x] **FOOD-04**: User can assign a meal slot (Breakfast, Lunch, Dinner, Snack) before logging
- [x] **FOOD-05**: User can log a food entry to their diary for today or a past day
- [x] **FOOD-06**: User can scan a product barcode (UPC/EAN-13) to auto-fill food details from USDA branded foods
- [x] **FOOD-07**: User can view their recently logged foods (last 20 unique foods)
- [x] **FOOD-08**: User can re-add a recent food in one tap (preserves last-used serving size and slot)
- [x] **FOOD-09**: User can edit a logged food entry (serving size and meal slot)
- [x] **FOOD-10**: User can delete a logged food entry

### Today Dashboard

- [x] **DASH-01**: User sees today's Insulin Balance score (0–100 composite) with a 1–2 sentence AI-generated narrative
- [x] **DASH-02**: User sees today's macros (protein, fiber, GL, P:C ratio, added sugar, calories) vs. AI targets with progress rings
- [x] **DASH-03**: User sees today's meal list grouped by slot with photo, name, macros, and kcal
- [x] **DASH-04**: User sees today's symptom summary (energy, mood, sleep, bloating, skin dots + cycle badge)
- [x] **DASH-05**: User sees 7-day weight sparkline with latest weight reading and 7-day delta
- [x] **DASH-06**: User can navigate to previous days via date strip (up to 90 days back)
- [x] **DASH-07**: User can tap "Log meal" CTA from dashboard to open food logging flow

### Food Diary

- [x] **DIARY-01**: User can view full food diary for any day, grouped by meal slot
- [x] **DIARY-02**: User sees daily macro totals and targets on diary screen
- [x] **DIARY-03**: User can edit or delete any logged entry from the diary screen

### Symptoms

- [x] **SYMPT-01**: User can log daily symptoms: energy, mood, sleep, bloating, skin on a 1–5 scale
- [x] **SYMPT-02**: Today's logged symptoms appear on the dashboard
- [x] **SYMPT-03**: User can view and edit symptoms for past days

### Weight

- [x] **WGHT-01**: User can log daily weight (kg)
- [x] **WGHT-02**: User can view 7-day weight trend (rolling average, not raw daily values)
- [x] **WGHT-03**: Weight mini card appears on today's dashboard

### AI Targets

- [x] **AI-01**: A Supabase Edge Function calls Claude API to generate personalized macro targets based on user profile
- [x] **AI-02**: Targets include: protein floor (g), fiber floor (g), GL ceiling, added sugar ceiling, calorie range, and P:C ratio target
- [x] **AI-03**: Edge Function generates Insulin Balance score (0–100) with a 1–2 sentence plain-language narrative
- [x] **AI-04**: Generated targets are cached in `ai_daily_targets` and regenerated only on profile change
- [x] **AI-05**: AI system prompt includes guardrails prohibiting medical diagnosis, supplement dosage advice, and drug interaction advice
- [x] **AI-06**: Claude API key is stored in Edge Function secrets only — never in Vite env files

### Cycle-Synced Targets

- [x] **CYCL-01**: User can log period start date; app auto-calculates cycle day and phase
- [x] **CYCL-02**: App identifies current menstrual phase (Follicular, Ovulation, Luteal, Menstrual) and adjusts GL ceiling, macro ratios, and calorie baseline per phase
- [x] **CYCL-03**: AI macro targets shift based on cycle phase; cycle phase stored in ai_daily_targets
- [x] **CYCL-04**: Cycle phase chip displayed on dashboard; tapping opens plain-language bottom sheet explanation
- [x] **CYCL-05**: User can track cycle-specific cravings (1–5 scale) alongside other symptoms; Luteal phase shows craving interception card

### Doctor-Ready Reports

- [x] **RPT-01**: User can generate a 30-, 60-, or 90-day summary showing average GL, fiber, weight change, and cycle length
- [x] **RPT-02**: A timeline view overlays logged symptoms on the GL graph to reveal diet–symptom correlations
- [x] **RPT-03**: Report highlights typical eating patterns — average fasting window, meal timing distribution
- [x] **RPT-04**: "Red flag" streaks (5+ consecutive days exceeding GL target by ≥20%) are automatically flagged
- [x] **RPT-05**: The complete report exports to a clean PDF the user can email or print

### Infrastructure & Security

- [x] **INFRA-01**: All user-owned tables have RLS enabled with `(select auth.uid()) = user_id` policies
- [x] **INFRA-02**: Supabase client is a module-level singleton — never instantiated in component render
- [x] **INFRA-03**: USDA API responses are cached in a shared `usda_foods` table (30-day TTL)
- [x] **INFRA-04**: TypeScript database types are generated from schema and committed
- [x] **INFRA-05**: PWA manifest and service worker are configured (Vite PWA plugin, `generateSW` strategy)
- [x] **INFRA-06**: App installs as a mobile PWA with correct name and theme color (icons were placeholder — fixed by PWA-01 in v1.1)

---

## Future Requirements (v2+)

### Macro & GL Trends
- **MACR-01**: User can view 7-day macro trend charts (protein, fiber, GL as bar charts)
- **MACR-02**: User can view GL breakdown by meal across the week

### Insights (deeper analysis)
- **INSG-03**: Plain-language pattern detection ("Your energy is higher on low-GL days") — correlation engine beyond weekly card

### Coach Features (v2 portal)
- **COACH-06**: Coach protocol (meal templates, targets, notes) is shown to user in Coach screen
- **COACH-07**: Full coach management portal with client list

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
| Full coach management portal | Separate product scope; v2 (COACH-06–07) |
| Apple Health / Oura / Withings integration | Adds significant complexity; v2 |
| Subscription / payments | v1 is free; monetization is v2 |
| Coach marketplace / finding coaches | Invite-only for v1 |
| Social features (sharing, community) | Not core to PCOS nutrition value |
| Macro & GL trends screen (dedicated) | Deferred to v2 |
| Push notifications | iOS Safari limitations make this unreliable for PWA |

---

## Traceability

### v1.1

| Requirement | Phase | Status |
|-------------|-------|--------|
| PWA-01 | TBD | Planned |
| INSG-01 | TBD | Planned |
| INSG-02 | TBD | Planned |
| COACH-01 | TBD | Planned |
| COACH-02 | TBD | Planned |
| COACH-03 | TBD | Planned |
| COACH-04 | TBD | Planned |
| COACH-05 | TBD | Planned |

### v1.0

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01–05 | Phase 1 — Foundation | Complete |
| ONBD-01–04 | Phase 1 — Foundation | Complete |
| PROF-01–03 | Phase 1 — Foundation | Complete |
| INFRA-01–06 | Phase 1 — Foundation | Complete |
| FOOD-01–10 | Phase 2 — Core Loop | Complete |
| DASH-01–07 | Phase 2 — Core Loop | Complete |
| DIARY-01–03 | Phase 2 — Core Loop | Complete |
| SYMPT-01–03 | Phase 3 — Health Tracking | Complete |
| WGHT-01–03 | Phase 3 — Health Tracking | Complete |
| AI-01–06 | Phase 4 — AI Targets | Complete |
| CYCL-01–05 | Phase 5 — Cycle-Synced | Complete |
| RPT-01–05 | Phase 6 — Reports | Complete |

**v1.0 coverage:** 50 requirements, all 50 mapped and shipped ✓
**v1.1 coverage:** 8 requirements → TBD (roadmap pending)

---

*Requirements defined: 2026-05-18*
*v1.1 scope added: 2026-05-26*
