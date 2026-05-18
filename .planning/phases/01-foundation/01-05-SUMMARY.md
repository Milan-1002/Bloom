---
phase: "01"
plan: "05"
subsystem: "foundation"
tags: ["onboarding", "pwa", "edge-function", "profile", "theme", "tdd"]
dependency_graph:
  requires:
    - "01-04 (router shell, guards, onboardingStore, useProfile)"
    - "01-02 (Supabase schema — profiles UPDATE, delete-account cascade)"
  provides:
    - "4-step onboarding wizard (Welcome→Profile→PCOS→Done)"
    - "ProfileScreen with theme picker + account deletion"
    - "delete-account Edge Function (JWT verify + admin delete)"
    - "PWA manifest + sw.js (generateSW, NetworkFirst for Supabase)"
    - "Walking Skeleton proven end-to-end"
    - "SKELETON.md architectural record"
  affects:
    - "Phase 2 (plugs food logging into AppLayout + HomeScreen)"
tech_stack:
  patterns:
    - "OnboardingDoneScreen: UPDATE (never INSERT) via profiles trigger — enforced by no INSERT policy"
    - "z.preprocess for optional number fields — z.coerce.number().optional() converts '' to 0 (wrong); preprocess → undefined preserves emptiness"
    - "Chip gains onClick -> renders as <button> when provided, <span> otherwise"
    - "delete-account: dual Supabase clients (anon for JWT verify, admin for delete) — service_role never in browser"
    - "PWA generateSW + NetworkFirst for *.supabase.co — auth responses not cached"
key_files:
  created:
    - "src/screens/onboarding/OnboardingWelcomeScreen.tsx"
    - "src/screens/onboarding/OnboardingProfileScreen.tsx"
    - "src/screens/onboarding/OnboardingPCOSScreen.tsx"
    - "src/screens/onboarding/OnboardingDoneScreen.tsx"
    - "src/screens/profile/ProfileScreen.tsx"
    - "supabase/functions/delete-account/index.ts"
    - "public/icons/pwa-192x192.png"
    - "public/icons/pwa-512x512.png"
    - "tests/onboarding/wizard.test.tsx"
  modified:
    - "src/App.tsx (real onboarding + profile imports)"
    - "src/components/ui/Chip.tsx (onClick prop)"
    - "src/screens/auth/WelcomeScreen.tsx (tone='base' removed)"
    - "src/screens/auth/CheckInboxScreen.tsx (tone fixed)"
    - "vite.config.ts (full PWA config)"
    - ".planning/phases/01-foundation/01-SKELETON.md"
decisions:
  - "z.preprocess for optional number fields — z.coerce.number().optional() coerces '' to 0 which fails min() validation. preprocess → undefined is the correct pattern for optional HTML number inputs."
  - "Chip renders as <button> when onClick is provided — avoids wrapping in extra button element while keeping span semantics for display-only chips."
  - "Removed tone='base' from Btn calls — replaced with unstyled <button> with explicit Tailwind classes for cases where design doesn't map to the 4 defined tones."
  - "Removed useForm<FormValues> type parameter — Zod v4 coerce changes input type inference; letting RHF infer from zodResolver avoids type conflicts."
metrics:
  duration: "~35 minutes"
  completed: "2026-05-18"
  tasks_completed: 3
  files_created: 12
---

# Phase 01 Plan 05: Onboarding + ProfileScreen + PWA

**One-liner:** Walking Skeleton complete — 4-step onboarding wizard saves to Supabase, ProfileScreen with live theme switching and Edge Function account deletion, PWA manifest with generateSW, 25/25 tests passing.

## What Was Built

### Task 1: Onboarding Wizard (TDD)

RED→GREEN: 4 tests written first, then implementations.

| Test | Result |
|------|--------|
| OnboardingProfileScreen shows validation error (empty name) | PASS |
| OnboardingProfileScreen calls setFormData on valid submit | PASS |
| OnboardingDoneScreen calls supabase profiles UPDATE on mount | PASS |
| OnboardingDoneScreen calls reset() after successful update | PASS |

**4 screens:**

| Screen | Route | Key behavior |
|--------|-------|-------------|
| OnboardingWelcomeScreen | /onboarding/welcome | Hero CTA, setStep(1), navigate /onboarding/profile |
| OnboardingProfileScreen | /onboarding/profile | RHF+Zod form, coerce numbers, optional goal weight with preprocess |
| OnboardingPCOSScreen | /onboarding/pcos | 3 PCOS type buttons + 7 goal chips (Chip onClick) |
| OnboardingDoneScreen | /onboarding/done | Auto-saves on mount via useEffect, invalidateQueries, reset, navigate /home |

### Task 2: ProfileScreen + Edge Function

**ProfileScreen sections:**
1. Avatar header (display_name, age, pcos_type bio)
2. Theme picker: palette swatches (slate #1F3A4D / warm #C16D4A / sage #4D6A47) + dark mode toggle → `saveTheme()` on change
3. Account deletion: "DELETE" confirmation input → `supabase.functions.invoke('delete-account')` → signOut

**delete-account Edge Function:**
- Reads `Authorization` header → verifies JWT via anon client → gets user.id
- Admin client (SUPABASE_SERVICE_ROLE_KEY) → `auth.admin.deleteUser(user.id)`
- ON DELETE CASCADE removes all user-owned rows

### Task 3: PWA + Config

- `vite.config.ts`: registerType: 'prompt', strategies: 'generateSW', NetworkFirst for `*.supabase.co`
- Manifest: name "Bloom — PCOS Nutrition", theme_color #1F3A4D, display standalone, two icons
- Build produces `dist/sw.js` + `dist/manifest.webmanifest`
- SKELETON.md updated to "Implementation complete"

## Deviations from Plan

**z.coerce.number().optional() with empty inputs (auto-fixed)**
- `z.coerce.number()` converts `""` to `0` via `Number("")`. Then `optional()` passes it as 0, failing `min(20)`.
- Fix: `z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number().min(20).max(500).optional())`

**invalid_type_error removed (Zod v4 API change)**
- Zod v4 changed the error options API for coerce. Removed `{ invalid_type_error }` and relied on default messages + min/max error strings.

**Chip onClick added**
- OnboardingPCOSScreen needed clickable chips for goal selection. Added `onClick?: () => void` to Chip which renders as `<button>` when provided.

**tone="base" removed from Btn**
- Btn only accepts 4 tones. Replaced with plain `<button>` styled directly with Tailwind where the design required white-on-dark CTA.

## Verification Results

| Check | Result |
|-------|--------|
| `npx vitest run` (all suites) | 25/25 pass |
| `npx tsc --noEmit` | 0 errors |
| `npm run build` | Exit 0 |
| `dist/sw.js` exists | yes |
| `dist/manifest.webmanifest` exists | yes |
| OnboardingDoneScreen uses UPDATE not INSERT | confirmed |
| OnboardingDoneScreen calls reset() | confirmed |
| delete-account reads SUPABASE_SERVICE_ROLE_KEY from Deno.env | confirmed |
| ProfileScreen contains saveTheme() call | confirmed |
| ProfileScreen contains supabase.functions.invoke('delete-account') | confirmed |

## Threat Model Compliance

| Threat | Mitigation |
|--------|------------|
| T-05-01: Delete without confirmation | "DELETE" string comparison required before invoke |
| T-05-02: Unauthenticated delete-account | Edge Function verifies JWT first, returns 401 on failure |
| T-05-03: Service role key in client bundle | Key only in Deno.env — never in Vite env files |
| T-05-04: Onboarding skip via direct URL | RequireProfile checks DB pcos_type — blocks until UPDATE completes |
| T-05-05: PWA caching stale auth | NetworkFirst for Supabase CDN — auth responses not served from cache |

## Phase 1 Complete

All 5 plans executed. Walking Skeleton proven:
- 25/25 tests passing (auth context, guards, onboarding wizard)
- 5 plans committed: 01-01 through 01-05
- Build: 0 TypeScript errors, sw.js + manifest.webmanifest in dist/

**Pending:** Task 4 — manual Walking Skeleton smoke test (sign up → verify → onboard → /home).

## Self-Check: PASSED
