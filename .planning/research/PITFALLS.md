# Pitfalls Research: Bloom

**Domain:** PCOS nutrition companion app  
**Stack:** Vite + React + TypeScript + Supabase + Claude API + USDA FoodData Central  
**Researched:** 2026-05-18  
**Overall confidence:** HIGH (Supabase, Claude, PWA from official docs) / MEDIUM (UX/legal, USDA from domain knowledge + official API docs)

---

## Critical Pitfalls (Phase 1–2)

### 1. Supabase RLS Left Open by Default After `enable row level security`

**What goes wrong:** Enabling RLS on a table does NOT automatically deny all access — it depends on the `anon` vs `authenticated` role context and what policies exist. The subtler problem: RLS is disabled by default on new tables. If a developer creates a table, adds a foreign key to `auth.uid()`, and queries through the API without enabling RLS, ALL rows for ALL users are exposed to any authenticated request that can guess query parameters.

**Why it happens:** Supabase's auto-generated REST API uses the `anon` or `authenticated` role. Without RLS, those roles have full table access. Developers test with their own user and never notice cross-user leakage.

**Specific patterns that leak:**
- Writing `using (true)` on SELECT for `authenticated` — lets any logged-in user read any row
- Forgetting `with check (auth.uid() = user_id)` on INSERT — lets users write data on behalf of others
- Missing RLS entirely on junction/log tables (e.g., `meal_logs`, `symptom_entries`, `weight_records`) while protecting the primary user table
- Using a service-role key in client-side code bypasses RLS entirely

**For Bloom specifically:** Every health data table (`food_logs`, `symptom_logs`, `cycle_data`, `weight_entries`, `ai_targets`) must have RLS enabled AND correct policies before any data is stored. A leak of cycle data or weight history post-Roe is a serious harm event, not just a privacy annoyance.

**Prevention:**
- Enable RLS on EVERY table at migration time, not as an afterthought
- Standard pattern for all user-owned rows:
  ```sql
  alter table food_logs enable row level security;
  create policy "Users own their food logs"
    on food_logs for all to authenticated
    using (user_id = (select auth.uid()))
    with check (user_id = (select auth.uid()));
  ```
- Never store the service-role key anywhere client-accessible
- Run Supabase's built-in RLS advisor periodically

**Detection:** Query a protected table using an anon key via curl and verify you get 0 rows back.

**Phase to address:** Phase 1 (database schema setup) — bake RLS into every migration from day one.

---

### 2. Concurrent Session Refresh Race Conditions in React SPA

**What goes wrong:** React SPAs often mount multiple components that each call Supabase queries simultaneously on load. If the JWT is near expiry, multiple components trigger `getSession()` or `onAuthStateChange` in parallel, firing concurrent token refresh requests. Supabase Auth documents this as a known `conflict` error: "Can often occur when you have too many session refresh requests firing off at the same time for a user."

**Why it happens:** Each `useEffect` that calls `supabase.auth.getSession()` or initializes a Supabase client hook races with other effects. React 18 strict mode in dev doubles this by mounting twice.

**Consequences:** Intermittent 409 conflicts, users getting logged out unexpectedly, or stale tokens being used for data queries.

**Prevention:**
- Create a single Supabase client instance (module singleton), never inside a component
- Use one top-level `onAuthStateChange` listener (in a context provider) and distribute session state via React Context
- Never call `getSession()` in multiple components independently — pass the session down as props or context
- Implement exponential backoff on token refresh errors per Supabase's own guidance

**Phase to address:** Phase 1 (auth setup) — the singleton pattern must be established before any other feature.

---

### 3. Glycemic Load Missing from USDA FoodData Central

**What goes wrong:** USDA FoodData Central has no glycemic index (GI) or glycemic load (GL) data. The API returns macronutrients (carbs, fiber, protein, fat) but GI/GL are not part of the USDA nutrient database. For a PCOS app where glycemic load is a PRIMARY health metric, this is a foundational data gap.

**Why it happens:** GI is measured experimentally per food and maintained by external databases (Sydney University GI Research Service, Glycemic Index Foundation). USDA has never incorporated it.

**Consequences of ignoring this early:**
- Architecture that assumes all nutrient data comes from USDA breaks at the seam
- Scrambling mid-build to integrate a second data source
- Inaccurate GL calculations if devs estimate GI from carb content alone (common workaround, but misleading for refined vs. whole-grain foods)

**Prevention:**
- Accept at project start that GL calculations require a two-source approach: USDA for macros + a curated GI database (e.g., Open Glycemic Index, or a manually maintained table for the 200-300 most common PCOS-relevant foods)
- For MVP: ship a curated table of ~300 common foods with known GI values, fallback to net-carb estimate with a visible disclaimer
- Never display a GL number without disclosing the data source and its limitations

**Phase to address:** Phase 1 (data architecture). Do not defer this — it affects database schema design.

---

### 4. Calorie Counting UI Triggering Disordered Eating

**What goes wrong:** Health apps that display running calorie counts, deficits, "over budget" warnings, or weight charts as a primary metric have a documented pattern of triggering or worsening disordered eating in users with restrictive eating histories. PCOS patients have elevated rates of binge eating disorder and orthorexia.

**Why it happens:** Developers optimize for "completeness" of nutrition data display without considering the psychological effect of the presentation layer.

**Specific failure modes:**
- Red/green color coding for calorie targets (red = "bad day")
- Showing net calories or "calories remaining" prominently
- Congratulating users for eating less than their target
- Weight chart that shows every decimal (0.1 lb fluctuations)
- Daily weigh-in streak gamification

**What top apps got wrong:** MyFitnessPal's core UX is built around calorie restriction framing. Noom built an entire coaching system around guilt-based food categorization ("red foods"). These create harm for users who have or develop eating disorders.

**Prevention for Bloom:**
- Frame ALL metrics around adequacy, not restriction: "You're getting enough protein" not "X calories remaining"
- Show weight as a 7-day rolling average, never daily fluctuations
- Never show a calorie deficit as a positive outcome — PCOS patients are often undereating, not overeating
- Include a "gentle mode" toggle that hides numerical calorie counts entirely and shows only qualitative feedback
- Add eating disorder resource links in onboarding (NEDA hotline, etc.)
- Conduct user testing specifically with PCOS community members before launch

**Phase to address:** Phase 1 (design system) and Phase 2 (food logging UI). Revisit in every phase that adds new metrics.

---

## High-Risk Pitfalls (Phase 3–5)

### 5. Claude API Cost Blowup from Per-Request Calls

**What goes wrong:** Calling Claude on every food log entry, every dashboard load, or every symptom check-in can generate costs of $50-500/month per active user at scale — before reaching product-market fit.

**Known cost drivers for Bloom:**
- Large system prompts sent with every request (PCOS context, user profile, food history)
- Streaming responses that pad token counts
- Users repeatedly asking variations of the same question
- Generating AI targets daily when they should update weekly

**Prevention:**
- Cache AI-generated targets aggressively (Redis or Supabase table) — regenerate only when meaningful data changes (new symptom pattern, >2 weeks of data, explicit user request)
- Use `max_tokens` caps strictly — nutrition advice does not need 2,000-token responses
- Implement per-user daily call limits client-side and server-side
- Track costs by workspace/user using the Admin Cost Report API (`/v1/organizations/cost_report`) from day one
- Choose Claude Haiku for lightweight classification tasks (food category detection, symptom pattern flags) and reserve Sonnet/Opus for personalized coaching messages

**Phase to address:** Phase 3 (AI integration) — build the caching layer before wiring up any Claude calls.

---

### 6. Claude Hallucinating Specific Medical Nutrition Advice

**What goes wrong:** Claude will confidently generate specific supplement dosages, medication interaction warnings, or "this food will worsen your PCOS" claims that are not clinically established or are outright wrong. For a health app targeting a vulnerable population, this is a liability and a genuine harm.

**High-risk prompt patterns for Bloom:**
- "What supplements should I take for my PCOS?" (dosage hallucination risk)
- "Is metformin interacting with my diet?" (drug interaction, Claude is not a pharmacist)
- "My cycle data shows X, what does that mean medically?" (diagnostic inference)
- Free-form user input being passed directly as Claude context (prompt injection vector)

**Prevention:**
- Constrain all Claude responses to nutrition guidance only — system prompt must explicitly prohibit medical diagnosis, supplement recommendations with specific dosages, and drug interaction advice
- Use a harmlessness screen (Claude Haiku) to pre-classify user queries before passing to main model — reject medical/diagnostic queries with a friendly redirect to "consult your doctor"
- Never pass raw user input directly into prompts without sanitization — wrap in explicit delimiters:
  ```
  <user_food_log>{{sanitized_input}}</user_food_log>
  ```
- Ground all advice in the user's own logged data, not in general PCOS claims
- Require a medical disclaimer on every AI-generated insight: "This is nutritional information, not medical advice."

**Phase to address:** Phase 3 (AI integration) — the system prompt guardrails and harmlessness screen must be in place before any user-facing AI feature ships.

---

### 7. USDA API Rate Limits (1,000 req/hr) Causing Food Search Failures

**What goes wrong:** USDA FoodData Central caps API calls at 1,000 requests per hour per API key. A user typing in a search box ("chicken brea...") can generate 5-10 API calls per search session with naive debouncing. With 100 concurrent users searching, you hit the cap in minutes.

**Consequences:** Food search returns empty results, users blame the app, logging drops off, retention tanks.

**Prevention:**
- Debounce search input to fire only after 400ms of inactivity — never on every keystroke
- Cache common food search results in Supabase (a `food_cache` table with TTL) — the USDA database changes infrequently; 30-day cache on popular foods is safe
- Implement a two-tier search: check local cache first, only call USDA API on cache miss
- Expose a single server-side proxy endpoint for USDA calls so you can monitor and throttle centrally
- Pre-seed the cache with the 500 most common foods in PCOS dietary patterns at launch

**Phase to address:** Phase 2 (food logging) — build the cache layer with the food search feature, not after it breaks in production.

---

### 8. Barcode Scanning Coverage Gaps

**What goes wrong:** USDA FoodData Central's barcode coverage is poor for branded products. SR Legacy and Foundation Foods are whole foods; branded product UPCs are in "Branded Foods" which has incomplete coverage and data quality issues (manufacturers self-report nutrition data).

**Specific problems:**
- Scan a common grocery item → not found → user gives up
- Found but wrong serving size (manufacturer data errors)
- Nutrient data missing fields (no fiber recorded, no micronutrients)
- Different USDA entries for same product in different regions

**Prevention:**
- Supplement USDA with Open Food Facts (open source, 3M+ products, community-maintained) as a fallback for barcodes not found in USDA
- Always show the data source next to any food entry ("Source: USDA Foundation Foods" vs "Source: Open Food Facts — verify accuracy")
- Build a manual entry fallback as a first-class experience, not an afterthought
- Flag entries with incomplete nutrient profiles (missing fiber = can't calculate GL) and prompt for manual completion

**Phase to address:** Phase 2 (food logging) — design the multi-source architecture from the start.

---

### 9. PWA: iOS Safari Push Notifications and Storage Limits

**What goes wrong:** iOS Safari has historically restricted PWAs in ways that break the expected PWA experience:
- Push notifications: Only supported on iOS 16.4+ when the PWA is installed to home screen — not in the browser tab. The vast majority of users will never install to home screen, meaning push reminders (meal logging, cycle check-ins) don't work for most users on iPhone.
- Storage: IndexedDB and Cache Storage on iOS are treated as evictable storage — iOS can purge PWA storage without warning when device storage is low. Cached food data, offline logs, and draft entries can disappear.
- Background sync: Limited on iOS, meaning offline food logs may not sync until user re-opens app.

**Why this matters for Bloom:** PCOS apps have a mobile-first audience. iPhone market share in the US women's health demographic is ~60%+. If your PWA reminders don't work on iOS, the engagement loop breaks.

**Prevention:**
- Do not design the product around push notification engagement on iOS — build habit loops through in-app prompts, not background notifications
- Treat offline data as ephemeral on iOS — always sync to Supabase at the earliest opportunity, never rely on local-only storage as the source of truth
- Test on actual iOS devices (not just simulator) every sprint — iOS PWA behavior diverges from Chrome in non-obvious ways
- Display a one-time banner for iOS users explaining limited PWA features and directing to install to home screen

**Phase to address:** Phase 2-3 — design the notification strategy knowing iOS limitations before building any reminder system.

---

### 10. Service Worker Cache Invalidation After Deploy

**What goes wrong:** After deploying a new version of the app, users on older service worker caches continue loading stale JavaScript, CSS, and HTML. They see old UI, experience bugs that are already fixed, or — worst — their requests go to API endpoints that no longer exist.

**The vite-plugin-pwa pattern:** Workbox precaches all assets with content hashes. When you deploy, the new service worker must go through install → waiting → activate cycle. If users have the tab open, the old service worker stays active until they close and reopen ALL tabs.

**Prevention:**
- Implement the "new version available" prompt pattern via `vite-plugin-pwa`'s `useRegisterSW` hook — show a non-intrusive banner: "Update available — tap to reload"
- Never deploy breaking API changes without a versioned endpoint strategy
- Test the update flow in staging explicitly — deploy, check that update prompt appears, verify old cached assets are cleared after update

**Phase to address:** Phase 1 (PWA setup) — establish the update prompt pattern before any caching configuration is finalized.

---

### 11. Cycle Data Privacy in Post-Roe Legal Context

**What goes wrong:** Menstrual cycle data is potentially subpoenaable in US states that criminalize abortion. Several period tracking apps (Flo, Clue) faced scrutiny and user concern about data practices post-Dobbs (2022). An app that stores period dates, flow, and symptom data in a cloud database with loose access controls creates legal risk for users.

**Specific exposure vectors:**
- Supabase row data accessible to Bloom employees via service-role key
- Third-party analytics SDKs with access to user events
- Data stored indefinitely without deletion option
- Vague or missing privacy policy

**Prevention:**
- Implement a clear data deletion workflow (GDPR-style "delete my account and all data")
- Do NOT send cycle/symptom events to third-party analytics
- Publish a clear privacy policy before launch that explicitly states: cycle data is not sold or shared with third parties, and under what legal circumstances Bloom would respond to a legal request
- Consult a privacy attorney before launch — not after

**Phase to address:** Phase 1 (infrastructure) for data architecture; Phase 2 (legal review) before any user data is stored in production.

---

## Anti-Patterns to Avoid

| Anti-Pattern | Why It Happens | What to Do Instead |
|---|---|---|
| Building coach portal before validating food logging | "Full product" thinking; building for imagined users | Validate core logging → dashboard loop with 20 real PCOS users before touching coach features |
| Calling Claude on every page load | AI feels more "smart" with fresh responses | Cache AI targets; Claude is a batch insight generator, not a live data processor |
| Using `using (true)` as a placeholder RLS policy | Fast prototyping, forgetting to return | Mark all `using (true)` with a `TODO:SECURITY` comment and enforce code review for them |
| Displaying weight with daily granularity | "More data = more useful" assumption | 7-day rolling average only; raw daily weight is a psychological harm vector |
| Fetching USDA on every search keystroke | Standard search UX assumption | Debounce + Supabase cache; USDA rate limit is not forgiving |
| Passing raw user food input into Claude prompts | Convenience; skipping sanitization feels harmless | Always wrap user input in delimiters; pre-screen with Haiku harmlessness check |
| Generating TypeScript DB types manually | One-time setup pain | Use `supabase gen types typescript` in CI — types drift silently when done manually |
| Treating iOS PWA as identical to Chrome PWA | Desktop-first testing assumptions | Maintain an actual iPhone for testing; check iOS compatibility for each new feature |
| Storing service-role key in Vite env file | Vite env vars are bundled into client JS | Service-role key belongs only in Supabase Edge Functions / server-side code |
| Designing for HIPAA later | "We'll add compliance when we scale" | Determine your HIPAA exposure status before building — it affects every technical decision |

---

## Legal / Compliance Considerations

### When Does Bloom Become a HIPAA-Covered Entity?

Bloom is NOT a HIPAA-covered entity if:
- It does not transmit health data to/from healthcare providers or insurers
- Users enter their own data voluntarily with no clinical care relationship
- The AI coach provides general nutrition information, not clinical diagnosis

Bloom BECOMES subject to heightened scrutiny if:
- It integrates with EHR systems or insurance billing
- A healthcare provider recommends or prescribes it to patients
- It stores data under a Business Associate Agreement with a covered entity

**Current verdict:** Bloom in its described form (self-entered nutrition/cycle tracking with AI insights) is likely not a HIPAA-covered entity. BUT this determination should be made by a healthcare attorney before launch, not assumed.

### FTC Health Breach Notification Rule

Even outside HIPAA, the FTC Health Breach Notification Rule (strengthened in 2024) applies to non-HIPAA health apps that experience a breach of identifiable health data. This includes cycle tracking, symptom data, and weight history. Bloom must have an incident response plan.

### Medical Disclaimer Requirements

Any AI-generated content touching health must include:
- Clear "not medical advice" disclaimer
- Recommendation to consult a healthcare provider for medical decisions
- Specific disclaimer that AI insights are based on user-entered data and may be inaccurate

These disclaimers must appear in the UI adjacent to AI content, not buried in Terms of Service.

### GDPR (if EU users are expected)

Even as a US startup, if EU users can sign up:
- Right to erasure ("delete my account") must delete all associated data from Supabase
- Lawful basis for processing health data must be explicit consent
- Data residency: Supabase allows EU region selection — use it if targeting EU

---

## Phase-by-Phase Risk Map

| Phase | Top Risks | Mitigation Priority |
|---|---|---|
| Phase 1: Foundation (Auth, DB, PWA setup) | RLS not enabled on all tables; service-role key in client; no data deletion flow; PWA cache update pattern missing | CRITICAL — fix before any user data is stored |
| Phase 2: Food Logging | USDA rate limit hit; barcode coverage gaps; no Supabase food cache; glycemic load data gap not architected | HIGH — affects core product usability |
| Phase 2: Dashboard | Weight displayed with daily granularity; calorie restriction framing; no eating disorder safeguards | HIGH — psychological harm risk |
| Phase 3: AI Integration | Claude hallucinating medical advice; no harmlessness screen; cost blowup from uncached calls; prompt injection via user food names | CRITICAL — AI safety before any AI features ship |
| Phase 3: Cycle Tracking | Cycle data not flagged as sensitive in analytics; no deletion workflow; no privacy policy | HIGH — post-Roe legal exposure |
| Phase 4: PWA/Offline | iOS Safari breaking offline sync; service worker stale cache on deploy; background sync failing | MEDIUM — test on real devices, not simulator |
| Phase 5: Coach Portal | Building before user validation; scope creep from "AI coaching" into clinical advice territory | MEDIUM — validate need with users first |
| Any phase | TypeScript DB types drifting from schema; Supabase concurrent refresh races | MEDIUM — enforce in CI from the start |

---

## Sources

- Supabase RLS Documentation: https://supabase.com/docs/guides/database/postgres/row-level-security (official)
- Supabase Auth Conflict Error: https://github.com/supabase/supabase/blob/master/supabase/packages/shared-data/error-codes.ts (official — concurrent refresh conflict documented)
- Supabase Realtime Limits: https://supabase.com/docs/guides/realtime/limits (official — Free: 100 joins/sec, Pro: 500)
- Supabase TypeScript Type Generation: https://supabase.com/docs/guides/api/rest/generating-types (official)
- Claude API Rate Limits: https://platform.claude.com/docs/en/api/rate-limits (official)
- Claude Cost Report API: https://platform.claude.com/docs/en/build-with-claude/usage-cost-api (official)
- Claude Prompt Injection Mitigations: https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks (official)
- Claude User Wellbeing Guidelines: https://platform.claude.com/docs/en/release-notes/system-prompts (official — self-harm/unhealthy eating guidance)
- Claude PHI Detection: https://platform.claude.com/docs/en/test-and-evaluate/develop-tests (official)
- Vite PWA Plugin Background Sync: https://github.com/vite-pwa/vite-plugin-pwa/blob/main/docs/workbox (official)
- Vite Bundle Splitting: https://github.com/vitejs/vite/blob/main/docs/blog/announcing-vite3.md (official)
- USDA FoodData Central API: https://fdc.nal.usda.gov/api-guide.html (official — 1,000 req/hr limit)
- FTC Health Breach Notification Rule 2024 update: https://www.ftc.gov/legal-library/browse/rules/health-breach-notification-rule
