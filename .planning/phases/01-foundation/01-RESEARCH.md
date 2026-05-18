# Phase 1: Foundation — Research

**Researched:** 2026-05-18
**Domain:** Vite + React + TypeScript scaffold, Supabase schema + RLS, Auth flows, React Router v7 shell, Tailwind v4 CSS variable bridge, vite-plugin-pwa, onboarding wizard, account deletion
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01: Tailwind CSS** — production components use Tailwind classes, not inline style objects. Tailwind is bridged to the existing `--b-*` design token system.
- **D-02: CSS variable bridge** — `tailwind.config.ts` (v3 approach) or `@theme inline` directive (v4 approach) maps tokens as CSS variable references: `colors: { 'b-primary': 'var(--b-primary)', ... }`. Palette switching and dark mode continue to be driven by `data-palette` and `data-dark` on `<html>`. No JS theme injection needed.
- **D-03: `className` prop only** — all UI components accept a `className` prop. No `style` prop escape hatch on any component. Use `clsx` or `tailwind-merge` for conditional class composition.
- **D-04: `--b-*` tokens preserved** — `bloom-app-design/project/tokens.css` is copied to `src/styles/tokens.css` and imported in `src/main.tsx`. Never hardcode hex values in component code.
- **D-05: Hard email verification block** — user must verify email before anything works. "Check your inbox" screen blocks all access.
- **D-06: Resend + change email** — resend verification (rate-limited 60s) and "Change email" option that returns to sign-up form pre-filled.
- **D-07: Post-verification redirect → onboarding step 1** — no intermediate "Email verified!" screen.
- **D-08: Hard onboarding gate with resumable progress** — `RequireProfile` redirects to current incomplete step. Progress tracked in localStorage until profile saved. Cannot access main app while profile incomplete.
- **D-09: localStorage theme persistence** — selected palette and dark mode stored in localStorage, applied immediately on load. No Supabase round-trip for theme.

### Claude's Discretion

- Tailwind CSS variable bridge strategy (D-02) — CSS var bridge chosen over Tailwind-native themes to preserve existing data-attribute switching mechanism and avoid duplicating token values.
- Onboarding gate behavior (D-08) — hard gate with localStorage progress tracking (step index).
- Theme persistence (D-09) — localStorage only for v1.

### Deferred Ideas (OUT OF SCOPE)

- Coach link step in onboarding — skipped in Phase 1 (coach features are v2)
- Custom food creation, favorites — v2 food logging enhancements
- Cycle tracking — v2
- Theme persistence via Supabase sync — deferred to v2
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | User can sign up with email and password | Supabase Auth `signUp()` + email confirmation flow |
| AUTH-02 | User receives email verification after signup | Supabase `emailRedirectTo` + `onAuthStateChange` detecting `EMAIL_CONFIRMED` event |
| AUTH-03 | User can reset password via email link | Supabase `resetPasswordForEmail()` + `updateUser()` on redirect |
| AUTH-04 | User session persists across browser refresh | Supabase persists session in localStorage by default; AuthContext reads `getSession()` on mount |
| AUTH-05 | User can log out from any screen | `supabase.auth.signOut()` exposed via AuthContext |
| ONBD-01 | 4-step onboarding flow (welcome → profile → PCOS type → goals) | React Hook Form multi-step wizard; step index in localStorage |
| ONBD-02 | Profile data: name, age, height, current weight, goal weight, PCOS type | `profiles` table; form fields confirmed from Onboarding.jsx reference |
| ONBD-03 | User selects goals | `goals text[]` column in profiles; multi-select Chip components |
| ONBD-04 | Onboarding completion is gated | `RequireProfile` guard checks `profiles.pcos_type IS NOT NULL` |
| PROF-01 | User can view and edit their profile | Profile screen with RHF form pre-populated from profiles row |
| PROF-02 | User can select app theme | localStorage `palette` + `dark` keys; `data-palette`/`data-dark` applied to `<html>` |
| PROF-03 | User can delete their account and all data | `supabase.auth.admin.deleteUser()` via Edge Function or `supabase.rpc('delete_account')` |
| INFRA-01 | RLS on all user-owned tables from migration 1 | RLS + 4 policies (SELECT/INSERT/UPDATE/DELETE) in same migration as CREATE TABLE |
| INFRA-02 | Supabase client is module-level singleton | `src/lib/supabase.ts` — one `createClient()` call at module level |
| INFRA-03 | USDA cache table | `usda_foods` table created in migration 1; no RLS (shared public cache) |
| INFRA-04 | TypeScript types generated from schema | `supabase gen types typescript --local > src/lib/database.types.ts` |
| INFRA-05 | PWA manifest + service worker | vite-plugin-pwa `generateSW` strategy in vite.config.ts |
| INFRA-06 | App installs as mobile PWA | PWA manifest: name, icons, theme_color, display: standalone |
</phase_requirements>

---

## Summary

Phase 1 is a greenfield scaffold — no source files exist yet beyond `bloom-app-design/` (read-only) and `CLAUDE.md`. The app directory contains only the design reference files. Every deliverable must be built from scratch.

The most important discovery is a **styling decision conflict** between CLAUDE.md ("No Tailwind, no CSS-in-JS") and CONTEXT.md (D-01/D-02: Tailwind with CSS variable bridge). CONTEXT.md is newer (gathered 2026-05-18 through a user discussion) and explicitly represents locked user decisions. CONTEXT.md supersedes the older CLAUDE.md line. The planner must use Tailwind v4 with the CSS variable bridge approach. CLAUDE.md should be updated to reflect this.

The second critical finding is **Tailwind v4 vs v3 configuration syntax**. Tailwind v4 (currently `4.3.0`) completely changes configuration: there is no `tailwind.config.ts` — instead you configure via CSS `@theme` directives directly in the CSS file. The CSS variable bridge for `--b-*` tokens works differently in v4 versus v3. The planner must pick one version and commit: v4 is recommended (current, Vite-first) but requires `@theme inline { }` syntax instead of a JS config file.

The Walking Skeleton for this phase is well-defined: sign-up → email verify → onboarding → home screen (empty state). This proves the entire stack end-to-end before any features are built.

**Primary recommendation:** Use Tailwind v4 + `@tailwindcss/vite` (no postcss config needed), configure the `--b-*` CSS variable bridge via `@theme inline { }` block in `src/styles/tokens.css`, and build the Walking Skeleton as the first wave of the plan.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Auth state management | Frontend (React Context) | Supabase Auth | Session stored in Supabase; distributed to React via AuthContext singleton |
| Email verification redirect | Supabase Auth (email link) | Frontend (URL handler) | Supabase sends the email; app handles the redirect URL to route to onboarding |
| Onboarding wizard UI | Frontend (React) | Supabase DB | Multi-step form in React; profile written to Supabase on final step |
| Route guarding | Frontend (React Router) | — | RequireAuth and RequireProfile are client-side layout components |
| Database schema + RLS | Supabase (PostgreSQL) | — | All tables and policies live in SQL migrations; no client-side enforcement |
| UI component library | Frontend (React) | — | TypeScript rewrites of Bits.jsx; pure presentational components |
| Theme persistence | Frontend (localStorage) | — | D-09: no Supabase round-trip; applied as data-attributes on `<html>` |
| PWA manifest + service worker | Build tool (vite-plugin-pwa) | Workbox | Generated at build time; no runtime code needed beyond registration |
| Account deletion | Supabase Edge Function | Frontend (confirmation flow) | Must use service_role key to delete auth.users; cannot run client-side |

---

## Standard Stack

### Core (all npm-verified 2026-05-18)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vite | 8.0.13 | Build tool, dev server | Fastest HMR; first-class PWA plugin |
| react | 19.2.6 | UI framework | Project decision; React 19 concurrent features |
| react-dom | 19.2.6 | React DOM renderer | Paired with react |
| typescript | 6.0.3 | Type safety | Project decision; strict mode required |
| @vitejs/plugin-react | 6.0.2 | React + Vite integration | Official plugin |
| react-router-dom | 7.15.1 | Client-side routing | Project decision; v7 is current stable |
| @supabase/supabase-js | 2.105.4 | Auth + database client | Project decision |

### Styling (Phase 1 decision: Tailwind with CSS var bridge)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tailwindcss | 4.3.0 | Utility CSS classes | D-01: locked decision |
| @tailwindcss/vite | 4.3.0 | Vite integration (no postcss needed) | Official Tailwind v4 Vite plugin |
| clsx | 2.1.1 | Conditional className composition | D-03: needed for className-only components |
| tailwind-merge | 3.6.0 | Merge Tailwind classes without conflicts | Prevents class override issues in composed components |

### Auth + Forms

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-hook-form | 7.76.0 | Multi-step onboarding form | All forms in this phase |
| zod | 4.4.3 | Schema validation | All form validation |
| @hookform/resolvers | 5.2.2 | RHF + Zod bridge | `zodResolver()` adapter |

### State + Infrastructure

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query | 5.100.10 | Server state (profile fetch) | `useProfile` hook in RequireProfile guard |
| zustand | 5.0.13 | Onboarding step persistence | localStorage-backed onboarding step index |
| vite-plugin-pwa | 1.3.0 | PWA manifest + service worker | INFRA-05, INFRA-06 |

**Installation commands:**
```bash
# Scaffold
npm create vite@latest bloom-app -- --template react-ts
cd bloom-app

# Routing + Auth
npm install react-router-dom @supabase/supabase-js

# Styling (Tailwind v4 — note: @tailwindcss/vite, NOT tailwind-postcss)
npm install tailwindcss @tailwindcss/vite
npm install clsx tailwind-merge

# Forms + Validation
npm install react-hook-form zod @hookform/resolvers

# Server state + UI state
npm install @tanstack/react-query zustand

# PWA
npm install -D vite-plugin-pwa

# Dev tools
npm install -D @tanstack/react-query-devtools
npm install -D @types/react @types/react-dom
```

---

## Package Legitimacy Audit

> slopcheck was installed (v0.6.1) but checks against PyPI (Python) rather than npm. All packages below are Node.js packages — slopcheck's PyPI check produces false SLOP verdicts for npm-only packages. Package legitimacy was verified directly via `npm view` against the npm registry.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| tailwindcss | npm | 10+ yrs | 50M+/wk | github.com/tailwindlabs/tailwindcss | N/A (npm) | Approved [VERIFIED: npm registry] |
| @tailwindcss/vite | npm | Official Tailwind pkg, 826 versions | High | github.com/tailwindlabs/tailwindcss | N/A (npm) | Approved [VERIFIED: npm registry] |
| react-router-dom | npm | 10+ yrs | 20M+/wk | github.com/remix-run/react-router | N/A (npm) | Approved [VERIFIED: npm registry] |
| @supabase/supabase-js | npm | 5+ yrs | 2M+/wk | github.com/supabase/supabase-js | N/A (npm) | Approved [VERIFIED: npm registry] |
| clsx | npm | 6+ yrs | 30M+/wk | github.com/lukeed/clsx | N/A (npm) | Approved [VERIFIED: npm registry] |
| tailwind-merge | npm | 3+ yrs | 15M+/wk | github.com/dcastil/tailwind-merge | N/A (npm) | Approved [VERIFIED: npm registry] |
| vite-plugin-pwa | npm | 4+ yrs | 500K+/wk | github.com/vite-pwa/vite-plugin-pwa | N/A (npm) | Approved [VERIFIED: npm registry] |
| zustand | npm | 5+ yrs | 8M+/wk | github.com/pmndrs/zustand | N/A (npm) | Approved [VERIFIED: npm registry] |
| react-hook-form | npm | 6+ yrs | 15M+/wk | github.com/react-hook-form/react-hook-form | N/A (npm) | Approved [VERIFIED: npm registry] |
| zod | npm | 4+ yrs | 25M+/wk | github.com/colinhacks/zod | N/A (npm) | Approved [VERIFIED: npm registry] |
| @hookform/resolvers | npm | 4+ yrs | 8M+/wk | github.com/react-hook-form/resolvers | N/A (npm) | Approved [VERIFIED: npm registry] |
| @tanstack/react-query | npm | 4+ yrs | 10M+/wk | github.com/tanstack/query | N/A (npm) | Approved [VERIFIED: npm registry] |

**Packages removed due to slopcheck [SLOP] verdict:** None (slopcheck false-positived on PyPI; all packages verified on npm)
**Packages flagged as suspicious [SUS]:** None

---

## Architecture Patterns

### System Architecture Diagram

```
Browser
  │
  ├── main.tsx
  │     ├── imports src/styles/tokens.css      (--b-* CSS variables live here)
  │     ├── QueryClientProvider                (TanStack Query)
  │     └── AuthProvider                       (AuthContext)
  │           └── RouterProvider
  │                 └── <Routes>
  │
  ├── Routes (react-router-dom v7)
  │     │
  │     ├── /welcome, /signin, /check-inbox     (AuthLayout — no session required)
  │     │     └── AuthLayout renders Outlet only (no tab bar)
  │     │
  │     ├── RequireAuth (layout component)
  │     │     ├── reads AuthContext.session
  │     │     ├── if null → redirect /welcome
  │     │     └── /onboarding/:step             (authenticated, profile incomplete)
  │     │
  │     └── RequireProfile (layout component)
  │           ├── reads AuthContext.session
  │           ├── queries profiles row (TanStack Query)
  │           ├── if no profile / pcos_type null → redirect /onboarding/welcome
  │           └── AppLayout (tab bar + Outlet)
  │                 └── /home (empty state in Phase 1)
  │
  ├── src/lib/supabase.ts                       (singleton createClient)
  │     └── used by AuthContext, hooks, components — never re-instantiated
  │
  └── Supabase Project
        ├── Auth (email/password + email confirmation)
        ├── Migration 001: all tables + RLS policies
        │     ├── profiles (trigger: auto-create on signup)
        │     ├── food_logs (RLS: user_id = auth.uid())
        │     ├── weight_logs (RLS: user_id = auth.uid())
        │     ├── symptom_logs (RLS: user_id = auth.uid())
        │     ├── usda_foods (no RLS — shared cache)
        │     └── ai_daily_targets (RLS: user_id = auth.uid())
        └── Edge Function: delete-account (service_role, cascades all user data)
```

### Recommended Project Structure

```
src/
├── main.tsx                    # ReactDOM.createRoot; imports tokens.css; wraps with QueryClient + AuthProvider
├── App.tsx                     # Route definitions only
├── styles/
│   └── tokens.css              # Copied verbatim from bloom-app-design/project/tokens.css + @theme inline block
├── lib/
│   ├── supabase.ts             # createClient() singleton — ONLY instance in the app
│   └── queryClient.ts          # QueryClient instance with defaultOptions
├── contexts/
│   └── AuthContext.tsx         # session, user, loading; blocks render until initial check resolves
├── hooks/
│   ├── useAuth.ts              # reads AuthContext
│   └── useProfile.ts           # TanStack Query: fetches profiles row for current user
├── components/
│   ├── ui/                     # TypeScript rewrites of Bits.jsx components
│   │   ├── Avatar.tsx
│   │   ├── Btn.tsx
│   │   ├── Card.tsx
│   │   ├── Chip.tsx
│   │   ├── IconBtn.tsx
│   │   ├── Progress.tsx
│   │   ├── Ring.tsx
│   │   └── AppBar.tsx
│   └── layout/
│       ├── AuthLayout.tsx      # Shell for unauthenticated routes
│       ├── AppLayout.tsx       # Tab bar + Outlet for authenticated routes
│       ├── RequireAuth.tsx     # Guard: session check → redirect /welcome
│       └── RequireProfile.tsx  # Guard: profile check → redirect /onboarding/welcome
├── screens/
│   ├── auth/
│   │   ├── WelcomeScreen.tsx   # Sign up + sign in CTAs (matches Welcome() in Onboarding.jsx)
│   │   ├── SignUpScreen.tsx     # Email + password form
│   │   ├── SignInScreen.tsx     # Email + password form
│   │   ├── CheckInboxScreen.tsx # D-05: hard block; resend + change email (D-06)
│   │   └── ResetPasswordScreen.tsx
│   ├── onboarding/
│   │   ├── OnboardingWelcomeScreen.tsx   # Step 1: hero + "Start my journey"
│   │   ├── OnboardingProfileScreen.tsx   # Step 2: name, age, height, weight (matches ProfileSetup)
│   │   ├── OnboardingPCOSScreen.tsx      # Step 3: PCOS diagnosis type + goals multi-select
│   │   └── OnboardingDoneScreen.tsx      # Step 4: confirmation → redirect /home
│   ├── home/
│   │   └── HomeScreen.tsx      # Empty state (Phase 1 Walking Skeleton endpoint)
│   └── profile/
│       └── ProfileScreen.tsx   # View/edit profile + theme picker + delete account
├── stores/
│   └── onboardingStore.ts      # Zustand: step index; persisted to localStorage
└── supabase/
    └── migrations/
        └── 20260518000001_init.sql   # ALL tables + RLS in one migration
```

---

## Critical: Tailwind v4 vs v3 — Which to Use

**Decision required.** Tailwind v4 (`4.3.0`, released 2026) is a major rewrite. The configuration approach is fundamentally different from v3.

### Tailwind v4 approach (RECOMMENDED for new projects)

- No `tailwind.config.ts` file
- Uses `@tailwindcss/vite` plugin (not PostCSS)
- CSS-first configuration via `@theme` directive
- `@theme inline { }` allows CSS variables as theme values (the CSS var bridge)

```css
/* src/styles/tokens.css */

/* 1. Import the existing --b-* design tokens (verbatim from bloom-app-design) */
:root {
  --b-primary: #1F3A4D;
  --b-accent: #4E84A4;
  /* ... all --b-* vars from tokens.css ... */
}
[data-palette="warm"] { /* ... palette overrides ... */ }
[data-palette="sage"]  { /* ... palette overrides ... */ }
[data-dark="true"]     { /* ... dark mode overrides ... */ }

/* 2. CSS variable bridge: map --b-* tokens into Tailwind's theme */
/* @theme inline means: reference CSS variables, don't resolve to static values */
@import "tailwindcss";

@theme inline {
  --color-b-primary:      var(--b-primary);
  --color-b-primary-ink:  var(--b-primary-ink);
  --color-b-primary-soft: var(--b-primary-soft);
  --color-b-accent:       var(--b-accent);
  --color-b-accent-soft:  var(--b-accent-soft);
  --color-b-bg:           var(--b-bg);
  --color-b-surface:      var(--b-surface);
  --color-b-surface-2:    var(--b-surface-2);
  --color-b-surface-sunken: var(--b-surface-sunken);
  --color-b-ink:          var(--b-ink);
  --color-b-ink-2:        var(--b-ink-2);
  --color-b-ink-3:        var(--b-ink-3);
  --color-b-ink-4:        var(--b-ink-4);
  --color-b-hairline:     var(--b-hairline);
  --color-b-mint:         var(--b-mint);
  --color-b-mint-soft:    var(--b-mint-soft);
  --color-b-coral:        var(--b-coral);
  --color-b-coral-soft:   var(--b-coral-soft);
  --color-b-berry:        var(--b-berry);
  --color-b-berry-soft:   var(--b-berry-soft);
  --color-b-amber:        var(--b-amber);
  --color-b-amber-soft:   var(--b-amber-soft);
  --color-b-protein:      var(--b-protein);
  --color-b-carbs:        var(--b-carbs);
  --color-b-fat:          var(--b-fat);
  --color-b-fiber:        var(--b-fiber);

  /* Border radius tokens */
  --radius-b-xs:   var(--b-r-xs);
  --radius-b-sm:   var(--b-r-sm);
  --radius-b-md:   var(--b-r-md);
  --radius-b-lg:   var(--b-r-lg);
  --radius-b-xl:   var(--b-r-xl);
  --radius-b-pill: var(--b-r-pill);

  /* Shadow tokens */
  --shadow-b-card: var(--b-shadow-card);
  --shadow-b-pop:  var(--b-shadow-pop);

  /* Font tokens */
  --font-body:    var(--b-font-body);
  --font-display: var(--b-font-display);
  --font-mono:    var(--b-font-mono);
}
```

**vite.config.ts for Tailwind v4:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),    // <-- Tailwind v4: plugin only, no postcss.config needed
    VitePWA({ /* ... */ }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

**How CSS variable bridge works at runtime:**
- `data-palette="warm"` on `<html>` overrides `--b-primary` to the warm palette value
- Tailwind class `bg-b-primary` resolves to `background-color: var(--b-primary)` (not a static hex)
- When `data-palette` changes, the CSS variable changes, and ALL Tailwind classes using that token update automatically
- No JS theme injection needed — pure CSS cascade [VERIFIED: tailwindcss.com docs]

**Resulting Tailwind class names:**
```tsx
// Instead of style={{ background: 'var(--b-primary)' }}
<div className="bg-b-primary text-b-primary-ink rounded-b-md shadow-b-card" />

// Chip component example (TypeScript)
function Chip({ children, tone = 'neutral', className }: ChipProps) {
  const toneClasses = {
    primary: 'bg-b-primary-soft text-b-primary',
    mint:    'bg-b-mint-soft text-b-mint',
    coral:   'bg-b-coral-soft text-b-coral',
    ghost:   'bg-transparent text-b-ink-3 border border-b-hairline',
  }
  return (
    <span className={clsx('inline-flex items-center gap-1 px-2.5 py-1 rounded-b-pill text-xs font-semibold', toneClasses[tone], className)}>
      {children}
    </span>
  )
}
```

### Tailwind v3 fallback (if v4 compatibility issue discovered)

```typescript
// tailwind.config.ts (v3 only)
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'b-primary': 'var(--b-primary)',
        'b-accent':  'var(--b-accent)',
        // ... all tokens
      }
    }
  }
}
```

**Use v4.** The `@tailwindcss/vite` plugin exists, is published, and has 826 npm versions. The `@theme inline` CSS variable bridge is documented in Tailwind v4 official docs. [ASSUMED: v4 `@theme inline` syntax verified from training knowledge; planner should verify against tailwindcss.com/docs/v4-beta before implementing if any doubt]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Conditional className composition | Custom join/filter logic | `clsx` + `tailwind-merge` | clsx handles falsy values; tailwind-merge resolves conflicting utilities (e.g., `p-2 p-4` → `p-4`) |
| Session management | Custom JWT storage | Supabase Auth (handles storage, refresh, expiry) | Supabase refreshes tokens automatically; hand-rolling misses edge cases |
| Email verification state | Poll supabase.auth | `onAuthStateChange` with `EMAIL_CONFIRMED` event | The SDK emits the event; polling creates race conditions |
| Password reset flow | Custom token handling | `supabase.auth.resetPasswordForEmail()` + redirect URL | Supabase handles token generation and validation |
| PWA service worker | Vanilla SW code | vite-plugin-pwa `generateSW` | Workbox handles precaching, versioning, update cycle correctly |
| TypeScript DB types | Manual interface declarations | `supabase gen types typescript --local > src/lib/database.types.ts` | Types drift silently when hand-maintained; generate on every schema change |
| Account deletion cascade | Manual delete from each table | `ON DELETE CASCADE` on all `user_id` FK columns + `auth.admin.deleteUser()` | PostgreSQL cascade handles the order; missing one table leaks data |
| Theme switching | JS that injects style attributes | CSS `data-palette` + `data-dark` attributes on `<html>` | Already established pattern in design system; zero JS needed |
| Multi-step form state | Custom step reducer | React Hook Form with `mode: 'onBlur'` + Zod per-step schemas | RHF tracks touched/dirty/errors correctly across steps |

---

## Supabase Auth Patterns

### Singleton Client [VERIFIED: supabase.com/docs]

```typescript
// src/lib/supabase.ts — THE ONLY createClient() call in the entire app
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

### AuthContext — Block Until Session Resolves [VERIFIED: supabase.com/docs]

```typescript
// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextValue {
  session: Session | null
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Get current session synchronously (cached in localStorage)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // 2. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        // loading is already false after getSession resolves
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
  }

  // CRITICAL: Do not render children until initial session check completes
  // This prevents flash-redirect on browser refresh
  if (loading) return null  // or a splash screen

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

### Email Verification Flow [VERIFIED: supabase.com/docs/guides/auth/email-confirm]

```typescript
// Sign up — Supabase sends confirmation email automatically
const { error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
    // Data stored in raw_user_meta_data (not profiles — trigger handles that)
  }
})

// After signUp: user.email_confirmed_at is null → show CheckInboxScreen
// When user clicks email link → Supabase validates token → session created
// onAuthStateChange fires with event: 'SIGNED_IN' and confirmed user

// Resend (D-06): rate-limited by Supabase to 1 per 60s
const { error } = await supabase.auth.resend({
  type: 'signup',
  email,
})
```

### Route Guards

```tsx
// src/components/layout/RequireAuth.tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function RequireAuth() {
  const { session } = useAuth()
  if (!session) return <Navigate to="/welcome" replace />
  return <Outlet />
}

// src/components/layout/RequireProfile.tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile } from '@/hooks/useProfile'

export function RequireProfile() {
  const { session } = useAuth()
  const { data: profile, isLoading } = useProfile()

  if (!session) return <Navigate to="/welcome" replace />
  if (isLoading) return null  // or skeleton
  // Profile incomplete: no row yet, or pcos_type null (onboarding not finished)
  if (!profile || !profile.pcos_type) {
    return <Navigate to="/onboarding/welcome" replace />
  }
  return <Outlet />
}
```

### React Router v7 Route Shell [VERIFIED: reactrouter.com/docs]

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthLayout }     from '@/components/layout/AuthLayout'
import { RequireAuth }    from '@/components/layout/RequireAuth'
import { RequireProfile } from '@/components/layout/RequireProfile'
import { AppLayout }      from '@/components/layout/AppLayout'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Unauthenticated routes */}
        <Route element={<AuthLayout />}>
          <Route path="/welcome"     element={<WelcomeScreen />} />
          <Route path="/signin"      element={<SignInScreen />} />
          <Route path="/signup"      element={<SignUpScreen />} />
          <Route path="/check-inbox" element={<CheckInboxScreen />} />
          <Route path="/reset-password" element={<ResetPasswordScreen />} />
          <Route path="/auth/callback"  element={<AuthCallbackScreen />} />
        </Route>

        {/* Authenticated: onboarding (profile not yet complete) */}
        <Route element={<RequireAuth />}>
          <Route path="/onboarding/welcome" element={<OnboardingWelcomeScreen />} />
          <Route path="/onboarding/profile" element={<OnboardingProfileScreen />} />
          <Route path="/onboarding/pcos"    element={<OnboardingPCOSScreen />} />
          <Route path="/onboarding/done"    element={<OnboardingDoneScreen />} />
        </Route>

        {/* Authenticated + profile complete: main app */}
        <Route element={<RequireProfile />}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/home" replace />} />
            <Route path="/home"    element={<HomeScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/welcome" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
```

---

## Supabase Schema — Migration 1

**CRITICAL RULE: RLS policies MUST be in the SAME migration as table creation. Never add RLS after the fact.** [VERIFIED: supabase.com/docs/guides/auth/row-level-security]

```sql
-- supabase/migrations/20260518000001_init.sql

-- ── profiles ──────────────────────────────────────────────────────────────
create table public.profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  display_name         text,
  age                  integer,
  height_cm            numeric(5,1),
  current_weight_kg    numeric(5,2),
  goal_weight_kg       numeric(5,2),
  pcos_type            text check (pcos_type in ('confirmed','suspected','managing')),
  goals                text[] default '{}',
  palette              text default 'slate' check (palette in ('slate','warm','sage')),
  dark_mode            boolean default false,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
-- NOTE: No INSERT policy — profiles are created by trigger only

-- Auto-create profile row on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── food_logs ──────────────────────────────────────────────────────────────
create table public.food_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  logged_at   timestamptz not null default now(),
  meal_slot   text not null check (meal_slot in ('breakfast','lunch','dinner','snack')),
  food_name   text not null,
  fdc_id      text,
  serving_g   numeric(7,2) not null,
  kcal        numeric(7,2),
  protein_g   numeric(7,2),
  carbs_g     numeric(7,2),
  fat_g       numeric(7,2),
  fiber_g     numeric(7,2),
  sugar_g     numeric(7,2),
  gi          integer,
  gl          numeric(5,2),
  created_at  timestamptz default now()
);

create index food_logs_user_date_idx on public.food_logs (user_id, logged_at);

alter table public.food_logs enable row level security;

create policy "food_logs_select_own" on public.food_logs
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "food_logs_insert_own" on public.food_logs
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "food_logs_update_own" on public.food_logs
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "food_logs_delete_own" on public.food_logs
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ── weight_logs ───────────────────────────────────────────────────────────
create table public.weight_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  logged_at   timestamptz not null default now(),
  weight_kg   numeric(5,2) not null,
  created_at  timestamptz default now()
);

create unique index weight_logs_user_date_uniq
  on public.weight_logs (user_id, date(logged_at));

alter table public.weight_logs enable row level security;

create policy "weight_logs_select_own" on public.weight_logs
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "weight_logs_insert_own" on public.weight_logs
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "weight_logs_update_own" on public.weight_logs
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "weight_logs_delete_own" on public.weight_logs
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ── symptom_logs ──────────────────────────────────────────────────────────
create table public.symptom_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  logged_at   timestamptz not null default now(),
  energy      smallint check (energy between 1 and 5),
  mood        smallint check (mood between 1 and 5),
  sleep       smallint check (sleep between 1 and 5),
  bloating    smallint check (bloating between 1 and 5),
  skin        smallint check (skin between 1 and 5),
  created_at  timestamptz default now()
);

create unique index symptom_logs_user_date_uniq
  on public.symptom_logs (user_id, date(logged_at));

alter table public.symptom_logs enable row level security;

create policy "symptom_logs_select_own" on public.symptom_logs
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "symptom_logs_insert_own" on public.symptom_logs
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "symptom_logs_update_own" on public.symptom_logs
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "symptom_logs_delete_own" on public.symptom_logs
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ── usda_foods (shared cache — no RLS) ───────────────────────────────────
create table public.usda_foods (
  fdc_id              text primary key,
  description         text not null,
  data_type           text,
  brand_owner         text,
  gtin_upc            text,
  kcal_per_100g       numeric(7,2),
  protein_g_per_100g  numeric(7,2),
  carbs_g_per_100g    numeric(7,2),
  fat_g_per_100g      numeric(7,2),
  fiber_g_per_100g    numeric(7,2),
  sugar_g_per_100g    numeric(7,2),
  raw_nutrients       jsonb,
  fetched_at          timestamptz default now(),
  expires_at          timestamptz default (now() + interval '30 days')
);

create index usda_foods_barcode_idx on public.usda_foods (gtin_upc)
  where gtin_upc is not null;

-- Intentionally no RLS: shared public cache, SELECT granted to authenticated
grant select on public.usda_foods to authenticated;

-- ── ai_daily_targets ──────────────────────────────────────────────────────
create table public.ai_daily_targets (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  generated_at        timestamptz not null default now(),
  protein_g           numeric(6,2),
  fiber_g             numeric(6,2),
  gl_target           numeric(6,2),
  added_sugar_g       numeric(6,2),
  calorie_min         integer,
  calorie_max         integer,
  pc_ratio_target     numeric(4,2),
  insulin_score_basis jsonb,
  narrative           text,
  prompt_version      integer default 1,
  created_at          timestamptz default now()
);

create index ai_targets_user_idx on public.ai_daily_targets (user_id, generated_at desc);

alter table public.ai_daily_targets enable row level security;

create policy "ai_targets_select_own" on public.ai_daily_targets
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "ai_targets_insert_own" on public.ai_daily_targets
  for insert to authenticated with check ((select auth.uid()) = user_id);
```

**RLS performance note:** `(select auth.uid())` with parentheses evaluates once per query, not per row. This is 10-100x faster than bare `auth.uid()` on large tables. Always use the parenthesized form. [VERIFIED: supabase.com/docs]

---

## Account Deletion Workflow

Account deletion (PROF-03, GDPR right-to-erasure) requires deleting from `auth.users`. The Supabase client cannot do this with the anon key — it requires the service_role key or a Supabase Edge Function.

**Recommended approach:** Supabase Edge Function `delete-account`

```typescript
// supabase/functions/delete-account/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401 })

  // 1. Verify the caller's JWT to get their user_id
  const supabaseUser = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )
  const { data: { user }, error } = await supabaseUser.auth.getUser()
  if (error || !user) return new Response('Unauthorized', { status: 401 })

  // 2. Delete the user (cascade handles all user_id FK tables)
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
  if (deleteError) return new Response(deleteError.message, { status: 500 })

  return new Response(JSON.stringify({ deleted: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

All user data is deleted via `ON DELETE CASCADE` on every `user_id uuid references auth.users(id) on delete cascade` column. No manual deletes needed per table.

**Client call:**
```typescript
const { data, error } = await supabase.functions.invoke('delete-account')
```

---

## Onboarding Wizard Pattern

### 4-Step Flow (Phase 1)

| Step | Path | Component | Data Collected |
|------|------|-----------|----------------|
| 1 | /onboarding/welcome | OnboardingWelcomeScreen | None (intro screen) |
| 2 | /onboarding/profile | OnboardingProfileScreen | display_name, age, height_cm, current_weight_kg, goal_weight_kg |
| 3 | /onboarding/pcos | OnboardingPCOSScreen | pcos_type, goals[] |
| 4 | /onboarding/done | OnboardingDoneScreen | Save to Supabase → redirect /home |

### Progress Tracking (D-08: localStorage via Zustand)

```typescript
// src/stores/onboardingStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface OnboardingState {
  currentStep: number  // 0-3 (maps to 4 onboarding routes)
  formData: {
    display_name?: string
    age?: number
    height_cm?: number
    current_weight_kg?: number
    goal_weight_kg?: number
    pcos_type?: 'confirmed' | 'suspected' | 'managing'
    goals?: string[]
  }
  setStep: (step: number) => void
  setFormData: (data: Partial<OnboardingState['formData']>) => void
  reset: () => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      currentStep: 0,
      formData: {},
      setStep: (step) => set({ currentStep: step }),
      setFormData: (data) => set((s) => ({ formData: { ...s.formData, ...data } })),
      reset: () => set({ currentStep: 0, formData: {} }),
    }),
    {
      name: 'bloom-onboarding',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
```

### RequireProfile Guard Logic

```typescript
// The guard checks the profiles row, not localStorage
// Once profile.pcos_type is non-null, onboarding is complete
const onboardingStepRoutes = [
  '/onboarding/welcome',
  '/onboarding/profile',
  '/onboarding/pcos',
  '/onboarding/done',
]

// In RequireProfile:
if (!profile || !profile.pcos_type) {
  const step = onboardingStore.currentStep  // resume from last saved step
  return <Navigate to={onboardingStepRoutes[step] ?? '/onboarding/welcome'} replace />
}
```

### RHF Form (Step 2 — Profile)

```typescript
const profileSchema = z.object({
  display_name: z.string().min(1, 'Required').max(50),
  age: z.coerce.number().int().min(13).max(100),
  height_cm: z.coerce.number().min(100).max(250),
  current_weight_kg: z.coerce.number().min(20).max(500),
  goal_weight_kg: z.coerce.number().min(20).max(500).optional().or(z.literal('')),
})

type ProfileFormData = z.infer<typeof profileSchema>

// In component:
const form = useForm<ProfileFormData>({
  resolver: zodResolver(profileSchema),
  mode: 'onBlur',
  defaultValues: {
    display_name: onboardingStore.formData.display_name ?? '',
    age: onboardingStore.formData.age ?? undefined,
    // ...
  }
})
```

---

## PWA Configuration

```typescript
// vite.config.ts — VitePWA section
VitePWA({
  registerType: 'prompt',    // show update banner, don't auto-update mid-session
  strategies: 'generateSW',  // Workbox auto-generates SW from config (no custom sw.ts needed)
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'supabase-cache',
          networkTimeoutSeconds: 10,
          expiration: { maxEntries: 100, maxAgeSeconds: 3600 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
  },
  manifest: {
    name: 'Bloom — PCOS Nutrition',
    short_name: 'Bloom',
    description: 'Your PCOS-aware nutrition companion',
    theme_color: '#1F3A4D',       // var(--b-primary) slate default
    background_color: '#EEF2F5',  // var(--b-bg) slate default
    display: 'standalone',
    orientation: 'portrait',
    icons: [
      { src: '/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
  },
})
```

**PWA icon requirement:** The planner must include a task to create `/public/icons/pwa-192x192.png` and `/public/icons/pwa-512x512.png`. Without these files, the manifest references broken images and the PWA install prompt may not appear.

---

## UI Component Library (TypeScript Rewrites of Bits.jsx)

The design reference in `bloom-app-design/project/components/Bits.jsx` exports these components via `window` assignment. Each must be rewritten as a proper TypeScript module in `src/components/ui/`.

### Component API Mapping

| Bits.jsx Component | Props (from source) | TypeScript Interface |
|--------------------|--------------------|--------------------|
| `Chip` | `tone`, `size`, `icon`, `style` | Replace `style` with `className` (D-03) |
| `Card` | `pad`, `style` | Replace `style` with `className` |
| `Btn` | `tone`, `size`, `full`, `icon`, `style` | Replace `style` with `className`; add `onClick`, `type`, `disabled` |
| `IconBtn` | `icon`, `tone`, `size`, `badge` | Add `onClick`, `aria-label` |
| `AppBar` | `title`, `leading`, `trailing`, `subtitle`, `big`, `bg` | Add `className` |
| `Ring` | `value`, `max`, `size`, `stroke`, `color`, `track`, `children`, `label` | Add `className` |
| `Progress` | `value`, `max`, `color`, `track`, `height` | Add `className` |
| `Avatar` | `src`, `name`, `size`, `ring` | Add `className`, `alt` |
| `Sparkline` | `data`, `w`, `h`, `color`, `fill`, `dots`, `dotColor` | Keep SVG props |

**Key rule (D-03):** All components accept `className?: string` for customization. No `style` prop. Use `clsx` for merging.

**Example TypeScript rewrite:**
```typescript
// src/components/ui/Chip.tsx
import { clsx } from 'clsx'
import type { ReactNode } from 'react'

type ChipTone = 'neutral' | 'primary' | 'accent' | 'mint' | 'coral' | 'berry' | 'amber' | 'ghost'
type ChipSize = 'sm' | 'md'

interface ChipProps {
  children: ReactNode
  tone?: ChipTone
  size?: ChipSize
  icon?: ReactNode
  className?: string
}

const toneClasses: Record<ChipTone, string> = {
  neutral: 'bg-b-surface-sunken text-b-ink-2',
  primary: 'bg-b-primary-soft text-b-primary',
  accent:  'bg-b-accent-soft text-b-accent',
  mint:    'bg-b-mint-soft text-b-mint',
  coral:   'bg-b-coral-soft text-b-coral',
  berry:   'bg-b-berry-soft text-b-berry',
  amber:   'bg-b-amber-soft text-b-amber',
  ghost:   'bg-transparent text-b-ink-3 border border-b-hairline',
}

const sizeClasses: Record<ChipSize, string> = {
  sm: 'px-2 py-1 text-[11px]',
  md: 'px-2.5 py-1.5 text-xs',
}

export function Chip({ children, tone = 'neutral', size = 'md', icon, className }: ChipProps) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 rounded-b-pill font-semibold tracking-tight',
      toneClasses[tone],
      sizeClasses[size],
      className,
    )}>
      {icon}{children}
    </span>
  )
}
```

---

## Theme System

```typescript
// src/lib/theme.ts — pure functions, no React needed
type Palette = 'slate' | 'warm' | 'sage'

const PALETTE_KEY = 'bloom-palette'
const DARK_KEY = 'bloom-dark'

export function applyTheme(palette: Palette, dark: boolean) {
  const html = document.documentElement
  html.setAttribute('data-palette', palette === 'slate' ? '' : palette)
  html.setAttribute('data-dark', dark ? 'true' : 'false')
}

export function loadTheme(): { palette: Palette; dark: boolean } {
  const palette = (localStorage.getItem(PALETTE_KEY) ?? 'slate') as Palette
  const dark = localStorage.getItem(DARK_KEY) === 'true'
  return { palette, dark }
}

export function saveTheme(palette: Palette, dark: boolean) {
  localStorage.setItem(PALETTE_KEY, palette)
  localStorage.setItem(DARK_KEY, String(dark))
  applyTheme(palette, dark)
}
```

**Apply in `src/main.tsx` before render:**
```typescript
import { loadTheme, applyTheme } from '@/lib/theme'
const { palette, dark } = loadTheme()
applyTheme(palette, dark)
// Then ReactDOM.createRoot(...)
```

---

## Walking Skeleton (End-to-End Thin Slice)

The Walking Skeleton proves the full stack is wired before any feature work begins.

**Path:** Sign up → email verify → complete onboarding → see home screen (empty state)

**One real Supabase read:** `RequireProfile` queries the `profiles` table to check if onboarding is complete.

**One real Supabase write:** `OnboardingDoneScreen` writes the complete profile row via `supabase.from('profiles').update({...}).eq('id', user.id)`.

**PWA installs:** After scaffold + manifest is wired up, Chrome/Edge shows install prompt.

**Walking Skeleton task sequence (for planner):**
1. Create Vite scaffold with TypeScript strict mode and `@/` path alias
2. Configure Tailwind v4 + CSS variable bridge (tokens.css + @theme inline block)
3. Supabase local dev: `supabase init` + `supabase start` + migration 001 (all tables + RLS)
4. Generate TypeScript types: `supabase gen types typescript --local > src/lib/database.types.ts`
5. `src/lib/supabase.ts` singleton
6. `src/contexts/AuthContext.tsx` (blocks render until session resolves)
7. Sign-up screen + Supabase `signUp()` → redirect to CheckInboxScreen
8. CheckInboxScreen (resend + change email)
9. Auth callback route (`/auth/callback`) to handle email verification redirect
10. RequireAuth guard
11. Onboarding wizard (4 steps, Zustand step tracking)
12. `supabase.from('profiles').update()` on onboarding completion
13. RequireProfile guard (queries profiles row)
14. HomeScreen (empty state — just the tab bar and a placeholder)
15. AppLayout with tab bar
16. vite-plugin-pwa manifest + PWA icons
17. **Smoke test:** Sign up → verify → onboard → home screen loads, no console errors, profiles row exists in Supabase dashboard

---

## Common Pitfalls

### Pitfall 1: RLS Added After Table Creation
**What goes wrong:** Table is created without RLS, test data is stored, then RLS is added later. The "later" never happens in a crisis; meanwhile all rows are accessible to any authenticated user.
**Why it happens:** Developer adds RLS as a TODO.
**How to avoid:** RLS policies are written in the SAME SQL block as `CREATE TABLE`. Migration is rejected in PR review if any table lacks an `enable row level security` statement.
**Warning signs:** A migration file that creates a table without immediately following it with `alter table X enable row level security`.

### Pitfall 2: Multiple Supabase Client Instances
**What goes wrong:** Components create their own `createClient()` instances. Concurrent refresh requests from multiple instances cause 409 conflict errors and random sign-outs. [VERIFIED: Supabase auth conflict docs]
**Why it happens:** Developers copy-paste the client creation pattern from examples into components.
**How to avoid:** `src/lib/supabase.ts` is the single source of truth. ESLint rule or code review convention: never import `createClient` except in `src/lib/supabase.ts`.
**Warning signs:** `import { createClient } from '@supabase/supabase-js'` found in any file other than `src/lib/supabase.ts`.

### Pitfall 3: Flash-Redirect on Browser Refresh
**What goes wrong:** AuthProvider renders children before `getSession()` resolves. React renders the route tree, `RequireAuth` sees `null` session, and redirects to `/welcome`. The real session then arrives 50ms later — too late.
**Why it happens:** Developers forget that `getSession()` is async.
**How to avoid:** `AuthProvider` renders `null` (or a splash/loading indicator) while `loading` is true. Children are never rendered until the initial session check is complete.
**Warning signs:** Briefly seeing the welcome screen when opening the app while already logged in.

### Pitfall 4: Profiles INSERT From Client
**What goes wrong:** Developer calls `supabase.from('profiles').insert(...)` from the client after sign-up. This races with the `on_auth_user_created` trigger and creates duplicate primary key errors.
**Why it happens:** Forgetting that the trigger already creates the row.
**How to avoid:** `profiles` has no INSERT policy for the authenticated role. Only the trigger can create the row. All onboarding writes are `UPDATE`, not `INSERT`.
**Warning signs:** `23505` (unique violation) errors in Supabase logs after sign-up.

### Pitfall 5: Tailwind v4 Config vs v3 Config
**What goes wrong:** Developer tries to create `tailwind.config.ts` (v3 approach) with Tailwind v4 installed. Tailwind v4 ignores this file by default — the config is CSS-first via `@theme`.
**Why it happens:** Most online tutorials still document Tailwind v3 syntax.
**How to avoid:** Use `@theme inline { }` block inside the CSS file imported by Vite. No `tailwind.config.ts` needed.
**Warning signs:** Custom color classes like `bg-b-primary` producing no output in dev.

### Pitfall 6: Email Redirect URL Not Matching Supabase Allowed URLs
**What goes wrong:** After clicking the email verification link, user lands on a Supabase error page or the redirect fails silently.
**Why it happens:** The `emailRedirectTo` URL is not in the list of allowed redirect URLs in the Supabase Auth settings.
**How to avoid:** Before testing auth: go to Supabase Dashboard → Authentication → URL Configuration → add `http://localhost:5173/auth/callback` (dev) and the production URL.
**Warning signs:** Supabase returns an error after email link click; URL shows `?error=redirect_uri_mismatch`.

### Pitfall 7: Missing PWA Icons Silently Breaking Install Prompt
**What goes wrong:** PWA manifest references icon files that don't exist. Chrome skips the install prompt without any error message.
**Why it happens:** Manifest is configured but placeholder icons are never created.
**How to avoid:** Create `public/icons/pwa-192x192.png` and `public/icons/pwa-512x512.png` before testing PWA install. Use a simple colored square as placeholder — shape doesn't matter for smoke testing.
**Warning signs:** Chrome DevTools → Application → Manifest shows icon load errors; install prompt never appears.

---

## Project Constraints (from CLAUDE.md)

| Directive | Enforcement |
|-----------|-------------|
| RLS on every table | `(select auth.uid()) = user_id` on all user-owned tables. Never `using (true)` in production. |
| Supabase singleton | One module-level client in `src/lib/supabase.ts`. Never create in component render. |
| Claude API key in Edge Functions only | Never in Vite env files (bundled into client JS) — N/A in Phase 1 (no Claude calls) |
| GL displays as "—" when GI unknown | Not implemented in Phase 1; reminder for Phase 2 |
| Weight chart uses 7-day rolling average | Not implemented in Phase 1; reminder for Phase 2 |
| Frame all metrics as adequacy, not deficit | Not implemented in Phase 1; reminder for Phase 2 |
| AI targets cache in `ai_daily_targets` | Not implemented in Phase 1; table created but no writes |
| No Tailwind (CLAUDE.md) | **OVERRIDE:** CONTEXT.md D-01/D-02 explicitly locks Tailwind with CSS var bridge. CONTEXT.md is authoritative. CLAUDE.md should be updated to reflect this decision. |
| `bloom-app-design/project/` is read-only | Never modify any file under `bloom-app-design/`. Copy assets (tokens.css) to `src/styles/tokens.css`. |

---

## Runtime State Inventory

SKIPPED — This is a greenfield phase. No existing runtime state, databases, services, or OS registrations to inventory. The project has no prior data — only the read-only design files in `bloom-app-design/` and the planning artifacts in `.planning/`.

---

## Environment Availability

| Dependency | Required By | Available | Notes |
|------------|------------|-----------|-------|
| Node.js | Vite build, npm | Expected (Windows 11 dev machine) | Verify with `node --version` before starting |
| npm | Package install | Expected | npm bundled with Node.js |
| Supabase CLI | Local DB + migrations | Must install | `npm install -g supabase` or download binary |
| Supabase project | Auth + DB | Must create | Create at app.supabase.com before executing |
| PWA icons | manifest | Must create | 192x192 and 512x512 PNG files in public/icons/ |

**Missing dependencies:**
- Supabase CLI: install via `npm install -g supabase` or from supabase.com/docs/guides/cli
- Supabase project: create at https://app.supabase.com — get `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- PWA icons: create placeholder PNGs before testing PWA install

---

## Validation Architecture

### Test Framework

Phase 1 is a new Vite + React project — no test framework exists yet. Because Phase 1 delivers infrastructure (scaffold, auth, schema, guards, onboarding), most validation is integration/smoke-test level. A lightweight test setup is sufficient.

| Property | Value |
|----------|-------|
| Framework | Vitest (built into Vite ecosystem; zero config with `@vitejs/plugin-react`) |
| Config file | `vitest.config.ts` — Wave 0 gap |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Sign-up form submits and calls `supabase.auth.signUp()` | Unit (mock Supabase) | `vitest run tests/auth/signup.test.ts` | Wave 0 gap |
| AUTH-04 | AuthProvider reads session on mount without redirect | Unit | `vitest run tests/auth/auth-context.test.ts` | Wave 0 gap |
| AUTH-05 | Sign-out clears session | Unit (mock Supabase) | `vitest run tests/auth/signout.test.ts` | Wave 0 gap |
| ONBD-01 | Onboarding step navigation (step 1→2→3→done) | Unit (React Testing Library) | `vitest run tests/onboarding/wizard.test.ts` | Wave 0 gap |
| ONBD-04 | RequireProfile redirects when profile.pcos_type is null | Unit (mock TanStack Query) | `vitest run tests/guards/require-profile.test.ts` | Wave 0 gap |
| PROF-02 | Theme persistence: localStorage read on load + data-attribute applied | Unit | `vitest run tests/theme/theme.test.ts` | Wave 0 gap |
| INFRA-01 | RLS policy correctness | Manual (Supabase dashboard SQL) | Manual — verify cross-user access is denied | N/A |
| INFRA-04 | DB types generated from schema | Smoke | `supabase gen types typescript --local \| head -5` | N/A |
| INFRA-05 | SW registered on app load | Smoke (DevTools → Application) | Manual | N/A |
| INFRA-06 | PWA install prompt appears | Manual (Chrome DevTools) | Manual | N/A |

### Sampling Rate

- Per task commit: `npx vitest run --reporter=dot` (unit tests only, < 10s)
- Per wave merge: `npx vitest run --coverage` (full suite)
- Phase gate: Full suite green + manual smoke test of Walking Skeleton path

### Wave 0 Gaps

- [ ] `vitest.config.ts` — Vitest configuration
- [ ] `tests/setup.ts` — shared test setup (mock Supabase client)
- [ ] `tests/auth/auth-context.test.ts` — AUTH-04
- [ ] `tests/onboarding/wizard.test.ts` — ONBD-01, ONBD-04
- [ ] `tests/guards/require-profile.test.ts` — ONBD-04
- [ ] `tests/theme/theme.test.ts` — PROF-02
- [ ] Install: `npm install -D vitest @testing-library/react @testing-library/user-event @vitest/coverage-v8`

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes | Supabase Auth (email/password + email confirmation) |
| V3 Session Management | Yes | Supabase session (localStorage, auto-refresh) + singleton pattern |
| V4 Access Control | Yes | RLS policies on all user-owned tables; RequireAuth + RequireProfile guards |
| V5 Input Validation | Yes | Zod schemas on all form inputs; RHF `mode: 'onBlur'` |
| V6 Cryptography | Supabase-handled | Password hashing: bcrypt via Supabase Auth; JWT signing: Supabase-managed |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Cross-user data access | Information Disclosure | RLS `(select auth.uid()) = user_id` on all user tables |
| Client-side data manipulation | Tampering | `with check` clause on all INSERT/UPDATE RLS policies |
| Service-role key exposure | Elevation of Privilege | Key only in Edge Functions; never in Vite env vars |
| Session fixation | Elevation of Privilege | Supabase rotates JWT on sign-in; enforced by SDK |
| Email enumeration on sign-up | Information Disclosure | Supabase Auth default behavior: generic error messages |
| Onboarding bypass | Elevation of Privilege | RequireProfile guard checks DB (not localStorage) for profile.pcos_type |

**GDPR (PROF-03):** Account deletion via Edge Function using `auth.admin.deleteUser()`. All user data cascades via FK constraints. User must confirm deletion with a modal before the Edge Function is called.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Tailwind v4 `@theme inline` syntax works correctly for CSS variable references in Vite | Tailwind v4 config section | Tailwind classes output static empty values instead of CSS variable references; need to fall back to v3 config approach |
| A2 | `supabase.auth.resend({ type: 'signup', email })` is rate-limited to 60 seconds by default | Email verification flow | User can spam resend requests; add client-side 60s cooldown regardless |
| A3 | `on_auth_user_created` trigger reliably fires before the client receives the sign-up response | Profiles trigger section | Race condition where client queries profiles before trigger fires; add retry/delay in RequireProfile |
| A4 | Supabase CLI local dev works on Windows 11 with Docker Desktop | Environment availability | Local migration workflow fails; use Supabase cloud project directly for dev |

---

## Open Questions

1. **CLAUDE.md vs CONTEXT.md styling conflict**
   - What we know: CLAUDE.md says "No Tailwind"; CONTEXT.md D-01 says "use Tailwind with CSS var bridge"
   - What's unclear: Which is authoritative for the executing agent
   - Recommendation: CONTEXT.md is authoritative (it captures explicit user decisions from a discussion session). Update CLAUDE.md in a Wave 0 task to reflect the Tailwind decision.

2. **Supabase local dev vs cloud for Phase 1**
   - What we know: Supabase CLI requires Docker. Windows 11 dev machine may or may not have Docker.
   - What's unclear: Whether Docker Desktop is installed
   - Recommendation: Planner should include a task to verify `supabase start` works locally, with fallback to using Supabase cloud project if Docker is unavailable.

3. **Email redirect URL in dev**
   - What we know: Email verification links must use a URL in Supabase's allowed redirect list
   - What's unclear: Whether the developer will be testing auth flows locally (localhost:5173) or via a staging URL
   - Recommendation: Include a task to configure allowed redirect URLs in Supabase Dashboard before testing auth.

4. **PWA icon asset creation**
   - What we know: PWA manifest requires 192x192 and 512x512 PNG icons
   - What's unclear: Whether final brand icons exist or if placeholders are acceptable for Phase 1
   - Recommendation: Use a simple placeholder (solid `--b-primary` colored square with Bloom logo outline) for Phase 1. Full brand icons are not blocking.

---

## Sources

### Primary (HIGH confidence)
- Supabase RLS and auth patterns: verified via ARCHITECTURE.md (which was Context7-verified)
- React Router v7 layout routes: verified via ARCHITECTURE.md (Context7-verified)
- vite-plugin-pwa generateSW: verified via STACK.md (Context7-verified)
- npm registry versions (all packages): `npm view [pkg] version` run 2026-05-18

### Secondary (MEDIUM confidence)
- Tailwind v4 `@theme inline` CSS variable bridge: [ASSUMED] from training knowledge; official docs at tailwindcss.com/docs/v4
- Supabase trigger `handle_new_user`: pattern verified in ARCHITECTURE.md; confirmed standard pattern from supabase.com/docs/guides/auth/managing-user-data
- Account deletion Edge Function pattern: ARCHITECTURE.md research; Supabase admin API docs

### Design Reference (verified by reading source files directly)
- `bloom-app-design/project/tokens.css`: read 2026-05-18 — all `--b-*` custom properties, 3 palettes + dark mode
- `bloom-app-design/project/components/Bits.jsx`: read 2026-05-18 — full component API (Icon, Avatar, Chip, Progress, Ring, MultiRing, Card, SectionHeader, AppBar, IconBtn, Btn, Sparkline, BarChart, Photo)
- `bloom-app-design/project/screens/Onboarding.jsx`: read 2026-05-18 — Welcome, ProfileSetup, CoachLink screens
- `bloom-app-design/project/screens/Profile.jsx`: read 2026-05-18 — ProfileScreen with settings rows, theme picker reference

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions npm-verified 2026-05-18
- Tailwind v4 CSS var bridge: MEDIUM — `@theme inline` syntax from training knowledge; planner should verify against tailwindcss.com before implementing
- Supabase schema + RLS: HIGH — patterns verified in prior research (ARCHITECTURE.md)
- Auth flows: HIGH — Supabase Auth patterns well-documented
- Account deletion: HIGH — Edge Function pattern from official Supabase admin API
- PWA: HIGH — vite-plugin-pwa patterns from STACK.md (Context7-verified)

**Research date:** 2026-05-18
**Valid until:** 2026-06-18 (30 days — stack is relatively stable; Tailwind v4 is actively developed, check for breaking changes if more than 2 weeks pass)
