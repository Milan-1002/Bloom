---
phase: "01"
plan: "01"
subsystem: "foundation"
tags: ["vite", "react", "tailwind-v4", "design-tokens", "ui-components", "tdd", "theme"]
dependency_graph:
  requires: []
  provides:
    - "Vite + React 19 + TypeScript scaffold"
    - "Tailwind v4 CSS variable bridge via @tailwindcss/vite"
    - "All --b-* design tokens in src/styles/tokens.css"
    - "@theme inline block mapping tokens to Tailwind utility classes"
    - "Theme system (applyTheme/loadTheme/saveTheme) with localStorage persistence"
    - "TanStack Query singleton (queryClient)"
    - "9 typed UI components: Avatar, Btn, Card, Chip, IconBtn, Progress, Ring, AppBar, Sparkline"
  affects:
    - "All subsequent plans (foundation dependency)"
tech_stack:
  added:
    - "vite@8 + @vitejs/plugin-react@6"
    - "react@19 + react-dom@19 (TypeScript strict)"
    - "@tailwindcss/vite@4 (CSS-first, no tailwind.config.ts)"
    - "tailwindcss@4"
    - "react-router-dom@7"
    - "@supabase/supabase-js@2"
    - "clsx@2 + tailwind-merge@3"
    - "react-hook-form@7 + zod@4 + @hookform/resolvers@5"
    - "@tanstack/react-query@5 + zustand@5"
    - "vite-plugin-pwa@1 (stub configuration)"
    - "vitest@4 + @testing-library/react@16 + jsdom@29"
  patterns:
    - "CSS-first Tailwind v4: @theme inline {} maps --b-* tokens to Tailwind utility classes"
    - "Theme-before-render: applyTheme called in main.tsx before ReactDOM.createRoot"
    - "className-only UI components: no style prop (D-03 rule)"
    - "TDD: RED test commit then GREEN implementation commit"
key_files:
  created:
    - "src/styles/tokens.css"
    - "src/lib/theme.ts"
    - "src/lib/queryClient.ts"
    - "src/main.tsx"
    - "src/App.tsx"
    - "src/components/ui/Avatar.tsx"
    - "src/components/ui/Btn.tsx"
    - "src/components/ui/Card.tsx"
    - "src/components/ui/Chip.tsx"
    - "src/components/ui/IconBtn.tsx"
    - "src/components/ui/Progress.tsx"
    - "src/components/ui/Ring.tsx"
    - "src/components/ui/AppBar.tsx"
    - "src/components/ui/Sparkline.tsx"
    - "src/components/ui/index.ts"
    - "vite.config.ts"
    - "tsconfig.app.json"
    - "vitest.config.ts"
    - "tests/setup.ts"
    - "tests/theme/theme.test.ts"
    - ".env.example"
    - ".prettierrc"
    - "eslint.config.js"
  modified: []
decisions:
  - "Used eslint.config.js flat config (not .eslintrc.cjs) — vite@latest generates flat config; both achieve the same no-restricted-imports rule for Supabase createClient"
  - "Added ignoreDeprecations: 6.0 to tsconfig.app.json — TypeScript 6 deprecates baseUrl but it is still required when using paths; this silences the build warning without removing the alias"
  - "Avatar: backgroundImage is the one allowed inline style exception — dynamic user image URL cannot be a CSS custom property or Tailwind class"
  - "Progress and Ring: backgroundColor/color inline styles allowed for dynamic computed values passed as props"
  - "AppBar: bg prop uses inline style for background because the value is caller-provided (not a design token)"
metrics:
  duration: "~25 minutes"
  completed: "2026-05-18"
  tasks_completed: 2
  files_created: 22
---

# Phase 01 Plan 01: Foundation Bootstrap Summary

**One-liner:** Vite + React 19 + TypeScript strict scaffold with Tailwind v4 CSS-variable bridge, all --b-* design tokens, theme system tested via TDD, and 9 className-only UI components.

## What Was Built

### Task 1: Scaffold + Tailwind v4 + Design Token CSS (TDD)

Bootstrapped the Bloom app from a Vite React TypeScript template and installed all dependencies in one pass. The key files:

- **`src/styles/tokens.css`** — Contains all `--b-*` CSS custom properties copied verbatim from `bloom-app-design/project/tokens.css` (slate/warm/sage palettes, dark mode, base reset, helper classes), followed by `@import "tailwindcss"` and the `@theme inline {}` block mapping every `--b-*` token to a Tailwind utility class (`bg-b-primary`, `text-b-ink-2`, `rounded-b-md`, `shadow-b-card`, etc.).

- **`src/lib/theme.ts`** — `applyTheme(palette, dark)` sets `data-palette`/`data-dark` on `<html>` (slate maps to empty string, not "slate"). `loadTheme()` reads from localStorage with fallback to `{ palette: 'slate', dark: false }` and validates against known palettes. `saveTheme()` persists + applies.

- **`src/main.tsx`** — Imports `tokens.css`, calls `loadTheme()` + `applyTheme()` BEFORE `ReactDOM.createRoot` to eliminate flash of unstyled content.

- **`vite.config.ts`** — `tailwindcss()` plugin from `@tailwindcss/vite` (no postcss.config needed), VitePWA stub, `@` alias pointing to `./src`.

**TDD cycle:**
- RED commit (`ff5b4dc`): 10 failing tests (module not found)
- GREEN commit (`29f54a6`): All 10 tests pass

### Task 2: TypeScript UI Component Library

Implemented all 9 UI components from `bloom-app-design/project/components/Bits.jsx` rewritten as TypeScript:

| Component | Key behavior |
|-----------|-------------|
| `Avatar` | Initials fallback, dynamic backgroundImage (allowed exception), ring via boxShadow |
| `Chip` | 8 tones via toneClasses map, ghost gets border |
| `Card` | bg-b-surface, rounded-b-md, shadow-b-card, 3 pad sizes |
| `Btn` | 4 tones, 3 sizes, full-width, renders as `<button>` element |
| `IconBtn` | Circle button, badge dot, aria-label required |
| `AppBar` | leading/trailing slots, big variant uses font-display |
| `Progress` | Computed width%, dynamic color via inline style |
| `Ring` | SVG circles, strokeDashoffset progress, children/label overlay |
| `Sparkline` | SVG polyline, optional fill polygon, optional dots |

All components: `className?: string` only (no `style` prop per D-03), use `clsx()` for class composition.

## Verification Results

| Check | Result |
|-------|--------|
| `npx vitest run tests/theme/theme.test.ts` | 10/10 pass |
| `npx tsc --noEmit` | 0 errors |
| `npm run build` | Exit 0, dist/ produced (20.4 kB CSS, 215.8 kB JS) |
| No `style?` prop in any component interface | Confirmed |
| All 9 components exported from `src/components/ui/index.ts` | Confirmed |
| `@theme inline` block in tokens.css | Confirmed |
| `applyTheme` called before `createRoot` in main.tsx | Confirmed |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript 6 deprecation of `baseUrl`**
- **Found during:** Task 1 (npm run build)
- **Issue:** TypeScript 6 emits error TS5101 for `baseUrl` in tsconfig.app.json
- **Fix:** Added `"ignoreDeprecations": "6.0"` to tsconfig.app.json — official TypeScript migration path; `baseUrl` is still required for `paths` alias resolution in bundler mode
- **Files modified:** `tsconfig.app.json`

**2. [Rule 3 - Blocking] Vite scaffold refused to overwrite existing directory**
- **Found during:** Task 1 (npm create vite@latest .)
- **Issue:** `npm create vite@latest .` cancels when target directory has existing files (even just CLAUDE.md)
- **Fix:** Scaffolded to `app-tmp/`, copied files over with `cp -r`, removed temp directory
- **Impact:** None — identical output to direct scaffold

**3. [Rule 3 - Deviation] ESLint flat config instead of .eslintrc.cjs**
- **Found during:** Task 1
- **Issue:** `vite@latest` generates `eslint.config.js` (flat config format), not `.eslintrc.cjs`
- **Fix:** Added `no-restricted-imports` rule to the flat config `eslint.config.js` — achieves the same enforcement of Supabase singleton
- **Files modified:** `eslint.config.js`

## Threat Model Compliance

| Threat | Mitigation Applied |
|--------|-------------------|
| T-01-01: localStorage tampering | `loadTheme()` validates palette against `['slate', 'warm', 'sage']`; invalid values fall back to 'slate' |
| T-01-02: Anon key exposure | `.env.example` documents keys; no hardcoded values in source |
| T-01-SC: Package legitimacy | All packages verified in RESEARCH.md Package Legitimacy Audit |

## Self-Check: PASSED

- `src/styles/tokens.css` — exists, contains `--b-primary`, `@theme inline`, `@import "tailwindcss"`
- `src/lib/theme.ts` — exists, exports `applyTheme`, `loadTheme`, `saveTheme`
- `src/lib/queryClient.ts` — exists, exports `queryClient`
- `src/components/ui/index.ts` — exists, 9 exports
- `vitest.config.ts` — exists, jsdom environment
- All commits verified: `ff5b4dc` (RED), `29f54a6` (GREEN), `43082c6` (components)
- `npm run build` exits 0, `dist/` directory exists
