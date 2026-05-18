# Walking Skeleton — Bloom Phase 1

**Recorded:** 2026-05-18
**Phase:** 01-Foundation
**Status:** Defined pre-execution — update to "Verified" after smoke test passes

---

## What the Skeleton Proves

The Walking Skeleton is the thinnest possible end-to-end slice through the full stack. It answers: "Does the entire system work together?"

**Skeleton path:** Sign up → verify email → /auth/callback → /onboarding/welcome → complete 4 steps → profile UPDATE → /home (empty state)

**One real Supabase read:** RequireProfile guard queries `profiles` table via useProfile() hook (TanStack Query). If pcos_type is null, user stays in onboarding. If non-null, user reaches /home.

**One real Supabase write:** OnboardingDoneScreen calls `supabase.from('profiles').update({ pcos_type, goals, display_name, ... }).eq('id', user.id)`. This is the gating write — without it, RequireProfile never passes.

**PWA installs:** After plan 01-05, Chrome/Edge shows install prompt. App is installable as a standalone PWA.

---

## Architectural Decisions Locked by This Skeleton

These decisions are locked. Future phases build on them without renegotiation. Changing any of these requires an explicit architect decision and a new SKELETON entry.

### Framework

| Layer | Decision | Version | Rationale |
|-------|----------|---------|-----------|
| Build tool | Vite | 8.x | Fastest HMR, first-class PWA plugin, @tailwindcss/vite integration |
| UI framework | React | 19.x | Project decision; concurrent features available |
| Language | TypeScript | 6.x | Strict mode. `@/` path alias. No `any` in production code. |
| Routing | react-router-dom | 7.x | Two-layout architecture: AuthLayout (public) + AppLayout (tab bar) |

### Styling

| Decision | Value |
|----------|-------|
| CSS approach | Tailwind v4 with @theme inline CSS variable bridge |
| Config method | @tailwindcss/vite plugin — NO tailwind.config.ts |
| Token system | --b-* CSS custom properties from src/styles/tokens.css |
| Theme switching | data-palette / data-dark attributes on <html> (pure CSS cascade) |
| Theme persistence | localStorage only (bloom-palette, bloom-dark keys) |
| Component API | className prop only — no style prop on any component (D-03) |

### Database

| Decision | Value |
|----------|-------|
| Provider | Supabase (PostgreSQL) |
| Migration | Single migration file: supabase/migrations/20260518000001_init.sql |
| Tables | profiles, food_logs, weight_logs, symptom_logs, usda_foods, ai_daily_targets |
| RLS | Enabled on all user-owned tables from migration day 1 |
| RLS pattern | (select auth.uid()) = user_id — parenthesized form for query-level evaluation |
| Profile creation | Trigger-only: on_auth_user_created inserts profiles(id). Client calls UPDATE never INSERT. |
| Cascade | ON DELETE CASCADE on all user_id FK columns |

### Authentication

| Decision | Value |
|----------|-------|
| Provider | Supabase Auth (email + password) |
| Email verification | Hard block (D-05): CheckInboxScreen, no partial access |
| Post-verification redirect | /auth/callback -> /onboarding/welcome directly (D-07) |
| Session persistence | Supabase localStorage cache; AuthProvider blocks render until getSession() resolves |
| Singleton | src/lib/supabase.ts is the ONLY createClient() call in the codebase |

### State Management

| Layer | Library | Purpose |
|-------|---------|---------|
| Server state | TanStack Query 5.x | profiles fetch, future: food_logs, etc. |
| UI ephemeral state | Zustand 5.x | Onboarding step tracking (localStorage-persisted) |
| Auth state | React Context (AuthContext) | Session, user, loading, signOut |
| Theme state | localStorage direct | loadTheme/saveTheme/applyTheme — no React state |

### Onboarding Gate

| Decision | Value |
|----------|-------|
| Guard | RequireProfile: reads profile.pcos_type from DB |
| Completion signal | pcos_type IS NOT NULL in profiles table |
| Resume behavior | onboardingStore.currentStep in localStorage determines which step to resume (D-08) |
| Cannot skip | Direct URL navigation to /home without pcos_type triggers redirect |

### PWA

| Decision | Value |
|----------|-------|
| Plugin | vite-plugin-pwa 1.x |
| Strategy | generateSW (Workbox auto-generates service worker) |
| Register type | 'prompt' (user-initiated update, not auto-update mid-session) |
| Name | "Bloom — PCOS Nutrition" |
| Theme color | #1F3A4D (--b-primary slate default) |
| Icons | public/icons/pwa-192x192.png, public/icons/pwa-512x512.png |

### Account Deletion

| Decision | Value |
|----------|-------|
| Method | Supabase Edge Function: supabase/functions/delete-account/index.ts |
| Key used | SUPABASE_SERVICE_ROLE_KEY (Edge Function secret only — never in Vite env) |
| Cascade | auth.admin.deleteUser() triggers ON DELETE CASCADE on all user tables |
| Client call | supabase.functions.invoke('delete-account') with user's session JWT in header |

### Directory Layout

```
src/
├── main.tsx                     # Entry: imports tokens.css, applies theme, mounts React
├── App.tsx                      # Route tree only
├── styles/
│   └── tokens.css               # --b-* variables + @import tailwindcss + @theme inline
├── lib/
│   ├── supabase.ts              # THE singleton — only createClient() in codebase
│   ├── database.types.ts        # Generated: supabase gen types typescript
│   ├── queryClient.ts           # TanStack Query singleton
│   └── theme.ts                 # applyTheme, loadTheme, saveTheme (pure functions)
├── contexts/
│   └── AuthContext.tsx           # AuthProvider + useAuth
├── hooks/
│   ├── useAuth.ts               # Re-export from AuthContext
│   └── useProfile.ts            # TanStack Query: profiles row for current user
├── stores/
│   └── onboardingStore.ts       # Zustand: step index + formData (localStorage-persisted)
├── components/
│   ├── ui/                      # TypeScript rewrites of Bits.jsx (className-only API)
│   │   ├── Avatar.tsx, Btn.tsx, Card.tsx, Chip.tsx
│   │   ├── IconBtn.tsx, Progress.tsx, Ring.tsx, AppBar.tsx, Sparkline.tsx
│   │   └── index.ts
│   └── layout/
│       ├── AuthLayout.tsx        # Public routes shell (Outlet only)
│       ├── AppLayout.tsx         # Authenticated shell (tab bar + Outlet)
│       ├── RequireAuth.tsx       # Guard: session check
│       └── RequireProfile.tsx    # Guard: profiles.pcos_type check
├── screens/
│   ├── auth/
│   │   ├── WelcomeScreen.tsx
│   │   ├── SignUpScreen.tsx
│   │   ├── SignInScreen.tsx
│   │   ├── CheckInboxScreen.tsx  # Hard verification block (D-05)
│   │   ├── ResetPasswordScreen.tsx
│   │   └── AuthCallbackScreen.tsx # /auth/callback — redirects to /onboarding/welcome
│   ├── onboarding/
│   │   ├── OnboardingWelcomeScreen.tsx   # Step 1
│   │   ├── OnboardingProfileScreen.tsx   # Step 2: name, age, height, weight
│   │   ├── OnboardingPCOSScreen.tsx      # Step 3: PCOS type + goals
│   │   └── OnboardingDoneScreen.tsx      # Step 4: saves profile, redirects /home
│   ├── home/
│   │   └── HomeScreen.tsx        # Phase 1: empty state (Walking Skeleton endpoint)
│   └── profile/
│       └── ProfileScreen.tsx     # View/edit profile, theme picker, account deletion
└── supabase/
    ├── migrations/
    │   └── 20260518000001_init.sql
    └── functions/
        └── delete-account/
            └── index.ts
```

---

## Phase 2+ Extension Points

These are the hooks Phase 2 will use — established by Phase 1 but not populated yet:

| Extension Point | Phase 2 Use |
|-----------------|-------------|
| AppLayout tab bar | Add "Food" tab for food logging flow |
| HomeScreen | Replace empty state with macro progress rings + food diary |
| TanStack Query | Add food_logs, weight_logs queries |
| supabase.from('food_logs') | Phase 2 inserts denormalized macros at log time |
| supabase.from('usda_foods') | Phase 2 caches USDA API responses here |

---

## Smoke Test Checklist

Run after plan 01-05 executes. Check off each item:

- [ ] npm run dev starts without console errors on localhost:5173
- [ ] /welcome loads WelcomeScreen (no tab bar visible)
- [ ] /signup form submits -> CheckInboxScreen appears with entered email
- [ ] Verification email received and link clicked -> /auth/callback opens
- [ ] /auth/callback redirects to /onboarding/welcome (no intermediate screen)
- [ ] Step 1 (Welcome) -> Step 2 (Profile form fills) -> Step 3 (PCOS + goals) -> Step 4 (Done)
- [ ] /home loads with tab bar (Home + Profile tabs)
- [ ] Supabase Dashboard -> profiles table: row has pcos_type set (not null)
- [ ] Profile tab -> ProfileScreen shows name from profile
- [ ] Warm palette swatch -> colors change immediately across the whole app
- [ ] Refresh -> warm palette persists
- [ ] Sign out -> /welcome
- [ ] npm run build exits 0
- [ ] dist/sw.js exists (service worker generated)
- [ ] dist/manifest.webmanifest exists
- [ ] Chrome DevTools -> Application -> Manifest: no icon errors

---

*Walking Skeleton defined: 2026-05-18*
*Verified: [date to be filled after smoke test]*
