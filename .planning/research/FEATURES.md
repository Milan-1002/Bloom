# Features Research: Bloom

**Domain:** PCOS-aware nutrition companion (web PWA)
**Researched:** 2026-05-18
**Confidence:** HIGH (domain well-established; competitor knowledge from training data pre-Aug 2025; PCOS nutritional science is stable)

---

## Table Stakes (must-have or users leave)

### Food Logging

Users of any serious nutrition app expect all of these. Missing any one causes immediate churn — the
friction of manual lookup is already high enough that users quit if any shortcut is broken.

| Pattern | User expectation | Notes for Bloom |
|---------|-----------------|-----------------|
| Text search food database | Type a food name, get instant results | USDA FoodData Central via API; show top 5–10 results, not paginated list |
| Barcode scan | Point camera, get macros auto-filled | Camera API works in modern mobile browsers (PWA); use `@zxing/browser` or `html5-qrcode` library |
| Recent foods | Last 10–20 foods logged, one-tap re-add | Most common logging action by frequency; cache in Supabase user table |
| Favorites / saved foods | Star foods for permanent quick-access | Separate from recents; user explicitly saves |
| Custom food creation | Enter name + macros manually | Required for homemade meals, restaurant food not in database |
| Serving size adjustment | Stepper UI (0.5x, 1x, 1.5x, 2x) + gram entry | Design already shows stepper; also allow gram input for precision |
| Meal slots | Breakfast / Lunch / Snack / Dinner | Fixed slots are fine for v1; custom slots are a nice-to-have |
| Timestamp on entries | Auto-stamps current time; editable | Critical for pattern detection (meal timing vs. symptoms) |
| Edit / delete logged items | Tap entry to edit serving, swipe-to-delete | Users mis-log constantly; no edit = rage churn |
| Quick-add calories | Log bare kcal without macro detail | Escape valve when database fails; collect kcal so day total stays coherent |

**What the design already has:** Search, barcode scan, recent foods, PCOS-friendly filter tag, serving stepper, meal slots. Missing from design: custom food creation, edit/delete interaction pattern.

### Dashboard & Progress

| Element | Why expected | Bloom's take |
|---------|-------------|--------------|
| Calorie ring / total vs. target | Anchor number every user looks at first | Show kcal ring in diary; secondary on home dashboard |
| Macro breakdown (P/C/F) | Standard since MyFitnessPal popularized it | Show as progress bars or rings; Bloom adds fiber as 4th primary macro |
| "Remaining" framing | "You have 420 kcal left" beats "consumed 1280" | Helps users plan the rest of the day |
| Today's meals summary | Scrollable list of what was logged | Home screen has this; keep it above the fold |
| Quick-log CTA | "Add meal" or "+" always reachable | Bottom tab + FAB or persistent card; design uses persistent "Log dinner" CTA |
| Net-zero feedback | Color change when goal is met | Green/mint for protein goal met; amber for GL ceiling approaching |

### History & Trends

Users expect to see more than just today. Without history, they can't see if they're improving.

| View | Minimum viable | What to build |
|------|---------------|---------------|
| Weekly macro trend | Bar chart, 7 days | Show protein, fiber, GL bars side-by-side per day |
| Weight trend | Line chart, 30+ days | Already designed; 7-day sparkline on home + full chart on weight screen |
| Symptom heatmap | Calendar grid | Already designed; 7-day heatmap on symptoms screen |
| Day navigation | Swipe or date-strip to past days | Already designed; 7-day strip on diary screen |
| Weekly summary stats | Avg fiber, avg GL, avg protein | Already designed on insights screen |

### Goal Tracking UI Patterns

| Pattern | Standard | Notes |
|---------|----------|-------|
| Floor targets | Show "X of 120g" for protein | Users are chasing a floor |
| Ceiling targets | Show "X of 100 max" for glycemic load | Users are staying under a ceiling — reverse polarity |
| On-track chip | "On track" or checkmark when ≥80% of floor or ≤80% of ceiling | Already in design (mint chip) |
| End-of-day summary | "Today was a great day" style wrap-up | Low-effort motivation; push notification or inline card |

---

## PCOS Differentiators

These are features no general nutrition app gets right. They are Bloom's reason to exist.

### Glycemic Load Tracking (not just GI)

**Why GL beats GI for PCOS users:**
Glycemic Index measures blood sugar impact per gram of carbohydrate. Glycemic Load accounts for the
actual carbohydrate quantity in a serving. A watermelon has a high GI but low GL per serving — GI
alone would tell a PCOS user to avoid it unnecessarily. GL = GI × (net carbs per serving) / 100.

**What to build:**
- GL per food item, surfaced on the food detail card (already designed)
- Daily GL total vs. ceiling target (already designed: 100 max, shown as "low impact" at 27)
- GL timeline chart: bar per meal showing contribution across the day (already designed on macros screen)
- "Where the load came from" breakdown by meal (already designed)
- Per-food GL badge on search results and diary rows (already designed: "GL 8" chip)
- Coach note surfaced at GL ceiling approach (e.g., "You're at 85 of 100 GL — skip the rice tonight")

**GL calculation:** USDA provides GI values for some foods; for others, use established GL reference
tables (Harvard GI database). For unknown foods: estimate from carb type (refined vs. whole grain).
Flag estimated values vs. verified values in the UI.

**Confidence:** HIGH — GL calculation formula is established; USDA coverage is partial so estimation
logic needs careful design.

### Protein-to-Carb Ratio Tracking

**Why it matters for PCOS:**
Insulin resistance (affecting ~70% of PCOS women) is directly modulated by the protein-to-carb ratio
at each meal. A ratio of 1:1 to 1:1.5 (P:C) tends to blunt post-meal insulin spikes. Cronometer
tracks macros but never surfaces this ratio. MyFitnessPal doesn't show it at all.

**What to build:**
- P:C ratio displayed on diary totals card (already designed: "1 : 1.6" with target "1 : 1.2")
- P:C ratio on the macros deep-dive screen with ratio visual bar (already designed)
- Per-meal P:C hint: "This meal is carb-heavy — pair with 20g protein"
- Added sugar tracked separately from total carbs (already designed: 6g vs. 15g ceiling)

**Confidence:** HIGH — the clinical rationale is well-documented in PCOS nutritional research.

### Insulin Balance Score

**What it is:**
A composite score (0–100) synthesizing: protein adequacy, fiber adequacy, GL vs. ceiling, added sugar
vs. limit, and P:C ratio. Not a medical metric — a motivational daily "how insulin-friendly was today"
indicator.

**What to build:**
- Ring display on home dashboard hero card (already designed: score 78, "trending steady")
- Short narrative summary tied to the score ("Fiber is on point. Add 40g protein at dinner")
- Score history in the insights screen (implied but not yet in design)
- Score calculation: Claude API generates it from the day's log + targets — not a static formula

**Key UX constraint:** Never show score without its narrative. A bare number like 78 means nothing to
a user; "You're on track — lunch GL was your highest single meal" makes it actionable.

**Confidence:** HIGH for the concept; MEDIUM for the exact weighting formula (Claude will generate
this dynamically, so static weighting is not needed at launch).

### Cycle-Phase Nutrition

**The four phases and their nutritional implications:**

| Phase | Days (28-day cycle) | Nutritional focus | Bloom behavior |
|-------|---------------------|-------------------|----------------|
| Menstrual | 1–5 | Iron-rich foods, anti-inflammatory, easy digestion | Lower protein targets OK; surface iron-rich recipe suggestions |
| Follicular | 6–13 | Higher carb tolerance, lean protein, variety OK | Standard targets; energy peak coaching |
| Ovulatory | 14–16 | Light meals, raw foods, high antioxidants | Shorter eating windows suggested; surface antioxidant-rich recipes |
| Luteal | 17–28 | Higher protein, complex carbs, magnesium, less sugar | Tightest GL ceiling; progesterone support foods |

**What to build:**
- Cycle day calculation from last period start date (already in project requirements)
- Phase banner on symptoms screen (already designed: "Follicular phase · Day 11")
- Phase-aware recipe curations (already designed: "Marco's picks for follicular phase")
- Phase-specific coaching nudge on home dashboard (subtle, not medical)
- AI targets that shift with phase: luteal GL ceiling tighter (~80 vs. 100), protein floor higher

**What NOT to build yet:**
- Fertility tracking, ovulation prediction, or basal body temperature logging — this is a nutrition
  app, not a cycle tracker. Users who want that have Clue or Natural Cycles. Bloom's cycle awareness
  is nutritional context only.

**Confidence:** HIGH for phase definitions; MEDIUM for exact macro adjustments per phase (AI generates
these, so Bloom doesn't need hard-coded values).

### Symptom Correlation

**What makes it different:**
Logging symptoms alone (like Bearable or Cara Care does) is useful. Correlating symptoms with food
choices is the feature no competitor has implemented well.

**What to build:**
- Daily symptom check-in: energy, mood, sleep, bloating, skin, sugar cravings (already designed)
- 1–5 scale per symptom, with "lower is better" inversion for bloating/cravings/skin (already in design)
- Free-text notes with quick-tag chips (already designed: "+Cravings", "+Headache", "+Workout")
- Weekly correlation insight: "On days with ≥25g fiber, your energy averaged 4.2/5" (already designed)
- Scatter chart: fiber vs. energy, GL vs. bloating (already designed on insights screen)
- Pattern detection: "High-GL lunches → afternoon energy dip" (already designed as pattern cards)

**Implementation note:** For v1, correlation can be simple (Pearson-r on 7-day rolling window is
enough). Claude API can narrate the pattern in natural language. Do not build a full statistical
pipeline — keep it simple and explainable.

**Confidence:** HIGH for the concept; MEDIUM for the statistical approach (start simple, validate).

### Anti-Inflammatory Food Indicators

**Why PCOS users need this:**
PCOS has a chronic low-grade inflammatory component. Foods high in omega-3s, polyphenols, and
magnesium are beneficial; processed foods, refined grains, and trans fats exacerbate symptoms.

**What to build (v1):**
- "PCOS-friendly" tag on food search results and food detail (already designed)
- Anti-inflammatory filter on recipe browser (already designed: "Anti-inflam" chip)
- Brief callout on food detail: "Omega-3s + lean protein + slow carbs from quinoa" (already designed)

**What NOT to build v1:** Inflammation scoring per food, inflammatory index calculations, or
food-specific anti-inflammatory ratings. The science is contested and complex — stick to qualitative
tagging based on established PCOS dietary guidelines.

**Confidence:** MEDIUM — tagging criteria need a defensible, stable food list.

---

## Coach Integration Features

### What coaches need to see (read-only access)

Based on how registered dietitians and nutrition coaches work with PCOS clients:

| Data coaches want | Priority | Notes |
|-------------------|----------|-------|
| Full food diary (all meals, all days) | Critical | Must be accessible without logging in as the user |
| Daily and weekly macro trends | Critical | Charts, not just raw numbers |
| Symptom trends over time | High | Bloating, energy, mood trends reveal protocol effectiveness |
| Weight trend | High | Weekly averages; daily noise is misleading |
| Glycemic load trend | High | Coach's primary PCOS intervention lever |
| Adherence to plan | High | "Client logged 6 of 7 days this week" |
| Last login / last log date | Medium | Coach needs to know if client has gone quiet |
| Client notes from symptom check-in | Medium | Free-text is valuable clinical context |

### Coach protocol (what users see from coaches)

Already designed and well-scoped:
- Daily macro targets (floor/ceiling per nutrient) — coach sets, user sees
- Meal templates ("30g protein · 1 fat · ½ cup berries") with example recipes
- Weekly habit targets (walk after meals, sleep before 11pm, etc.)
- Coach note / motivational message shown on protocol screen

### Invite flow

- Shareable link or 6-digit code (simpler) that creates a read-only coach access record in Supabase
- Link/code expires or is revocable by user
- Coach sees a simplified dashboard of the user's data — not the app's full UI
- No coach-side account creation required for v1 (coach gets a magic link that opens a read-only view)

**What to NOT build for v1:**
- Messaging between coach and user (coaches communicate via WhatsApp, email, Zoom — they don't need
  in-app messaging)
- Coach marketplace or matching
- Coach editing the user's data
- Multiple coaches per user

**Confidence:** HIGH for the read-only model; MEDIUM for the exact sharing mechanism.

---

## AI Personalization Features

### What AI should do (right-sized for Bloom)

The risk with AI features is either doing too little (feels generic) or too much (feels overwhelming /
untrustworthy). The right scope for v1:

| AI job | When triggered | Output |
|--------|---------------|--------|
| Generate daily macro targets | On profile creation, on PCOS type change, on cycle day change | Protein floor, fiber floor, GL ceiling, calorie range, added sugar limit |
| Generate Insulin Balance score + narrative | Once per day (or when log is updated, debounced) | Score 0–100 + 1–2 sentence narrative |
| Generate weekly insight narrative | Once per week (Monday AM) | Top correlation, top pattern, what to try this week |
| Phase-aware coaching tip | On phase change (4 times per cycle) | 1–2 sentences: what this phase means nutritionally |

**What AI should NOT do:**
- Generate meal plans (high liability, complex personalization, user wants flexibility)
- Diagnose or assess symptoms clinically
- Make medical recommendations
- Respond to free-form chat (too open-ended, scope creep, liability)
- Run on every food log entry (cost and latency)

### UX for AI-generated content

Key principle: AI content must feel like a knowledgeable friend, not a clinical report or a chatbot.

- Always show AI content in natural language, first person: "You're trending steady" not "Score: 78/100"
- One primary AI callout per screen — not multiple AI-generated paragraphs
- Show the reasoning: "Fiber is on point" explains the score; don't just show the number
- Label AI content subtly (small "AI" or sparkle icon) but don't over-disclaim
- Cache aggressively: re-generate targets once per day max, not per page load
- Graceful fallback: if Claude API fails, show yesterday's targets or a simple formula-based fallback

**Confidence:** HIGH for the scope boundaries; MEDIUM for exact prompting strategy (needs tuning).

---

## Competitor Analysis

### MyFitnessPal — what it does well, where it fails PCOS users

**Strengths:**
- Massive food database (300M+ foods); barcode scan works on almost everything
- Social features and community engagement drive retention
- Calorie tracking UX is polished and fast
- Integration with Apple Health, Garmin, Fitbit

**PCOS failures:**
- Tracks calories and standard macros (P/C/F) only — no fiber as a primary metric, no glycemic load
- No cycle awareness whatsoever
- No symptom logging
- "Net calories" model (calories in minus exercise calories out) is actively counterproductive for
  PCOS users who shouldn't restrict calories but should manage insulin
- Premium paywall for macro goals makes the core PCOS use case inaccessible at free tier
- No coach integration model

**Bloom's counter-positioning:** Don't compete on database size. Compete on what MyFitnessPal cannot
do: glycemic load, cycle-phase awareness, insulin score, symptom correlation.

### Cronometer — what it does well, where it fails PCOS users

**Strengths:**
- Best-in-class micronutrient tracking (magnesium, vitamin D, zinc — all relevant to PCOS)
- Accurate, curated food database (prioritizes USDA and lab-verified entries)
- Gold-tier dietitian access for practitioners
- Detailed macro breakdown by meal

**PCOS failures:**
- Firehose of data overwhelms users — tracks 50+ nutrients, most irrelevant to PCOS users' daily needs
- No glycemic load calculation
- No cycle tracking
- No symptom logging
- UX is clinical and dense — not appropriate for the emotional health journey of PCOS management
- No AI personalization

**Bloom's counter-positioning:** Cronometer is for optimization-minded power users. Bloom is for
women who want to understand how food affects how they feel, without becoming a spreadsheet.

### Clue (period tracking) — what it does well, where it fails

**Strengths:**
- Best cycle tracking UX on the market; beautiful, female-designed, privacy-forward
- Symptom logging (mood, energy, acne, cramps) is excellent
- Phase predictions are accurate

**PCOS failures:**
- No food logging; no nutrition tracking whatsoever
- Cycle predictions are unreliable for PCOS users whose cycles are irregular — Clue's algorithm
  assumes regular cycles, which the majority of PCOS users don't have
- No insulin or glycemic load concept
- No coach integration

**Bloom's counter-positioning:** Bloom is not a period tracker. It uses cycle data as nutritional
context. Users who want Clue-level cycle depth will use both apps. Bloom should integrate (v2)
rather than compete.

### Natural Cycles / Flo + food logging

**Natural Cycles:** Fertility-focused; basal body temperature charting; medically certified. No
nutrition. No PCOS focus. Not a competitor.

**Flo:** Period and symptom tracking, similar to Clue. Has rudimentary "nutrition tips" as content,
not tracking. No food diary, no macro logging. Not a competitor in the functional sense.

**The gap:** None of these apps combine cycle phase with real food logging and personalized targets.
That gap is exactly Bloom's market.

---

## Anti-Features (deliberately NOT build)

| Feature | Why to avoid | What to do instead |
|---------|-------------|-------------------|
| Calorie counting as primary metric | Calorie restriction is counterproductive for insulin resistance; it reinforces diet-culture anxiety common in PCOS women | Show calories as context only — never as the primary goal or status indicator |
| Net calories (calories minus exercise) | MyFitnessPal's model; encourages compensatory eating; bad for PCOS insulin management | Do not subtract exercise from calorie targets |
| "Cheat day" or "Cheat meal" language | Shame-based framing; harmful for the PCOS community which has high rates of disordered eating | Use neutral language: "off-plan day" at most |
| BMI display | BMI is a flawed metric; PCOS causes weight gain via insulin resistance, not behavior; showing BMI causes shame without insight | Show weight trend only; never calculate or display BMI |
| Meal plans / rigid daily prescriptions | Creates anxiety when life interrupts the plan; PCOS users need flexibility | Meal templates (inspiration) + macro targets (goals) — not mandatory daily meal sequences |
| Streak-based gamification for logging | Breaks cause shame; PCOS symptoms cause days where logging is impossible; punishment for missing days hurts compliance | Celebrate when users log, never penalize when they don't |
| Food good/bad labeling | "Avoid this food" framing triggers restriction mentality; PCOS dietary management is about patterns not prohibition | Frame as GL values and patterns, not allowed/forbidden |
| Full social features (sharing meals, followers) | Comparison drives anxiety; PCOS community has body image sensitivity | Coach is the only sharing surface; no public feeds |
| Ovulation prediction | Irregular cycles make standard algorithms unreliable for PCOS; getting it wrong damages trust | Show cycle day and phase (based on user's last-logged period) without predicting ovulation |
| In-app messaging with coach | Scope creep; coaches communicate in existing tools; building messaging = building a messaging app | Coach sees data read-only; user shares weekly summary link |
| Subscription upsells during health moments | Showing paywall when user tries to log during a rough symptom day is bad UX and damaging to trust | v1 is free; when monetization comes, never gate health-critical logging features |

---

## Competitor Gaps (what Bloom can own)

These are white spaces no existing app fills for PCOS users:

1. **Glycemic load as a first-class daily metric** — no consumer nutrition app shows daily GL with
   a ceiling target and timeline. This is Bloom's most defensible feature technically and clinically.

2. **Insulin Balance Score** — a composite, approachable daily score for insulin-friendly eating.
   No competitor has an equivalent. Makes the abstract (insulin resistance) concrete and daily.

3. **Cycle phase as nutritional context** — Clue tracks cycles, MyFitnessPal tracks food. No app
   connects the two. "Follicular phase — your carb tolerance is higher today" is novel.

4. **Food-symptom correlation in plain language** — Cara Care does gut symptom correlation;
   no one does it for PCOS symptoms (energy, bloating, skin, mood) correlated with macros + GL.

5. **Coach read-only access with PCOS-specific data** — dietitians working with PCOS clients have
   no good tool to see a client's GL trends and symptom patterns together. This is a B2B2C growth
   lever (coaches recommend Bloom to their clients).

6. **PCOS-friendly food tagging in search** — the "PCOS-friendly" chip in search results is a
   qualitative filter that no database app provides. Even rough tagging is better than nothing.

---

## Feature Complexity Guide

| Feature | Complexity | Notes |
|---------|-----------|-------|
| User auth (Supabase) | Low | Supabase Auth handles signup/login/session; standard implementation |
| Onboarding profile form | Low | Static form; profile saved to Supabase users table |
| Period/cycle date logging | Low | Single date input; phase calculation is arithmetic |
| USDA food search | Medium | API integration; rate limits (1000/hr free tier); need debounce + caching |
| Barcode scan | Medium | Camera API in browser; needs `html5-qrcode` or `@zxing/browser`; not all browsers support it equally |
| Food logging with macros | Medium | CRUD on diary_entries table; real-time totals calculation |
| Serving size stepper | Low | Local state; recalculate macros on change |
| Custom food creation | Low | Form + insert to user_foods table |
| GL calculation per food | Medium | USDA doesn't have GL for all foods; need fallback estimation logic; needs reference dataset |
| Daily GL total + timeline | Low | Aggregate from diary_entries; chart rendering |
| Insulin Balance score (AI) | Medium | Claude API call; prompt engineering; response parsing; daily caching |
| Cycle-phase target adjustment | Medium | Phase detection logic; different targets per phase; AI prompt includes phase context |
| Symptom check-in logging | Low | Simple form; 1–5 scale per symptom; insert to symptoms table |
| Symptom heatmap | Low | 7-day grid rendering from queried data |
| Symptom-food correlation | High | Requires enough data (2+ weeks); Pearson-r or rank correlation; plain-language narration via AI |
| Weekly insight narrative (AI) | Medium | Claude API call on weekly aggregate data; caching; fallback if insufficient data |
| Weight logging + trend chart | Low | Single number entry; line chart from weight_logs table |
| Coach invite link / code | Medium | Token generation; coach_access table with RLS; coach read-only view routing |
| Coach read-only dashboard | High | Separate route/view; different layout; aggregate data queries; access validation |
| Coach protocol view (user-side) | Medium | Read from coach_protocols table; display targets + meal templates |
| Recipe library | Low | Static or Supabase-backed; filtering by tags; no user-generated content in v1 |
| PCOS-friendly food tagging | Medium | Curated tag list; applied at food-search time; needs maintainable tag database |
| PWA setup (manifest + SW) | Low | Vite PWA plugin; one-time setup; offline diary browsing as stretch |
| Notification preferences | Low | User table column; push notifications are v2 |
| Theme switcher (slate/warm/sage) | Low | CSS custom property swap via data-palette attribute; already designed |
| Dark mode | Low | data-dark attribute toggle; already in design system |

---

## MVP Feature Priority

### Must-ship for Day 1 (core loop is broken without these)

1. Auth (signup / login / session persistence)
2. Onboarding (PCOS type, goals, height/weight)
3. Food search + log (USDA, meal slots, macro display)
4. Barcode scan
5. Today dashboard (Insulin Balance score, macros vs. targets, meals)
6. AI target generation (Claude API, cached daily)
7. GL tracking per food + daily total
8. Symptom check-in
9. Weight logging
10. Period date logging + cycle phase calculation

### Ship in first weeks after launch (retention without these is lower)

11. Weekly macro + GL trends
12. Weekly insight narrative (AI-generated)
13. Symptom-food correlation (simple, 7-day)
14. Coach invite + read-only access
15. Recipe library

### Defer to v2 (validated before building)

16. Symptom-food correlation (advanced, multi-week)
17. Micronutrient tracking (iron, magnesium — relevant to PCOS but adds complexity)
18. Apple Health / Oura integration
19. Full coach portal with client management
20. Native app (iOS / Android)
21. Push notifications
22. Subscription / payments

---

## Sources

- Bloom design prototype screens (read directly): Home, Diary, Logging, Macros, Symptoms, Coach,
  Insights, Recipes (HIGH confidence — first-party source)
- Bloom PROJECT.md requirements document (HIGH confidence — first-party)
- PCOS nutritional science: established medical literature on insulin resistance, glycemic load, and
  menstrual cycle nutrition (HIGH confidence — stable domain knowledge)
- Competitor knowledge: MyFitnessPal, Cronometer, Clue, Flo, Natural Cycles — product knowledge
  from training data as of Aug 2025 (MEDIUM confidence — feature sets may have changed since)
- Glycemic Load calculation formula: Ludwig et al. (Harvard); GL = GI × net carbs / 100 (HIGH)
- PCOS phase-nutrition research: general clinical guidelines; individual variation is high (MEDIUM)
