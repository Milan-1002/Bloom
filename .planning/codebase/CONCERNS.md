# Codebase Concerns

**Analysis Date:** 2026-05-18

---

## 1. Critical — Must Resolve Before Launch

### No Authentication or Authorization

- **What:** The entire prototype (`bloom-app-design/project/`) has zero auth. No sign-in, no session management, no user identity. All data is hardcoded to a single fictional user ("Maya Rivera").
- **Why it matters:** Every piece of data in the app is health-sensitive (weight, cycle, symptoms, food logs). Without auth, there is no user isolation — any data stored would be publicly accessible or shared across users.
- **What needs to happen:** Implement auth before writing any persistent data layer. Supabase Auth (email/password + magic link) is the natural choice given the stack. Session tokens must be passed with every API call. Role separation is also required: users vs. coaches must have separate access scopes.

### No Real Database — All Data Is Hardcoded

- **What:** Every number in the app is a hardcoded JavaScript constant. `Home.jsx` line 8 shows `const totals = { protein: 78, fiber: 21, gl: 38 ... }`. `Weight.jsx` line 4 has `const series = [64.8, 64.6, ...]`. Nothing persists.
- **Why it matters:** The app's entire value proposition is tracking change over time. Without a real database, nothing can be stored, retrieved, or analyzed.
- **What needs to happen:** Design and implement the database schema before building any screen interactions. Core tables needed: `users`, `food_logs`, `symptom_logs`, `weight_logs`, `coach_protocols`, `cycle_entries`. Supabase (PostgreSQL) is the intended backend.

### No Food Database Integration — Barcode and Search Are Fully Mocked

- **What:** `Logging.jsx` shows a search UI and a barcode scanner UI, but both are pure visual props. Search results are hardcoded from `data/foods.js`. The barcode scanner (`BarcodeScan()`, line 101) shows a camera viewfinder with no actual scanning capability.
- **Why it matters:** The food logging feature — the app's primary daily action — does not function at all. The "PCOS-friendly" and glycemic load tags shown on food results require a database with GI/GL data per food item. This data does not exist in `foods.js` (GL values are manually written approximations).
- **What needs to happen:** Integrate a real food database API. Top candidates: USDA FoodData Central (free, US-focused, lacks GI/GL), Open Food Facts (barcode data, community-maintained), or a paid option like Nutritionix (has GI data). A barcode scanning library (e.g., `react-native-vision-camera` + `react-native-mlkit-barcode-scanning` for React Native, or `@zxing/library` for web) must be integrated. Glycemic index data is a separate concern — no single free API provides reliable GL per barcode.

### No Coach Dashboard Exists (Half of the Two-Sided System)

- **What:** `Coach.jsx` shows the user side (viewing a coach's protocol), but there is no coach-facing dashboard anywhere in the prototype. Coaches cannot log in, create protocols, assign meal templates, set targets, or view client progress. The "Plan v3" label in `Coach.jsx` line 55 implies versioning, but no versioning system is designed.
- **Why it matters:** Every user-facing coaching feature (protocol targets, meal templates, coach notes, "Share with coach" CTA in `Insights.jsx`) depends on coaches being able to enter data. Without a coach dashboard, the coaching system cannot function.
- **What needs to happen:** Design and build a separate coach-facing web app or admin panel. Minimum viable: coaches can set daily targets (protein, fiber, GL, added sugar), write meal template descriptions, add notes, and view a client's weekly summary. Protocol versioning (tracking when targets change and what they were) must be implemented so historical data remains accurate.

### Health Data Stored Without PHI/Security Architecture

- **What:** The app collects: menstrual cycle data (start date, phase), weight history, symptom ratings (mood, energy, bloating, sleep, skin, cravings), food intake, and PCOS diagnosis status (Onboarding.jsx, line 124: "Confirmed / Suspected / Managing symptoms"). No privacy architecture, encryption strategy, or data access controls are designed.
- **Why it matters:** This is Protected Health Information under most jurisdictions. Cycle data is additionally sensitive under post-Roe US law — several states have prosecuted individuals using period tracking data. A breach or subpoena of this data could directly harm users.
- **What needs to happen:** Define a data classification policy. Encrypt sensitive columns at rest (Supabase supports column-level encryption via `pgcrypto`). Implement row-level security (RLS) policies in Supabase so users can only read their own rows. Define a data retention and deletion policy. Consult a lawyer on HIPAA applicability if any coaches are licensed healthcare providers. Add a privacy policy disclosing what data is collected, how it is stored, and what happens if a legal request is received.

---

## 2. High — Address Early in Development

### No Medical Disclaimer

- **What:** The app provides nutritional guidance framed as health advice: "You're trending steady 🌱", "Coach: lean into strength workouts", "fasting insulin under 10 by next labs" (`Coach.jsx` line 77). No screen includes a disclaimer that this is not medical advice.
- **Why it matters:** PCOS involves hormonal, metabolic, and reproductive health. Incorrect nutritional guidance could cause harm. Without a disclaimer, the app may be liable under FTC regulations or medical device definitions in some jurisdictions.
- **What needs to happen:** Add a medical disclaimer to onboarding (must be accepted before use), to the Terms of Service, and as a persistent footnote on any screen showing health recommendations. Lawyer review of whether the "insulin balance" score or coach-generated clinical targets (e.g., "fasting insulin under 10") cross the threshold of regulated medical advice.

### External Images Hotlinked from Unsplash — No License for Production

- **What:** Every food photo, coach avatar, user avatar, and background image in the prototype is a direct Unsplash URL. Examples: `data/foods.js` lines 8–103, `Home.jsx` line 32 (user avatar), `Coach.jsx` line 51 (coach avatar), `Onboarding.jsx` line 19 (hero background). There are approximately 20+ distinct hotlinked Unsplash images.
- **Why it matters:** Unsplash's free license does not permit hotlinking in production apps at scale, and does not allow using photos of real people as fake profile photos (coach avatar at `photo-1622253692010-333f2da6031d`). Using a real person's photo as a fictional "Marco Vidal, RDN" is a misrepresentation risk.
- **What needs to happen:** For food photos: license images via Unsplash paid plan or switch to Open Food Facts images (tied to actual food products). For avatar images: use generated avatars (DiceBear, UI Avatars) or original photography. Never use a real person's photo as a fictional persona. For background/hero images: license or commission original assets.

### "Insulin Balance" Score Has No Defined Algorithm

- **What:** `Home.jsx` line 23 shows `const insulinScore = 78;` — a hardcoded integer with no calculation. The UI labels it "INSULIN BALANCE · TODAY" and displays it as a 0–100 score. No formula exists anywhere in the codebase.
- **Why it matters:** This is the hero metric on the primary screen, visible every time a user opens the app. If it is presented as a meaningful health indicator, it must be based on a defensible methodology. An arbitrary or poorly designed formula could mislead users about their actual insulin sensitivity.
- **What needs to happen:** A registered dietitian or medical advisor must define the algorithm. Candidate inputs: daily protein/fiber/GL ratios vs. targets, added sugar intake, and symptom data (if included). The algorithm must be documented, reviewed, and the score must be clearly labeled as an estimate, not a clinical measurement. Consult with the coach (Marco Vidal or a medical reviewer) before shipping this feature.

### Cycle Phase Detection Is Not Implemented

- **What:** The app shows "Follicular phase · Day 11" on multiple screens (`Home.jsx` line 63, `Symptoms.jsx` line 33, `Recipes.jsx` line 50). This requires knowing the user's last period start date and calculating the current cycle phase. No logic for this exists — phase is a hardcoded string.
- **Why it matters:** Cycle-aware features (recipe recommendations by phase, coach suggestions like "lean into strength workouts") depend entirely on correct phase detection. Showing the wrong phase could undermine user trust and the coaching relationship.
- **What needs to happen:** Implement a cycle tracking data model. Minimum: store `period_start_date` and `average_cycle_length` (defaulting to 28 days). Calculate current day number and phase (menstrual: days 1–5, follicular: days 6–13, ovulation: days 14–16, luteal: days 17–28) as a derived value. Handle irregular cycles gracefully — PCOS users frequently have irregular periods, so the app must not assume a regular 28-day cycle.

### Offline Logging Not Supported

- **What:** The design assumes always-on connectivity. No caching, no local queue, no conflict resolution strategy exists.
- **Why it matters:** Users frequently log meals without reliable connectivity — at restaurants, while traveling, in gyms. If logging fails silently, data is lost. If the app shows an error, it disrupts a habitual daily behavior that is core to the app's retention model.
- **What needs to happen:** Implement optimistic writes with a local queue. Use `IndexedDB` (web) or `AsyncStorage`/SQLite (React Native) to store pending logs locally. Sync when connectivity resumes. Display sync status to the user. Define conflict resolution rules (last-write-wins is acceptable for food logs; weight logs may need date deduplication).

### No Accessibility Implementation

- **What:** The prototype has zero ARIA attributes, no keyboard navigation, no focus management, no screen reader labels, and no high-contrast mode. Color alone is used to convey status (e.g., mint = good, coral = warning throughout).
- **Why it matters:** PCOS disproportionately affects women who may also have related conditions (e.g., thyroid issues, anxiety) that co-occur with visual or motor disabilities. Beyond ethics, WCAG 2.1 AA compliance is legally required in many markets (EU, UK, and ADA-covered US services).
- **What needs to happen:** Audit all interactive elements for keyboard accessibility and ARIA labeling. Every chart and ring visualization needs an accessible text alternative. Color status indicators need a secondary indicator (icon, text, or pattern). Target WCAG 2.1 AA minimum.

---

## 3. Medium — Address Before Public Launch

### Glycemic Load Values Are Manually Approximated

- **What:** `data/foods.js` contains manually written GL values (e.g., `salmonBowl: { gl: 13 }`, `oats: { gl: 14 }`). These are reasonable estimates for the demo foods, but they are not sourced from a validated database.
- **Why it matters:** GL is the primary differentiating health metric in this app (vs. calorie-only trackers). Incorrect GL values undermine the app's clinical credibility and could lead to poor dietary guidance.
- **What needs to happen:** Source GL values from a peer-reviewed database (e.g., the University of Sydney GI database, or validated values from Atkinson et al. 2008). For user-logged foods, GL must be calculated from `(GI × net carbs) / 100` per serving — requiring a GI value per food, which most free food APIs do not provide. Document the source of all GL values used.

### Weight Tracking Needs Body-Image-Safe UX Design

- **What:** `Weight.jsx` prominently displays: loss in kg since start (`"3.9 kg lost since Mar 2"`, line 36), goal weight progress ring, weekly deltas with celebratory chip styling, and BMI (`"22.4"`, line 78). The design uses a downward trend as always-positive framing.
- **Why it matters:** PCOS is associated with elevated risk of disordered eating and body dysmorphia. Weight-centric design that celebrates loss and prominently displays BMI may trigger or reinforce harmful behaviors. PCOS organizations (Resolve, Verity) recommend moving away from weight-loss framing for PCOS management.
- **What needs to happen:** Review the weight tracking UX with a PCOS-specialized dietitian or psychologist. Consider: making goal weight optional, removing BMI from the default view (it is not a valid PCOS metric), framing progress as "consistency" rather than "loss", and adding an option to disable weight display for users who prefer not to track it.

### No Push Notification Infrastructure

- **What:** `Profile.jsx` shows reminders for meal logging (3x daily), evening check-in (9pm), morning weigh-in (7:30am), and period predictions (2 days before). None of these work — there is no notification system.
- **Why it matters:** Logging reminders are a primary retention driver. Users who miss the habit of opening the app daily will churn. Period predictions require timely delivery.
- **What needs to happen:** Implement push notifications via Firebase Cloud Messaging (FCM) for Android / APNs for iOS, or a service like OneSignal. Store user notification preferences in the database. Schedule reminders server-side (Supabase Edge Functions + pg_cron, or a scheduler like Inngest).

### Coach Protocol Versioning Has No Strategy

- **What:** `Coach.jsx` line 55 and `Profile.jsx` line 41 both display "Plan v3". There is no data model for protocol versions, no history of what changed between versions, and no record of which targets applied on which dates.
- **Why it matters:** Insights and correlations in `Insights.jsx` compare current vs. past performance. If coach targets change (e.g., protein target increases from 100g to 120g), historical compliance data becomes meaningless unless the target at the time of each log is preserved.
- **What needs to happen:** Design a `coach_protocols` table with a version number, effective date, and archived flag. When a coach updates targets, create a new version rather than overwriting. When calculating historical compliance, join against the protocol version active on that date.

### "Share with Coach" Has No Backend

- **What:** `Insights.jsx` line 97 has a "Share with coach" CTA button. `CoachLink.jsx` describes "share weekly summaries." No mechanism for this data transfer is designed — no email, no in-app message, no PDF export, no push to coach dashboard.
- **Why it matters:** Coach communication is a core differentiator. If users tap "Share with coach" and nothing happens, they lose trust in both the app and the coach relationship.
- **What needs to happen:** Define the sharing mechanism. Simplest viable: generate a PDF or structured JSON summary of the week (macro averages, symptom trends, weight change) and email it to the coach's registered address. More sophisticated: a real-time coach dashboard with notification when a user shares. Must be implemented before coaches onboard clients.

### Health App Integrations Are Unimplemented

- **What:** `Profile.jsx` shows Apple Health, Withings scale, and Oura ring integrations. None are implemented. Apple Health integration (HealthKit) requires a specific native entitlement from Apple and a native app (not a web app). Withings and Oura require OAuth flows.
- **Why it matters:** These integrations are shown in the design as features users would actively enable during setup. Showing them as present but non-functional will frustrate early adopters.
- **What needs to happen:** Decide which integrations are in v1 scope. Apple Health / Google Health Connect require a native mobile app (React Native or a native wrapper) — this is a platform decision that affects the entire tech stack. If targeting web-only initially, remove these from the UI or clearly label them as "Coming soon."

### No Data Export Feature Despite Being Shown in UI

- **What:** `Profile.jsx` line 75 shows an "Export my data" button. No export functionality exists.
- **Why it matters:** Data portability is both a user expectation and a legal requirement under GDPR (Europe), UK GDPR, and increasingly under US state privacy laws. Failing to honor a data export request within the required timeframe (30 days under GDPR) is a compliance violation.
- **What needs to happen:** Implement a data export endpoint that compiles all user data (food logs, symptom logs, weight logs, profile data) into a downloadable CSV or JSON bundle. This must be available before launch in any jurisdiction with data portability laws.

---

## 4. Low — Nice-to-Have Improvements

### Insights Correlations Are Hardcoded, Not Computed

- **What:** `Insights.jsx` scatter plot (lines 33–44) uses hardcoded `{ x: 32, y: 5 }` data points. The "Winning pattern" and all three `PatternCard` items are static strings.
- **Why it matters:** Once real data exists, the insights must be computed from actual user logs. The current design assumes a correlation engine that does not exist.
- **What needs to happen:** Build a server-side computation layer (Supabase Edge Functions or a background job) that calculates rolling correlations between dietary metrics and symptom scores. Define the minimum data threshold before showing a pattern (e.g., at least 5 data points). Treat generated insights as suggestions, not conclusions.

### "PCOS-Friendly" Food Tagging Has No Definition

- **What:** `Logging.jsx` shows a "PCOS" chip on search results and a "PCOS-friendly" tag on the food detail view. The filter chip "PCOS-friendly" in the search bar is a first-class feature. There is no defined ruleset for what qualifies as PCOS-friendly.
- **Why it matters:** If the classification is wrong or inconsistent, it misleads users about their food choices. If it is arbitrary, it has no clinical value and exposes the app to nutritional misinformation claims.
- **What needs to happen:** Define a scoring ruleset in collaboration with a registered dietitian. Candidate criteria: GL < 15, protein-to-carb ratio ≥ 0.5, fiber ≥ 3g per serving, low added sugar (< 5g). Document the criteria transparently in the app.

### Coach Network / Discovery Is Shown but Not Scoped

- **What:** `Onboarding.jsx` line 238 shows "Find a PCOS-trained coach — Browse Bloom's vetted network." A coach discovery and vetting marketplace is implied but not scoped anywhere.
- **Why it matters:** Running a coach marketplace requires: coach verification/credentialing, contract terms between Bloom and coaches, liability considerations for nutrition advice, and a payment/subscription model. This is a significant product surface that is currently a single placeholder row.
- **What needs to happen:** Explicitly define whether a coach marketplace is in scope for v1. If not, remove the UI element or replace it with a waitlist CTA. If it is in scope, it requires significant legal and product work before development begins.

### Macros Screen and Diary Screen Not Fully Explored

- **What:** `screens/Macros.jsx` and `screens/Diary.jsx` were not read during this audit.
- **Why it matters:** Concerns specific to those screens may exist beyond what is captured here.
- **What needs to happen:** Review `bloom-app-design/project/screens/Macros.jsx` and `bloom-app-design/project/screens/Diary.jsx` during detailed planning for those features.

### No Error States Designed for Any Screen

- **What:** Every screen in the prototype shows the happy path with full data. No empty states (first-time user with no logs), no error states (API failure), no loading states (data fetching), and no partial-data states (logged breakfast but not lunch) are designed.
- **Why it matters:** Real users encounter all of these states on day one. The home screen with an empty food diary, the insights screen with only 2 days of data, and the weight screen with a single entry are all common early-user experiences that are completely undesigned.
- **What needs to happen:** Design empty and error states for at minimum: Home (no meals logged today), Insights (insufficient data for correlations), Weight (only one entry), and any screen where data is loaded from the network. Loading skeletons and pull-to-refresh behavior should also be specified.

---

*Concerns audit: 2026-05-18*
