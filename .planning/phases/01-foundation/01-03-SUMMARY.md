---
phase: "01"
plan: "03"
subsystem: "foundation"
tags: ["auth", "supabase-auth", "react-context", "react-hook-form", "zod", "tdd"]
dependency_graph:
  requires:
    - "01-01 (scaffold, UI components, react-hook-form, zod installed)"
    - "01-02 (supabase singleton at @/lib/supabase)"
  provides:
    - "AuthProvider wrapping the app with session/user/loading/signOut"
    - "useAuth() hook (throws outside provider)"
    - "6 auth screens: Welcome, SignUp, SignIn, CheckInbox, ResetPassword, AuthCallback"
  affects:
    - "01-04 (RequireAuth + RequireProfile guards consume useAuth)"
    - "01-05 (onboarding flow is the post-verification landing)"
tech_stack:
  patterns:
    - "AuthProvider returns null while loading=true — prevents flash-redirect on browser refresh"
    - "onAuthStateChange subscription cleaned up in useEffect return"
    - "CheckInboxScreen: hard block with 60s resend cooldown via setInterval countdown"
    - "AuthCallbackScreen: onAuthStateChange + getSession both checked; 10s timeout guard"
    - "ResetPasswordScreen: dual mode via window.location.hash.includes('access_token')"
    - "All forms: react-hook-form + zodResolver, no uncontrolled submit"
key_files:
  created:
    - "src/contexts/AuthContext.tsx"
    - "src/hooks/useAuth.ts"
    - "src/screens/auth/WelcomeScreen.tsx"
    - "src/screens/auth/SignUpScreen.tsx"
    - "src/screens/auth/SignInScreen.tsx"
    - "src/screens/auth/CheckInboxScreen.tsx"
    - "src/screens/auth/ResetPasswordScreen.tsx"
    - "src/screens/auth/AuthCallbackScreen.tsx"
    - "tests/auth/auth-context.test.tsx"
decisions:
  - "Used vi.hoisted() for mock function declarations — vi.mock() factory runs before variable initialization; hoisted() ensures mocks are available when factory executes."
  - "Mocked @/lib/supabase directly in auth tests (not @supabase/supabase-js) — singleton throws on missing env vars; direct mock bypasses the throw cleanly."
metrics:
  duration: "~20 minutes"
  completed: "2026-05-18"
  tasks_completed: 2
  files_created: 9
---

# Phase 01 Plan 03: Auth Flow Summary

**One-liner:** AuthProvider singleton with session guard, 6 auth screens wired to Supabase Auth, TDD — 6 tests RED→GREEN, 16/16 suite passing.

## What Was Built

### Task 1: AuthContext + useAuth (TDD)

**RED commit:** `tests/auth/auth-context.test.tsx` (6 tests) — all fail (module not found).

**GREEN commit:** `src/contexts/AuthContext.tsx` + `src/hooks/useAuth.ts`

| Test | Result |
|------|--------|
| Renders null while getSession() pending | PASS |
| Renders children after getSession() resolves | PASS |
| Exposes session/user/loading after resolution | PASS |
| Throws when used outside AuthProvider | PASS |
| signOut() calls supabase + clears session | PASS |
| Cleans up subscription on unmount | PASS |

AuthProvider shape:
```ts
interface AuthContextValue {
  session: Session | null
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}
```

### Task 2: 6 Auth Screens

| Screen | Route | Key behavior |
|--------|-------|-------------|
| WelcomeScreen | /welcome | Hero image + gradient overlay, BloomMark SVG, tagline, two CTAs |
| SignUpScreen | /signup | RHF + Zod, signUp() with emailRedirectTo /auth/callback |
| SignInScreen | /signin | RHF + Zod, signInWithPassword(), "Forgot password?" link |
| CheckInboxScreen | /check-inbox | Hard block, 60s countdown resend, change email -> /signup |
| ResetPasswordScreen | /reset-password | Dual mode (hash check): request email OR updateUser() |
| AuthCallbackScreen | /auth/callback | onAuthStateChange + getSession; navigates /onboarding/welcome; 10s timeout |

## Verification Results

| Check | Result |
|-------|--------|
| `npx vitest run` (all suites) | 16/16 pass |
| `npx tsc --noEmit` | 0 errors |
| CheckInboxScreen has no app-screen navigation | confirmed |
| CheckInboxScreen has 60s cooldown timer | confirmed |
| AuthCallbackScreen navigates to '/onboarding/welcome' | confirmed |
| SignUpScreen contains emailRedirectTo + '/auth/callback' | confirmed |
| ResetPasswordScreen calls both resetPasswordForEmail and updateUser | confirmed |
| No screen imports createClient directly | confirmed |
| All forms use react-hook-form + zodResolver | confirmed |

## Threat Model Compliance

| Threat | Mitigation Applied |
|--------|-------------------|
| T-03-01: Email verification bypass | CheckInboxScreen has zero navigation to app screens |
| T-03-02: Email enumeration | Generic "check your email" shown for all sign-up outcomes |
| T-03-04: Flash-redirect bypass | AuthProvider returns null while loading=true |
| T-03-05: Resend spam | Client-side 60s countdown + Supabase server rate limit |

## Self-Check: PASSED
