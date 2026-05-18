# External Integrations

**Analysis Date:** 2026-05-18

## Current State

The prototype has **zero real integrations**. All data is static mock data defined in
`bloom-app-design/project/data/foods.js`. No API calls are made, no auth exists, no
database is connected.

The sections below separate **what the prototype hotlinks** from **what the production
app must integrate**.

---

## APIs & External Services

### Food Images — Unsplash (hotlinked, not integrated)

- **Status:** In use in prototype, not a real integration
- **How used:** All food photography in the prototype is hardcoded Unsplash URLs in
  `bloom-app-design/project/data/foods.js` (e.g., `https://images.unsplash.com/photo-...?w=900&q=80`)
  and inline in screen components (`bloom-app-design/project/screens/Profile.jsx`,
  `bloom-app-design/project/screens/Recipes.jsx`, etc.)
- **Production decision needed:** Direct hotlinking to Unsplash violates their ToS for
  production apps. Options: Unsplash API with proper attribution, license food photos,
  or use a CDN with uploaded assets.
- **SDK/Client:** None — raw `<img src>` URLs only
- **Auth required:** No (hotlinks work without a key; Unsplash API requires a key)

### Google Fonts (CDN, passive dependency)

- **Status:** Active in prototype
- **How used:** `bloom-app-design/project/index.html` lines 8–10 load `Manrope` and
  `Instrument Serif` from `fonts.googleapis.com`
- **Production:** Self-host fonts or keep Google Fonts CDN link — no API key required
- **SDK/Client:** None

### Food Database API (planned, not integrated)

- **Status:** Implied by UI — not yet integrated
- **Evidence:** `bloom-app-design/project/screens/Logging.jsx` renders a food search
  screen (state: `"search"`) with a search bar, filter tabs ("PCOS-friendly", "From
  coach"), and a barcode scan state (state: `"barcode"`) — both require a real food
  database backend
- **Candidates:** Open Food Facts (free, barcode-capable), Nutritionix, USDA FoodData
  Central — **no decision made yet**
- **Required for:** Food search, barcode scanning, nutritional data (kcal, macros,
  glycemic load)

---

## Data Storage

### Supabase (planned, not yet integrated)

- **Status:** Planned — no client installed, no schema defined, no Supabase project created
- **SDK:** `@supabase/supabase-js` (to be installed)
- **Connection:** Will require `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` env vars
- **Planned tables (from project memory):**

| Table | Purpose |
|-------|---------|
| `profiles` | User profile: age, height, weight goal, PCOS flags, cycle data |
| `food_logs` | Daily meal/food entries with macros and timestamps |
| `weight_logs` | Weight measurements over time |
| `symptom_logs` | Daily symptom check-in data (energy, mood, sleep, bloating, skin, cycle) |
| `coaches` | Coach accounts (RDN/nutritionist users) |
| `coach_protocols` | Nutrition protocols created by coaches, linked to client profiles |

- **Auth:** Supabase Auth (email/password or magic link — not yet decided)
- **Real-time:** Supabase Realtime subscriptions planned for coach↔client sync
  (coach protocol updates visible to client without refresh)

**File Storage:**
- Not decided — Supabase Storage is available for user avatars and coach assets

**Caching:**
- None planned currently

---

## Authentication & Identity

### Supabase Auth (planned)

- **Status:** Not integrated
- **Implementation:** Supabase Auth handles session management, JWTs, and
  row-level security policies on all tables
- **Auth method:** TBD — email/password and/or magic link (OTP)
- **Roles needed:** At minimum two roles: `client` and `coach`
  (coach can write to `coach_protocols`, client can only read their own)
- **Current prototype:** The onboarding screens in
  `bloom-app-design/project/screens/Onboarding.jsx` show welcome, profile setup,
  and "Link your coach" steps — these map directly to post-auth onboarding flow

---

## Monitoring & Observability

**Error Tracking:** None — not planned in prototype or project memory

**Logs:** None — browser console only in prototype

---

## CI/CD & Deployment

**Hosting:** Not decided — no deployment config exists

**CI Pipeline:** None

---

## Environment Configuration

**Required env vars for production (none exist yet):**

```
VITE_SUPABASE_URL=          # Supabase project URL
VITE_SUPABASE_ANON_KEY=     # Supabase anon/public key
VITE_FOOD_API_KEY=          # Food database API key (provider TBD)
```

**Secrets location:**
- `.env.local` (to be created, gitignored)
- No `.env` file exists in the repository currently

---

## Webhooks & Callbacks

**Incoming:** None planned

**Outgoing:** None planned

---

## Feature → Integration Mapping

This table maps visible prototype features to the integrations they require.

| Prototype feature | Screen | Integration required |
|-------------------|--------|----------------------|
| Food search by name | `Logging.jsx` (state: `"search"`) | Food database API |
| Barcode scan | `Logging.jsx` (state: `"barcode"`) | Food database API + device camera |
| Food detail + macros | `Logging.jsx` (state: `"detail"`) | Food database API |
| Log a meal | `Diary.jsx` | Supabase `food_logs` |
| Weight tracking chart | `Weight.jsx` | Supabase `weight_logs` |
| Symptom check-in | `Symptoms.jsx` | Supabase `symptom_logs` |
| Coach's protocol | `Coach.jsx` | Supabase `coach_protocols` |
| Weekly insights | `Insights.jsx` | Supabase (aggregate queries over logs) |
| Profile / account | `Profile.jsx` | Supabase `profiles` + Auth |
| Cycle tracking | `Profile.jsx`, `Home.jsx` | Supabase `profiles` / `symptom_logs` |
| Recipe library | `Recipes.jsx` | Local data or future CMS/API |

---

*Integration audit: 2026-05-18*
