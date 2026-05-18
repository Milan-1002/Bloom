# Phase 1: Foundation - Context

**Gathered:** 2026-05-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 delivers everything the app needs to exist but no feature screens:
- Vite + React 19 + TypeScript scaffold with ESLint/Prettier
- All Supabase tables (profiles, food_logs, weight_logs, symptom_logs, usda_foods, ai_daily_targets) + RLS policies in migration 1
- AuthContext singleton, email/password auth flows (sign up → verify → onboard)
- React Router v7 shell: AuthLayout, AppLayout, RequireAuth guard, RequireProfile guard
- UI component library extracted from bloom-app-design design tokens (Tailwind + CSS var bridge)
- 4-step onboarding wizard (welcome → profile → PCOS type → goals), hard-gated until complete
- PWA manifest + vite-plugin-pwa service worker (generateSW strategy)
- Account deletion flow (GDPR right-to-erasure, cascading delete on all user data)

**What is NOT in this phase:** Any feature screens (food logging, dashboard, symptoms, weight, AI).
</domain>

<decisions>
## Implementation Decisions

### Styling

- **D-01: Tailwind CSS** — production components use Tailwind classes, not inline style objects. Tailwind is bridged to the existing `--b-*` design token system.
- **D-02: CSS variable bridge** *(Claude's discretion)* — `tailwind.config.ts` maps tokens as CSS variable references: `colors: { 'b-primary': 'var(--b-primary)', 'b-surface': 'var(--b-surface)', ... }`. Palette switching and dark mode continue to be driven by `data-palette` and `data-dark` attributes on `<html>` — no JS theme injection needed. Tailwind classes resolve to the correct values automatically.
- **D-03: `className` prop only** — all UI components accept a `className` prop for customization. No `style` prop escape hatch on any component. Use `clsx` or `tailwind-merge` for conditional class composition.
- **D-04: `--b-*` tokens preserved** — `bloom-app-design/project/tokens.css` is copied to `src/styles/tokens.css` and imported in `src/main.tsx`. Never hardcode hex values in component code; always use `var(--b-*)` or the corresponding Tailwind class.

### Email Verification Flow

- **D-05: Hard block** — after sign-up, user lands on a "Check your inbox" screen. The app is completely inaccessible until the email verification link is clicked. No soft gate, no partial access.
- **D-06: Resend + change email** — the "Check your inbox" screen has two actions: resend verification email (rate-limited via Supabase, one resend per 60 seconds) and a "Change email" option that returns the user to the sign-up form pre-filled with their previous entries (minus the email field).
- **D-07: Post-verification redirect → onboarding step 1** — after clicking the verification link, the user lands directly on onboarding step 1 (welcome screen). No intermediate "Email verified!" confirmation screen.

### Onboarding Gate *(Claude's discretion — not discussed)*

- **D-08: Hard gate with resumable progress** — `RequireProfile` guard redirects to the current incomplete onboarding step (not always step 1). Onboarding progress is tracked in `localStorage` (step index) until the profile is saved to Supabase. Once the profile row exists, the guard passes. User cannot access any main app tab while profile is incomplete.

### Theme Persistence *(Claude's discretion — not discussed)*

- **D-09: localStorage** — selected palette (`slate` | `warm` | `sage`) and dark mode preference are stored in `localStorage` and applied immediately on load. No Supabase round-trip needed for theme. If a `profiles` column for theme is added in the future, localStorage acts as the fast-path cache.

### Claude's Discretion

- Tailwind CSS variable bridge strategy (D-02) — CSS var bridge chosen over Tailwind-native themes to preserve the existing data-attribute switching mechanism and avoid duplicating token values.
- Onboarding gate behavior (D-08) — hard gate with localStorage progress tracking (step index).
- Theme persistence (D-09) — localStorage only for v1.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design System
- `bloom-app-design/project/tokens.css` — ALL `--b-*` CSS custom properties (colors, radii, shadows, fonts). Source of truth for the design token system. Copy to `src/styles/tokens.css`.
- `bloom-app-design/project/components/Bits.jsx` — Reference for ALL shared UI component APIs (Card, Chip, Ring, Avatar, Btn, AppBar, Progress, etc.). Production components should match these APIs with TypeScript props.

### Screen References (Onboarding only — Phase 1 scope)
- `bloom-app-design/project/screens/Onboarding.jsx` — Welcome screen, ProfileSetup form (4-step flow), CoachLink screen (skip in Phase 1 — coach is v2)
- `bloom-app-design/project/screens/Profile.jsx` — Profile & settings screen reference (theme picker, account deletion)

### Planning Artifacts
- `.planning/REQUIREMENTS.md` — Full v1 requirements. Phase 1 covers: AUTH-01–05, ONBD-01–04, PROF-01–03, INFRA-01–06
- `.planning/research/STACK.md` — Exact library versions and rationale
- `.planning/research/ARCHITECTURE.md` — Supabase schema design, RLS policy patterns, React Router structure, Supabase singleton pattern
- `.planning/research/PITFALLS.md` — Critical pitfalls: RLS from migration 1, Supabase singleton, data deletion before storing production data

### No external specs — requirements fully captured in decisions above

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `bloom-app-design/project/tokens.css` — CSS custom properties to copy verbatim into `src/styles/tokens.css`
- `bloom-app-design/project/components/Bits.jsx` — Full API reference for Card, Chip, Ring, MultiRing, Sparkline, Avatar, Photo, Btn, IconBtn, AppBar, Progress, SectionHeader — all need TypeScript rewrites in `src/components/ui/`
- `bloom-app-design/project/screens/Onboarding.jsx` — ProfileSetup form fields (name, age, height, weight, goal weight, PCOS type, goals) — exact field list to implement

### Established Patterns (from prototype)
- Theme switching via `data-palette` / `data-dark` on `<html>` — carry forward exactly
- Semantic tone props on components (`tone="mint"` / `tone="coral"` / etc.) — carry forward
- `PascalCase` screen components with `Screen` suffix (e.g., `OnboardingScreen`, `ProfileScreen`)
- `font-variant-numeric: tabular-nums` class `.b-num` for numeric data display

### Integration Points
- `src/main.tsx` — imports `tokens.css`, sets up TanStack QueryClient, renders App
- `src/lib/supabase.ts` — singleton client; must be module-level, never in component render
- `src/contexts/AuthContext.tsx` — wraps entire app; provides session, user, loading state; blocks render until initial session check resolves (prevents flash-redirect on refresh)
- React Router root: `AuthLayout` (unauthenticated routes) + `AppLayout` (tab bar, authenticated routes)

</code_context>

<specifics>
## Specific Ideas

- The onboarding flow in `Onboarding.jsx` shows a 4-step progress bar. The coach-link step (step 4 in prototype) should be simplified or skipped in Phase 1 since coach features are v2. The 4-step flow in Phase 1 is: welcome → profile form → PCOS type + goals → done (redirect to home).
- The Profile screen prototype (`screens/Profile.jsx`) has theme picker UI — implement this in Phase 1 as localStorage-backed with data-attribute application.
- `RequireProfile` guard: check `profiles` row existence (or `pcos_type` non-null) to determine if onboarding is complete. If no row → redirect to `/onboarding`.

</specifics>

<deferred>
## Deferred Ideas

- Onboarding gate behavior — discussed internally, using hard gate with localStorage progress tracking
- Theme persistence — using localStorage only (Supabase sync deferred to v2)
- Coach link step in onboarding — skipped in Phase 1 (coach features are v2)
- Custom food creation, favorites — v2 food logging enhancements
- Cycle tracking — v2

None surfaced during discussion.

</deferred>

---

*Phase: 1-Foundation*
*Context gathered: 2026-05-18*
