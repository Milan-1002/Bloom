---
phase: "01"
plan: "04"
subsystem: "foundation"
tags: ["router", "guards", "tanstack-query", "zustand", "tab-bar", "tdd"]
dependency_graph:
  requires:
    - "01-02 (supabase singleton)"
    - "01-03 (AuthProvider, useAuth, auth screens)"
  provides:
    - "Full React Router v7 route tree in App.tsx"
    - "RequireAuth guard (session check)"
    - "RequireProfile guard (DB profile check + onboarding step resume)"
    - "useProfile TanStack Query hook"
    - "useOnboardingStore (Zustand + persist to localStorage)"
    - "AppLayout with fixed bottom tab bar (Home + Profile)"
    - "HomeScreen walking skeleton endpoint"
  affects:
    - "01-05 (onboarding screens plug into /onboarding/* routes)"
    - "Phase 2+ screens plug into AppLayout via /home and new routes"
tech_stack:
  patterns:
    - "RequireProfile reads pcos_type from DB — localStorage manipulation cannot bypass the guard"
    - "useOnboardingStore currentStep determines which onboarding step to resume (not access control)"
    - "useProfile staleTime=5m — profile rarely changes, avoids redundant DB fetches"
    - "AppLayout: fixed bottom nav, main content has pb-20 to avoid overlap"
    - "Stub screens (Onboarding*, ProfileScreen) return null — replaced in plan 01-05"
key_files:
  created:
    - "src/stores/onboardingStore.ts"
    - "src/hooks/useProfile.ts"
    - "src/components/layout/RequireAuth.tsx"
    - "src/components/layout/RequireProfile.tsx"
    - "src/components/layout/AuthLayout.tsx"
    - "src/components/layout/AppLayout.tsx"
    - "src/screens/home/HomeScreen.tsx"
    - "tests/guards/require-profile.test.tsx"
  modified:
    - "src/App.tsx"
metrics:
  duration: "~15 minutes"
  completed: "2026-05-18"
  tasks_completed: 2
  files_created: 9
---

# Phase 01 Plan 04: Router Shell + Guards + AppLayout

**One-liner:** Full route tree wired with RequireAuth + RequireProfile guards, tab bar shell, and a walking skeleton HomeScreen. 21/21 tests passing.

## What Was Built

### Task 1: Guards + useProfile (TDD)

**RED→GREEN:** 5 guard tests written first, then implementations.

| Test | Result |
|------|--------|
| Redirects to /onboarding/welcome when profile null | PASS |
| Redirects to /onboarding/welcome when pcos_type null | PASS |
| Renders Outlet when pcos_type non-null | PASS |
| Renders nothing while isLoading | PASS |
| Redirects to /onboarding/profile when currentStep=1 | PASS |

**RequireProfile logic:**
1. No session → `/welcome`
2. Loading → `null` (no flash)
3. No profile or `pcos_type` null → `onboardingStepRoutes[currentStep]`
4. Profile complete → `<Outlet />`

**useOnboardingStore:** Persisted to `localStorage` key `bloom-onboarding`. Stores `currentStep` (0-3) and partial `formData`. `currentStep` controls which onboarding step to resume — it does NOT control auth access (the DB `pcos_type` column does).

### Task 2: Router Shell + AppLayout

**App.tsx route tree:**
```
BrowserRouter > AuthProvider
  AuthLayout (public)
    /welcome, /signup, /signin, /check-inbox, /reset-password, /auth/callback
  RequireAuth (session required)
    /onboarding/welcome, /onboarding/profile, /onboarding/pcos, /onboarding/done
  RequireProfile (session + complete profile)
    AppLayout (tab bar)
      /home → HomeScreen
      /profile → stub (plan 01-05)
  / → redirect /home
  * → redirect /welcome
```

**AppLayout:** Fixed bottom tab bar (Home + Profile), active state from `useLocation().pathname`, `text-b-primary` active / `text-b-ink-3` inactive, `pb-20` on main content.

## Verification Results

| Check | Result |
|-------|--------|
| `npx vitest run` (all suites) | 21/21 pass |
| `npx tsc --noEmit` | 0 errors |
| RequireProfile checks DB pcos_type (not localStorage) | confirmed |
| onboardingStore manipulation cannot bypass main app | confirmed (T-04-02) |

## Threat Model Compliance

| Threat | Mitigation |
|--------|------------|
| T-04-01: Route guard bypass via direct URL | RequireAuth+RequireProfile both check server-validated JWT + DB row |
| T-04-02: Onboarding skip via localStorage | `currentStep` only determines resumption step; DB `pcos_type` grants access |

## Self-Check: PASSED
