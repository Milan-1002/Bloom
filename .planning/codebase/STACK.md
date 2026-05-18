# Technology Stack

**Analysis Date:** 2026-05-18

## Current State: Design Prototype Only

No production app exists. The repository contains a single design handoff bundle at
`bloom-app-design/project/` — a browser-rendered prototype with no build pipeline,
no TypeScript, and no backend. All sections below distinguish **prototype (current)**
from **production (planned)**.

---

## Languages

**Primary:**
- JavaScript (ES2020+) — all prototype code; no TypeScript anywhere

**Markup / Styling:**
- HTML5 — single entry file: `bloom-app-design/project/index.html`
- CSS custom properties — design tokens: `bloom-app-design/project/tokens.css`

**No TypeScript.** The planned production app should introduce it; nothing is configured yet.

---

## Runtime (Prototype)

**Environment:**
- Browser only — no Node.js runtime, no server process

**Package Manager:**
- npm — `bloom-app-design/package-lock.json` is present but contains no app dependencies
  (the lockfile is a stub from the design tool export; no `package.json` in project root)

**Lockfile:** `bloom-app-design/package-lock.json` — present but minimal

---

## Frameworks

**Core (prototype):**
- React 18.3.1 — loaded via unpkg CDN in `bloom-app-design/project/index.html` line 24–25
- ReactDOM 18.3.1 — same CDN bundle

**JSX Transform (prototype):**
- `@babel/standalone` 7.29.0 — in-browser Babel transform, loaded via unpkg line 26
  All `.jsx` files are tagged `type="text/babel"` and compiled at runtime in the browser.
  This is a dev-only approach; it is not suitable for production.

**Testing:**
- None — no test framework, no test files, no test runner

**Build/Dev:**
- None — no Vite, no webpack, no bundler of any kind
  The prototype is opened directly as a local HTML file or served with a static file server.

---

## Planned Production Stack

Based on project memory (no code exists yet):

| Layer | Technology |
|-------|-----------|
| Bundler | Vite |
| UI framework | React (version TBD, target 18+) |
| Routing | react-router-dom |
| Backend-as-a-service | Supabase |
| Supabase client | @supabase/supabase-js |
| Language | TypeScript (planned — not yet adopted) |

---

## Design System

**Token file:** `bloom-app-design/project/tokens.css`

**Palettes (3, switchable via `data-palette` attribute on `<html>`):**

| Palette | Key background | Key primary | Vibe |
|---------|----------------|-------------|------|
| `slate` (default) | `#EEF2F5` | `#1F3A4D` | Clinical-but-friendly |
| `warm` | `#FBF3EE` | `#C16D4A` | Peach / terracotta |
| `sage` | `#EEF1EA` | `#4D6A47` | Earthy wellness |

**Dark mode:** `data-dark="true"` on `<html>` — overrides all surface/ink tokens; works
with any palette. Dark bg: `#0E1620`, dark surface: `#18222D`.

**Semantic color roles (all palettes define these):**
- `--b-mint` — success / on-track
- `--b-coral` — warning / off-target
- `--b-berry` — cycle / period
- `--b-amber` — caution
- `--b-protein`, `--b-carbs`, `--b-fat`, `--b-fiber` — macro chip colors

**Typography:**
- Body: `Manrope` (weights 400–800) — Google Fonts, loaded in `index.html`
- Display: `Instrument Serif` (regular + italic) — Google Fonts, loaded in `index.html`
- Mono: `JetBrains Mono` — referenced in tokens but not loaded in index.html (unused in prototype)
- CSS vars: `--b-font-body`, `--b-font-display`, `--b-font-mono`

**Border radius scale:**
`--b-r-xs: 8px` → `--b-r-sm: 12px` → `--b-r-md: 18px` → `--b-r-lg: 26px` → `--b-r-xl: 32px` → `--b-r-pill: 999px`

**Shadow scale:**
- `--b-shadow-card` — subtle lift
- `--b-shadow-pop` — elevated modals/sheets

---

## Key Prototype Files

| File | Role |
|------|------|
| `bloom-app-design/project/index.html` | Entry point; loads all CDN scripts and jsx files via `<script type="text/babel">` |
| `bloom-app-design/project/app.jsx` | Root `App` component; wires `DesignCanvas` + `TweaksPanel` |
| `bloom-app-design/project/tokens.css` | All CSS custom properties (colors, radii, shadows, fonts) |
| `bloom-app-design/project/components/Bits.jsx` | Shared UI primitives: `Avatar`, `Chip`, `Card`, `Progress`, `Ring`, `Btn`, `AppBar`, inline SVG icon set (`I.*`) |
| `bloom-app-design/project/components/Phone.jsx` | Phone frame wrapper used by every screen artboard |
| `bloom-app-design/project/design-canvas.jsx` | `DesignCanvas`, `DCSection`, `DCArtboard` layout for design review |
| `bloom-app-design/project/tweaks-panel.jsx` | Dev-only panel: palette switcher, dark mode toggle, symptom toggles |
| `bloom-app-design/project/data/foods.js` | Static mock food data (global `FOODS` object, ~20 entries with macros + Unsplash URLs) |
| `bloom-app-design/project/screens/*.jsx` | 11 screen files (see Screens section) |

**Screens (11 total):**
- `Onboarding.jsx` — welcome, profile setup, coach link
- `Home.jsx` — today dashboard
- `Diary.jsx` — food diary
- `Logging.jsx` — food search, barcode scan, food detail
- `Macros.jsx` — macro & glycemic load tracking
- `Weight.jsx` — weight trend
- `Symptoms.jsx` — symptom check-in
- `Insights.jsx` — weekly insights
- `Coach.jsx` — coach protocol
- `Recipes.jsx` — recipe library
- `Profile.jsx` — account, settings, integrations

---

## Configuration

**Environment:**
- No environment variables — prototype has no secrets or backend config
- Production will require Supabase project URL and anon key at minimum

**Build:**
- No build config files (`vite.config.*`, `tsconfig.json`, `.eslintrc*`, `.prettierrc`, etc.)
  None exist anywhere in the repository.

---

## Platform Requirements

**Development (prototype):**
- Any static file server or direct browser open of `index.html`
- Internet connection required (CDN dependencies: React, Babel, Google Fonts, Unsplash images)

**Production (planned):**
- Vite dev server for local development
- Supabase project (hosted or local via Supabase CLI)
- Node.js for build tooling

---

## Gap Summary

Everything required for a production app needs to be created from scratch:

- [ ] `package.json` with Vite + React + react-router-dom + @supabase/supabase-js
- [ ] TypeScript configuration (`tsconfig.json`)
- [ ] Vite config (`vite.config.ts`)
- [ ] ESLint + Prettier config
- [ ] Environment variable setup (`.env.local` with Supabase keys)
- [ ] Supabase project + schema migrations
- [ ] React app scaffold (`src/main.tsx`, `src/App.tsx`)
- [ ] Convert prototype JSX screens to proper React components
- [ ] Extract design tokens from `tokens.css` into production CSS (or Tailwind config)
- [ ] Auth flows (Supabase Auth)
- [ ] Testing framework

---

*Stack analysis: 2026-05-18*
