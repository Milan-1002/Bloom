# Bloom — Project Guide

## What This Is

Bloom is a PCOS-aware nutrition companion for women. The app tracks food intake, macros (protein, fiber, glycemic load), symptoms, weight, and uses Claude AI to generate personalized daily targets and an Insulin Balance score. Built as a startup product targeting real users.

**Core Value:** A woman with PCOS can understand how today's food choices affect her insulin balance and symptoms — and receive a personalized, actionable target for the day.

## GSD Workflow

This project uses the GSD (Get Shit Done) workflow. Planning artifacts live in `.planning/`.

**Current state:** See `.planning/STATE.md`
**Requirements:** See `.planning/REQUIREMENTS.md`
**Roadmap:** See `.planning/ROADMAP.md`

### Starting a phase
```
/gsd:discuss-phase <N>   — gather context before planning
/gsd:plan-phase <N>      — create execution plan (PLAN.md)
/gsd:execute-phase <N>   — execute the plan
/gsd:verify-work <N>     — verify phase goals were met
```

### Checking progress
```
/gsd:progress            — see where we are
```

## Tech Stack

- **Frontend:** Vite + React 19 + TypeScript (strict mode)
- **Routing:** react-router-dom v7 (two layout stacks: AuthLayout + AppLayout)
- **Backend:** Supabase (auth + database + RLS + Edge Functions)
- **State:** TanStack Query (server state) + Zustand (ephemeral UI state)
- **Forms:** React Hook Form + Zod v4
- **Charts:** Recharts (RadialBarChart for macro rings, LineChart for weight)
- **Barcode:** html5-qrcode
- **PWA:** vite-plugin-pwa (generateSW strategy)
- **AI:** Claude API via Supabase Edge Function (claude-sonnet-4-6)
- **Food data:** USDA FoodData Central API (free, 1,000 req/hr rate limit)
- **CSS:** Tailwind v4 with CSS variable bridge. `@theme inline { }` block in `src/styles/tokens.css` maps `--b-*` design tokens to Tailwind utility classes (`bg-b-primary`, `text-b-ink`, etc.). Configuration is CSS-first via `@tailwindcss/vite` plugin — no `tailwind.config.ts` file.

## Critical Rules (never break these)

1. **RLS on every table** — `(select auth.uid()) = user_id` on all user-owned tables. Never `using (true)` in production.
2. **Supabase singleton** — one module-level client instance in `src/lib/supabase.ts`. Never create in component render. Never import `createClient` except in `src/lib/supabase.ts`.
3. **Claude API key in Edge Functions only** — never in Vite env files (they get bundled into client JS).
4. **GL displays as "—" when GI unknown** — never show 0 for unknown glycemic load.
5. **Weight chart uses 7-day rolling average** — never raw daily values (harms PCOS users psychologically).
6. **Frame all metrics as adequacy, not deficit** — no red states for eating under calorie target.
7. **AI targets cache in `ai_daily_targets`** — regenerate only on profile change, not per dashboard load.
8. **className prop only on all UI components** — no `style` prop escape hatch on any component in `src/components/ui/`. Use `clsx` or `tailwind-merge` for conditional class composition (D-03).

## Design System

The source of truth for visual design is `bloom-app-design/project/` (read-only — do not modify).

- **Tokens:** `bloom-app-design/project/tokens.css` — all `--b-*` CSS custom properties (copy verbatim to `src/styles/tokens.css`)
- **Screens:** `bloom-app-design/project/screens/` — 11 reference screens
- **Components:** `bloom-app-design/project/components/Bits.jsx` — shared component reference

**Tailwind v4 CSS variable bridge:**
- `src/styles/tokens.css` contains: all `--b-*` variables, then `@import "tailwindcss"`, then `@theme inline { --color-b-primary: var(--b-primary); ... }`
- Use Tailwind utility classes: `bg-b-primary`, `text-b-ink-2`, `rounded-b-md`, `shadow-b-card`
- Theme switching works via `data-palette` / `data-dark` attributes on `<html>` — pure CSS cascade, no JS theme injection needed
- Never hardcode hex values in component code — always use `var(--b-*)` references or the corresponding Tailwind class

## Supabase Schema (planned)

```
profiles          — user_id FK, pcos_type, goals[], height, weight, etc.
food_logs         — user_id, fdc_id, macros denormalized at write time
usda_foods        — shared cache keyed by fdc_id, indexed by gtin_upc
weight_logs       — user_id, date, weight_kg
symptom_logs      — user_id, date, energy, mood, sleep, bloating, skin
ai_daily_targets  — user_id, targets JSON, narrative, generated_at
coach_invites     — user_id, coach_id, token, status (v2)
```

## Repository

Remote: https://github.com/Milan-1002/Bloom.git

## Don't Build These (v1 out of scope)

- Native iOS / Android app
- Google / Apple OAuth
- Real-time coach messaging
- Full coach portal
- Apple Health integration
- Subscription / payments
- Push notifications (iOS PWA limitation)
- Weekly macro & GL trends screen
- Custom food creation / favorites / recipes (v2)
- Cycle tracking (v2)
