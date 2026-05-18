# Architecture Research: Bloom

**Researched:** 2026-05-18
**Confidence:** HIGH (Supabase/React Router verified via Context7 official docs; USDA patterns from official Python client docs; GL strategy from nutrition literature; PWA from Workbox/vite-plugin-pwa docs)

---

## Supabase Schema

### Design Principles

1. Every user-owned table carries a `user_id uuid references auth.users(id) on delete cascade` column. This is the RLS anchor.
2. The `profiles` row is created by a trigger on `auth.users` insert — never by the client — to guarantee existence.
3. Nutritional values for logged foods are **denormalized into `food_logs`** at write time, not referenced by FK to a foods table. This keeps historical records stable when USDA data changes and removes join complexity from queries.
4. A `usda_foods` cache table stores enriched nutritional data fetched from USDA, keyed by `fdc_id`. This shields the app from USDA rate limits on repeat queries.
5. Sensitive fields (cycle dates, symptom scores) are stored in RLS-protected tables; do not expose via public API routes.

### Tables

#### `profiles`

Stores onboarding data plus PCOS-specific metadata. Created automatically by trigger on signup.

```sql
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  display_name    text,
  age             integer,
  height_cm       numeric(5,1),
  starting_weight_kg numeric(5,2),
  goal_weight_kg  numeric(5,2),
  pcos_type       text check (pcos_type in ('confirmed','suspected','managing')),
  goals           text[],                         -- ['lose_weight', 'reduce_symptoms', ...]
  average_cycle_length_days integer default 28,
  last_period_start date,
  palette         text default 'slate' check (palette in ('slate','warm','sage')),
  dark_mode       boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table public.profiles enable row level security;
```

RLS: owner-only reads and writes (see policies section).

Trigger to auto-create on signup (confirmed HIGH confidence from Supabase docs):

```sql
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

#### `food_logs`

Each row is one food item added to a meal. Macros are copied in at log time — not referenced from a foods table — so historical accuracy is preserved.

```sql
create table public.food_logs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  logged_at       timestamptz not null default now(),
  meal_slot       text not null check (meal_slot in ('breakfast','lunch','dinner','snack')),
  food_name       text not null,
  fdc_id          text,                          -- nullable: custom entries have no FDC id
  serving_g       numeric(7,2) not null,
  kcal            numeric(7,2),
  protein_g       numeric(7,2),
  carbs_g         numeric(7,2),
  fat_g           numeric(7,2),
  fiber_g         numeric(7,2),
  sugar_g         numeric(7,2),
  gi              integer,                       -- glycemic index (0-100), may be null
  gl              numeric(5,2),                  -- calculated: (gi * net_carbs) / 100
  notes           text,
  created_at      timestamptz default now()
);

create index food_logs_user_date_idx on public.food_logs (user_id, logged_at);

alter table public.food_logs enable row level security;
```

`gl` is computed client-side before insert: `gl = (gi * (carbs_g - fiber_g)) / 100`. When GI is not available, `gl` is null and the UI shows "GL unavailable".

#### `weight_logs`

```sql
create table public.weight_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  logged_at   timestamptz not null default now(),
  weight_kg   numeric(5,2) not null,
  notes       text,
  created_at  timestamptz default now()
);

create unique index weight_logs_user_date_uniq
  on public.weight_logs (user_id, date(logged_at));  -- one entry per day per user

alter table public.weight_logs enable row level security;
```

#### `symptom_logs`

One row per day per user. Scores are 1–5 integers matching the design's rating chips.

```sql
create table public.symptom_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  logged_at   timestamptz not null default now(),
  energy      smallint check (energy between 1 and 5),
  mood        smallint check (mood between 1 and 5),
  sleep       smallint check (sleep between 1 and 5),
  bloating    smallint check (bloating between 1 and 5),
  skin        smallint check (skin between 1 and 5),
  cycle_day   integer,                           -- null if no period logged
  period_flow text check (period_flow in ('light','medium','heavy','none')),
  created_at  timestamptz default now()
);

create unique index symptom_logs_user_date_uniq
  on public.symptom_logs (user_id, date(logged_at));

alter table public.symptom_logs enable row level security;
```

#### `cycle_logs`

Stores period start events. Cycle day and phase are derived, not stored.

```sql
create table public.cycle_logs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  period_start    date not null,
  cycle_length    integer,                       -- filled in when next period starts
  notes           text,
  created_at      timestamptz default now()
);

create index cycle_logs_user_idx on public.cycle_logs (user_id, period_start desc);

alter table public.cycle_logs enable row level security;
```

Cycle phase is computed in a TypeScript utility from the most recent `period_start` and `average_cycle_length_days` in `profiles`. Phases: menstrual (days 1–5), follicular (6–13), ovulation (14–16), luteal (17–end). PCOS users frequently have irregular cycles — always handle "no period logged yet" and "cycle overdue" gracefully by returning `null` phase rather than a wrong phase.

#### `ai_daily_targets`

Caches Claude-generated macro targets. Regenerate on profile change or cycle phase change; do not call Claude on every page load.

```sql
create table public.ai_daily_targets (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  generated_at    timestamptz not null default now(),
  cycle_phase     text,
  protein_g       numeric(6,2),
  fiber_g         numeric(6,2),
  gl_target       numeric(6,2),
  added_sugar_g   numeric(6,2),
  protein_carb_ratio numeric(4,2),
  insulin_score_basis jsonb,                     -- raw model output for audit trail
  prompt_version  integer default 1,             -- bump when prompt changes
  created_at      timestamptz default now()
);

create index ai_targets_user_idx on public.ai_daily_targets (user_id, generated_at desc);

alter table public.ai_daily_targets enable row level security;
```

#### `coach_invites`

Stores invite tokens linking coaches to clients. Token-based: user generates a shareable link; coach claims it.

```sql
create table public.coach_invites (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  coach_id        uuid references auth.users(id),  -- null until claimed
  invite_token    text unique not null default encode(gen_random_bytes(24), 'hex'),
  status          text default 'pending' check (status in ('pending','accepted','revoked')),
  created_at      timestamptz default now(),
  accepted_at     timestamptz
);

alter table public.coach_invites enable row level security;
```

#### `coach_protocols`

Versioned nutrition targets set by the coach. A new row is inserted for each version — never overwrite.

```sql
create table public.coach_protocols (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  coach_id        uuid not null references auth.users(id),
  version         integer not null default 1,
  effective_from  date not null default current_date,
  archived_at     timestamptz,
  protein_g       numeric(6,2),
  fiber_g         numeric(6,2),
  gl_target       numeric(6,2),
  added_sugar_g   numeric(6,2),
  meal_templates  jsonb,
  habits          jsonb,
  notes           text,
  created_at      timestamptz default now()
);

alter table public.coach_protocols enable row level security;
```

#### `usda_foods` (cache table)

Stores USDA API responses to reduce external calls. Keyed by `fdc_id`. TTL: 30 days.

```sql
create table public.usda_foods (
  fdc_id          text primary key,
  description     text not null,
  data_type       text,
  brand_owner     text,
  gtin_upc        text,                          -- for barcode lookup
  kcal_per_100g   numeric(7,2),
  protein_g_per_100g numeric(7,2),
  carbs_g_per_100g  numeric(7,2),
  fat_g_per_100g    numeric(7,2),
  fiber_g_per_100g  numeric(7,2),
  sugar_g_per_100g  numeric(7,2),
  raw_nutrients   jsonb,                         -- full nutrient list from USDA
  fetched_at      timestamptz default now(),
  expires_at      timestamptz default (now() + interval '30 days')
);

create index usda_foods_barcode_idx on public.usda_foods (gtin_upc)
  where gtin_upc is not null;
```

This table does **not** have RLS — it is a shared public cache. Grant `SELECT` to `authenticated`, `INSERT/UPDATE` to `service_role` only (writes happen via Edge Function, not client).

---

### RLS Policies

**Pattern: owner-only CRUD**

Applied to `food_logs`, `weight_logs`, `symptom_logs`, `cycle_logs`, `ai_daily_targets`:

```sql
-- SELECT: user sees only their own rows
create policy "user_select_own"
  on public.food_logs for select to authenticated
  using ((select auth.uid()) = user_id);

-- INSERT: user can only insert their own rows
create policy "user_insert_own"
  on public.food_logs for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- UPDATE: user can only update their own rows
create policy "user_update_own"
  on public.food_logs for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- DELETE: user can only delete their own rows
create policy "user_delete_own"
  on public.food_logs for delete to authenticated
  using ((select auth.uid()) = user_id);
```

Apply the same pattern to all user-owned tables. Use `(select auth.uid())` (with parens) rather than `auth.uid()` directly — the parenthesized form is evaluated once per query, not once per row, which is significantly faster on large tables (confirmed HIGH confidence from Supabase docs).

**Pattern: profiles (owner-only)**

```sql
create policy "user_view_own_profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "user_update_own_profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- INSERT handled by trigger, no client INSERT policy needed
```

**Pattern: coach read-access (invite-based)**

Coaches can read a client's food logs, symptom logs, and weight logs only when an accepted `coach_invites` row links them to the client.

```sql
-- Coach can read client's food_logs if an accepted invite exists
create policy "coach_read_client_food_logs"
  on public.food_logs for select to authenticated
  using (
    exists (
      select 1 from public.coach_invites ci
      where ci.user_id = food_logs.user_id
        and ci.coach_id = (select auth.uid())
        and ci.status = 'accepted'
    )
  );
```

Apply same coach read policy to `symptom_logs` and `weight_logs`. Coaches do **not** get write access to any user-owned table.

**Pattern: coach_protocols (coach writes, client reads)**

```sql
-- Client can read their own protocols
create policy "client_read_own_protocols"
  on public.coach_protocols for select to authenticated
  using ((select auth.uid()) = user_id);

-- Coach can insert/update protocols for clients they are linked to
create policy "coach_write_protocols"
  on public.coach_protocols for insert to authenticated
  with check (
    (select auth.uid()) = coach_id
    and exists (
      select 1 from public.coach_invites ci
      where ci.user_id = coach_protocols.user_id
        and ci.coach_id = (select auth.uid())
        and ci.status = 'accepted'
    )
  );
```

**Pattern: coach_invites**

```sql
-- User sees their own invites
create policy "user_manages_own_invites"
  on public.coach_invites for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Coach sees invites assigned to them (to accept)
create policy "coach_sees_own_invites"
  on public.coach_invites for select to authenticated
  using ((select auth.uid()) = coach_id or coach_id is null);

-- Coach can claim a pending invite by token (set coach_id + status)
create policy "coach_claim_invite"
  on public.coach_invites for update to authenticated
  using (status = 'pending' and coach_id is null)
  with check ((select auth.uid()) = coach_id and status = 'accepted');
```

**Security note:** Complex RLS policies that reference other tables (the `exists` subqueries above) should use `security definer` helper functions in the `private` schema to avoid RLS recursion and improve performance. This is the Supabase-recommended pattern for multi-table policies.

---

## React App Structure

### File Organization

```
src/
├── main.tsx                        # ReactDOM.createRoot, BrowserRouter
├── App.tsx                         # Routes definition
├── lib/
│   ├── supabase.ts                 # createClient() singleton
│   ├── usda.ts                     # USDA FDC API client + cache logic
│   ├── claude.ts                   # Claude API wrapper (target generation)
│   └── gl.ts                       # Glycemic load calculation utilities + GI table
├── context/
│   ├── AuthContext.tsx             # session, user, isLoading
│   └── TodayContext.tsx            # today's food_logs, symptom_log, weight_log
├── hooks/
│   ├── useAuth.ts                  # reads AuthContext
│   ├── useProfile.ts               # fetches + caches profiles row
│   ├── useTodayLogs.ts             # fetches food/symptom/weight for today
│   ├── useCyclePhase.ts            # derives phase from cycle_logs + profile
│   ├── useAITargets.ts             # reads ai_daily_targets, triggers regen
│   ├── useFoodSearch.ts            # USDA search with local cache
│   └── useCoachProtocol.ts         # reads active coach_protocols row
├── components/
│   ├── ui/                         # Rebuilt from Bits.jsx as ES modules
│   │   ├── Card.tsx
│   │   ├── Chip.tsx
│   │   ├── Ring.tsx
│   │   ├── Progress.tsx
│   │   ├── Sparkline.tsx
│   │   ├── AppBar.tsx
│   │   ├── Btn.tsx
│   │   ├── Icon.tsx
│   │   └── Avatar.tsx
│   ├── layout/
│   │   ├── TabBar.tsx
│   │   ├── BottomSheet.tsx
│   │   └── PageShell.tsx           # wraps screen content with safe-area padding
│   └── features/
│       ├── FoodSearchInput.tsx
│       ├── BarcodeScanner.tsx
│       ├── FoodCard.tsx
│       ├── MacroRow.tsx
│       ├── InsightCard.tsx
│       └── CyclePhaseChip.tsx
├── pages/
│   ├── auth/
│   │   ├── Welcome.tsx
│   │   ├── SignIn.tsx
│   │   └── MagicLinkSent.tsx
│   ├── onboarding/
│   │   ├── ProfileSetup.tsx
│   │   └── CoachLink.tsx
│   ├── home/
│   │   └── Home.tsx
│   ├── diary/
│   │   └── Diary.tsx
│   ├── logging/
│   │   ├── FoodSearch.tsx
│   │   ├── BarcodeCapture.tsx
│   │   └── FoodDetail.tsx
│   ├── macros/
│   │   └── Macros.tsx
│   ├── weight/
│   │   └── Weight.tsx
│   ├── symptoms/
│   │   └── Symptoms.tsx
│   ├── insights/
│   │   └── Insights.tsx
│   ├── coach/
│   │   └── CoachProtocol.tsx
│   ├── recipes/
│   │   └── Recipes.tsx
│   └── profile/
│       └── Profile.tsx
├── styles/
│   └── tokens.css                  # Copied verbatim from bloom-app-design
├── sw.ts                           # Custom service worker (Workbox)
└── vite.config.ts
```

### Routing Structure

React Router v6 with nested layout routes. Two top-level layouts: `AuthLayout` (unauthenticated shell) and `AppLayout` (tab bar shell).

```tsx
// App.tsx
<BrowserRouter>
  <Routes>
    {/* Unauthenticated */}
    <Route element={<AuthLayout />}>
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/magic-link-sent" element={<MagicLinkSent />} />
    </Route>

    {/* Onboarding (authenticated but incomplete profile) */}
    <Route element={<RequireAuth />}>
      <Route path="/onboarding/profile" element={<ProfileSetup />} />
      <Route path="/onboarding/coach" element={<CoachLink />} />
    </Route>

    {/* Main app (authenticated + profile complete) */}
    <Route element={<RequireProfile />}>
      <Route element={<AppLayout />}>         {/* renders TabBar + <Outlet /> */}
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/diary" element={<Diary />} />
        <Route path="/macros" element={<Macros />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/weight" element={<Weight />} />
        <Route path="/symptoms" element={<Symptoms />} />
        <Route path="/coach" element={<CoachProtocol />} />
        <Route path="/recipes" element={<Recipes />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      {/* Full-screen modal routes (no tab bar) */}
      <Route path="/log/search" element={<FoodSearch />} />
      <Route path="/log/barcode" element={<BarcodeCapture />} />
      <Route path="/log/detail/:fdcId" element={<FoodDetail />} />
    </Route>

    {/* Coach invite claim */}
    <Route path="/invite/:token" element={<ClaimInvite />} />

    <Route path="*" element={<Navigate to="/home" replace />} />
  </Routes>
</BrowserRouter>
```

**`RequireAuth`** — checks `AuthContext.session`. If null, redirects to `/welcome`. Renders `<Outlet />` otherwise.

**`RequireProfile`** — checks that `profiles.pcos_type` is set (onboarding complete). If not, redirects to `/onboarding/profile`. This prevents users from reaching the main app before onboarding.

**`AppLayout`** — renders the bottom `TabBar` (5 items: Today, Diary, Log FAB, Insights, Me) plus `<Outlet />` for the current page. The Log FAB navigates to `/log/search` as a full-screen modal.

### Auth State Bootstrap

```tsx
// AuthContext.tsx
function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    )

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
```

Do not render any routes until `loading` is false — avoids flash-redirect on refresh.

---

## Data Flows

### Food Logging Flow

```
User types in FoodSearch
  → useFoodSearch hook
      1. Check usda_foods table in Supabase (fdc_id or description match)
         → cache hit: return cached result (zero external calls)
         → cache miss: call USDA /foods/search endpoint
             → store result in usda_foods (upsert)
             → return to UI
  → User picks food + sets serving size
      → gl calculated client-side:
         gl = gi_from_local_table(fdc_id) ?? null
         net_carbs = carbs_g - fiber_g
         gl_value = gi ? (gi * net_carbs) / 100 : null
  → User taps "Add to meal"
      → INSERT into food_logs (user_id, meal_slot, denormalized macros, gl)
      → Optimistic UI update via TodayContext
      → If offline: store in IndexedDB queue → sync on reconnect
  → Today dashboard recalculates totals from TodayContext
```

### Barcode Scanning Flow

```
User opens BarcodeCapture
  → @zxing/browser reads camera frame → returns GTIN/UPC string
  → Check usda_foods.gtin_upc index in Supabase
      → hit: navigate to /log/detail/:fdcId with cached data
      → miss: call USDA /foods/search?query=<upc>&dataType=Branded
          → if found: upsert usda_foods → navigate to detail
          → if not found: navigate to /log/search with pre-filled query
```

### AI Target Generation Flow

```
Trigger conditions (any one of):
  1. User completes onboarding (first-time targets)
  2. User updates profile (weight, goals, PCOS type changed)
  3. Cycle phase changed since last generation
  4. ai_daily_targets row is > 24 hours old

Flow:
  1. useAITargets hook reads latest ai_daily_targets row
  2. If stale/missing: call /api/generate-targets Edge Function
       - Edge Function reads profiles + latest cycle_logs
       - Builds prompt: PCOS type, cycle phase, age, weight, goals
       - Calls Claude claude-sonnet-4-6
       - Parses response → INSERT into ai_daily_targets
       - Returns targets to client
  3. useAITargets returns targets to Home and Macros screens

Prompt structure (MEDIUM confidence — PCOS nutrition literature):
  "You are a PCOS-aware dietitian. Generate daily macro targets for:
   - User: age {age}, current weight {weight}kg, PCOS type: {type}
   - Cycle phase: {phase} (day {day} of {length}-day cycle)
   - Goals: {goals}
   - Output JSON: { protein_g, fiber_g, gl_target, added_sugar_g,
                    protein_carb_ratio, rationale }
   Prioritize insulin regulation, low glycemic load, and adequate protein.
   Rationale must be ≤ 40 words."

Cache key: (user_id, cycle_phase). Only regenerate when phase changes or profile updates.
Budget: ~1–2 Claude calls per user per cycle phase (4 per full cycle = ~$0.002–$0.01/user/month).
```

### Coach Access Flow

```
User generates invite:
  1. User taps "Invite coach" in Profile
  2. App reads coach_invites row (or inserts new one with token)
  3. App shows shareable link: https://app.bloom.com/invite/{token}

Coach claims invite:
  1. Coach opens link → ClaimInvite page
  2. If not logged in → redirect to /signin → return here after auth
  3. App calls: UPDATE coach_invites SET coach_id = auth.uid(), status = 'accepted'
     WHERE invite_token = {token} AND status = 'pending'
  4. RLS policy allows this UPDATE because status = 'pending' and coach_id was null

Coach reads client data:
  1. Coach's dashboard (out of scope v1) or read-only client view
  2. All queries go through Supabase client with coach's JWT
  3. RLS "coach_read_client_food_logs" policy applies automatically
  4. Coach sees client's food_logs, symptom_logs, weight_logs
  5. Coach cannot INSERT or UPDATE any user-owned table

User revokes access:
  1. UPDATE coach_invites SET status = 'revoked' WHERE user_id = auth.uid()
  2. All coach RLS policies check status = 'accepted' → immediately blocks access
```

---

## Glycemic Load Strategy

### The Problem

USDA FoodData Central provides: calories, protein, carbs, fat, fiber, sugar, detailed micronutrients. It does **not** provide glycemic index (GI) or glycemic load (GL). GI is measured experimentally — it cannot be calculated from nutrition labels alone.

### Recommended Approach: Local GI Reference Table

Maintain a local TypeScript lookup table (`src/lib/gl.ts`) mapping common foods and USDA food categories to GI values, sourced from the University of Sydney GI database (Atkinson et al., 2008 — the authoritative peer-reviewed source).

```typescript
// src/lib/gl.ts

// GI reference data sourced from: Atkinson FS, Foster-Powell K, Brand-Miller JC.
// "International tables of glycemic index and glycemic load values: 2008."
// Diabetes Care. 2008;31(12):2281-3.
const GI_BY_FDC_CATEGORY: Record<string, number> = {
  'Breakfast Cereals':  70,
  'Legumes and Legume Products': 30,
  'Vegetables and Vegetable Products': 38,
  'Fruits and Fruit Juices': 52,
  'Dairy and Egg Products': 30,
  'Baked Products': 72,
  'Sweets': 65,
  'Beverages': 58,
  // ... etc
};

// Specific high-confidence GI overrides by fdc_id for common foods
const GI_BY_FDC_ID: Record<string, number> = {
  '2003585': 55,  // white rice
  '168880':  49,  // brown rice
  // ... etc
};

export function lookupGI(fdcId: string, category: string): number | null {
  return GI_BY_FDC_ID[fdcId]
    ?? GI_BY_FDC_CATEGORY[category]
    ?? null;
}

export function calculateGL(gi: number | null, carbsG: number, fiberG: number): number | null {
  if (gi == null) return null;
  const netCarbs = Math.max(0, carbsG - fiberG);
  return (gi * netCarbs) / 100;
}
```

**Why this over external GI APIs:**
- No free API provides per-barcode GI data reliably
- The Sydney database covers ~3,500 foods — sufficient for v1
- A local table has zero latency, zero cost, and no rate limits
- The category-level fallback covers any food not explicitly in the table

**Transparency:** When GL is displayed, show the source ("Estimated based on food category" vs "Verified GI value"). When GI is unavailable, display GL as "—" rather than zero.

**GL display tiers for PCOS context:**

| GL per serving | Label | Color |
|----------------|-------|-------|
| < 10 | Low | `--b-mint` |
| 10–19 | Medium | `--b-amber` |
| ≥ 20 | High | `--b-coral` |

---

## PWA / Offline Architecture

### Service Worker Strategy (vite-plugin-pwa + Workbox)

```typescript
// vite.config.ts — PWA plugin configuration
VitePWA({
  registerType: 'prompt',           // show "Update available" prompt
  strategies: 'injectManifest',     // use custom sw.ts for full control
  srcDir: 'src',
  filename: 'sw.ts',
  manifest: {
    name: 'Bloom',
    short_name: 'Bloom',
    theme_color: '#1F3A4D',
    display: 'standalone',
    orientation: 'portrait',
  }
})
```

**Runtime caching rules in `sw.ts`:**

| Resource | Strategy | TTL | Why |
|----------|----------|-----|-----|
| App shell (HTML/JS/CSS) | CacheFirst + precache | Indefinite | Must work offline |
| Google Fonts | CacheFirst | 1 year | Never changes |
| USDA food search | NetworkFirst | 1 hour | Fresh results preferred, cached fallback |
| Supabase REST reads (food_logs, etc.) | NetworkFirst | 5 min | Fresh preferred |
| Supabase REST writes (INSERT) | NetworkOnly + BackgroundSync | — | Must not lose data |

**Offline food logging (critical path):**

Supabase writes (`INSERT INTO food_logs`) must use Workbox `BackgroundSync`:

```typescript
// sw.ts
registerRoute(
  ({ url }) => url.hostname.includes('supabase') && url.pathname.includes('/rest/'),
  new NetworkOnly({
    plugins: [
      new BackgroundSyncPlugin('food-log-queue', {
        maxRetentionTime: 24 * 60  // retry for up to 24 hours
      })
    ]
  }),
  'POST'
);
```

On the React side, use **optimistic UI**: write to local state immediately on log, show a sync indicator, and let the service worker handle the actual network write in the background.

---

## Build Order / Phase Dependency Map

```
Phase 1 — Foundation (must exist before anything else)
  Delivers:
    - Vite + React + TypeScript scaffold
    - Supabase project + all schema migrations (all tables + RLS)
    - AuthContext + Supabase Auth (email magic link)
    - RequireAuth + RequireProfile route guards
    - React Router route shell (all routes defined, pages empty)
    - tokens.css imported into Vite build (design system live)
    - Rebuilt UI component library (Card, Chip, Ring, Progress, etc.)
    - ProfileSetup onboarding screen → writes profiles row
  Why first: Every other phase depends on auth, schema, and the route shell.
             Without RLS in place from day one, data security cannot be verified.

Phase 2 — Core Loop: Food Logging + Dashboard
  Depends on: Phase 1 (auth, schema, components)
  Delivers:
    - usda.ts client + usda_foods cache table integration
    - FoodSearch page (text search → USDA → cache → food_logs INSERT)
    - FoodDetail page (serving size stepper, GL display)
    - GI lookup table + GL calculation (src/lib/gl.ts)
    - Today dashboard (Home screen: daily totals from food_logs)
    - Diary screen (food_logs grouped by meal_slot)
    - Macros screen (progress bars, GL chart)
    - TodayContext (shared daily log state)
    - Offline queue (IndexedDB + BackgroundSync for food_logs)
  Why second: Logging is the primary daily action. All other screens depend
              on having real logged data to display.

Phase 3 — Health Tracking (cycle, symptoms, weight)
  Depends on: Phase 1 (schema), Phase 2 (patterns established)
  Delivers:
    - Cycle logging + phase derivation (useCyclePhase hook)
    - CyclePhaseChip displayed on Home + other screens
    - Symptoms screen → symptom_logs INSERT
    - Weight screen → weight_logs INSERT + Sparkline chart
    - Period start logging (updates profiles.last_period_start)
  Why third: Cycle phase powers AI targets; must exist before Phase 4.
             Can be built in parallel with Phase 2 except for the cycle dependency.

Phase 4 — AI Targets + Barcode
  Depends on: Phase 2 (food logging works), Phase 3 (cycle phase available)
  Delivers:
    - Claude API integration (Edge Function: generate-targets)
    - ai_daily_targets table population + useAITargets hook
    - Insulin Balance score display on Home
    - Barcode scanner (BarcodeCapture page, @zxing/browser)
    - Barcode → USDA GTIN lookup → FoodDetail flow
  Why fourth: AI targets require both food logging patterns AND cycle phase.
              Barcode is independent of AI but belongs in the same phase as
              full food entry polish.

Phase 5 — Coach Features + Insights
  Depends on: Phase 2 (food_logs data), Phase 3 (symptom/weight data), Phase 4 (targets)
  Delivers:
    - Coach invite system (coach_invites table + ClaimInvite page)
    - Coach protocol display (CoachProtocol screen)
    - Insights screen (weekly aggregation queries, pattern detection)
    - Coach read-only access (verified via RLS policies)
    - Recipe library (static data seeded from Supabase)
  Why fifth: Insights require multiple weeks of real data to be meaningful.
             Coach features require all user features to exist first.

Phase 6 — PWA Polish + Production Readiness
  Depends on: All phases
  Delivers:
    - vite-plugin-pwa + Workbox service worker
    - BackgroundSync for offline food logging
    - Push notification infrastructure (optional, deferred if needed)
    - Empty states + error states for all screens
    - WCAG 2.1 AA accessibility audit
    - Data export endpoint
    - Medical disclaimer on onboarding
    - Performance audit + bundle optimization
```

---

## Key Architectural Decisions

| Decision | Options | Recommendation | Rationale |
|----------|---------|---------------|-----------|
| Nutritional data storage | Reference USDA by FK vs. denormalize into food_logs | Denormalize macros into food_logs at write time | Historical accuracy: USDA data can change; a logged meal must preserve the exact values seen at log time |
| USDA API caching | No cache (call every time) vs. Supabase table cache vs. browser cache | Supabase `usda_foods` table as shared cache | 1000 req/hr limit is easy to hit if multiple users search the same foods; shared cache across users eliminates redundant calls |
| GL data source | External GI API vs. local lookup table vs. skip GL | Local GI lookup table (Sydney database) by category + fdc_id | No reliable free per-item GI API exists; local table has zero latency, is versioned with the codebase, and covers sufficient foods for v1 |
| AI target caching | Generate per request vs. cache per session vs. cache per cycle phase | Cache in `ai_daily_targets`, regenerate on phase change | Claude calls are unnecessary on every page load; targets change only when profile or cycle phase changes; one row covers the entire phase |
| Claude invocation point | Client-side vs. Supabase Edge Function | Edge Function | API key must never be exposed to the client; Edge Function also enforces rate limiting per user |
| Offline writes | No offline support vs. IndexedDB + manual sync vs. Workbox BackgroundSync | Workbox BackgroundSync queuing POST requests | Food logging while offline is a core UX requirement; BackgroundSync handles retry automatically and integrates with vite-plugin-pwa's service worker |
| Routing | Single layout vs. multiple layouts | Two layouts (AuthLayout + AppLayout) with RequireAuth/RequireProfile guards | Clean separation between auth flow and app shell; prevents flash of tab bar on auth screens |
| GI display when unavailable | Show 0 vs. hide field vs. show "—" | Show "—" with tooltip "GI data not available for this food" | Showing 0 would be factually wrong; hiding the field silently degrades the product; "—" is honest and educates the user |
| Coach data model | Roles in auth.users vs. separate coaches table vs. invite-only join table | `coach_invites` join table, no separate role | v1 coaches are just users with an accepted invite; a separate roles system would be premature; the join table pattern is the simplest correct model for invite-based sharing |
| Barcode library | QuaggaJS vs. @zxing/browser vs. native BarcodeDetector API | `@zxing/browser` with BarcodeDetector API fallback | @zxing/browser is actively maintained (HIGH confidence), works as a pure web library with no native dependencies, and BarcodeDetector API provides faster native fallback on supported browsers (Chrome 83+) |

---

## Sources

- Supabase RLS policies and trigger patterns: https://supabase.com/docs/guides/auth/row-level-security (verified via Context7 /websites/supabase)
- Supabase profile table pattern: https://supabase.com/docs/guides/auth/managing-user-data (verified)
- Supabase `(select auth.uid())` performance note: Supabase official RLS docs
- React Router v6 layout routes and Navigate: https://reactrouter.com/6.30.3 (verified via Context7 /websites/reactrouter_6_30_3)
- vite-plugin-pwa generateSW and injectManifest: https://vite-pwa-org.netlify.app (verified via Context7 /vite-pwa/vite-plugin-pwa)
- Workbox BackgroundSync and runtime caching: https://developer.chrome.com/docs/workbox (verified via Context7 /googlechrome/workbox)
- USDA FoodData Central nutrient IDs and API structure: https://usda-fdc.readthedocs.io (verified via Context7 /websites/usda-fdc_readthedocs_io_en)
- GI database source (LOW confidence — not directly verifiable without WebFetch): Atkinson FS, Foster-Powell K, Brand-Miller JC. "International tables of glycemic index and glycemic load values: 2008." Diabetes Care. 2008;31(12):2281-3. DOI: 10.2337/dc08-1239
- PCOS cycle phase definitions (MEDIUM confidence — clinical consensus, not from a single verifiable doc): Menstrual/follicular/ovulatory/luteal phase breakdown per standard reproductive endocrinology references
