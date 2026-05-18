# Codebase Structure

**Analysis Date:** 2026-05-18

## Current Directory Layout

```
C:\Users\sunar\Desktop\Bloom_APP\app\
├── bloom-app-design/                   # Design handoff from Claude Design
│   ├── README.md                       # Handoff instructions for coding agents
│   ├── package-lock.json               # Lockfile (no package.json present — no npm deps)
│   └── project/                        # The actual prototype files
│       ├── index.html                  # Single entry point; loads all scripts via CDN + script tags
│       ├── app.jsx                     # Root component; mounts all 16 artboards
│       ├── design-canvas.jsx           # Infinite pan/zoom canvas infrastructure
│       ├── tweaks-panel.jsx            # Dev-only theme/settings tweaks panel
│       ├── tokens.css                  # Design tokens: 3 palettes, dark mode, typography
│       ├── components/
│       │   ├── Bits.jsx                # All shared UI primitives (icons, chips, rings, etc.)
│       │   └── Phone.jsx               # Phone frame, StatusBar, TabBar (390×844)
│       ├── screens/
│       │   ├── Onboarding.jsx          # welcome / profile-setup / coach-link (3 steps)
│       │   ├── Home.jsx                # Today dashboard (insulin score, meals, symptoms)
│       │   ├── Diary.jsx               # Food diary grouped by meal
│       │   ├── Symptoms.jsx            # Daily symptom check-in
│       │   ├── Logging.jsx             # Meal logging: search / barcode / food-detail
│       │   ├── Macros.jsx              # Macros progress + glycemic load chart
│       │   ├── Weight.jsx              # Weight trend sparkline
│       │   ├── Insights.jsx            # Weekly summary insights
│       │   ├── Coach.jsx               # Coach protocol: targets, templates, habits
│       │   ├── Recipes.jsx             # Recipe library with filter chips
│       │   └── Profile.jsx             # Profile & settings
│       ├── data/
│       │   └── foods.js                # 14 static mock food entries (FOODS object → window.FOODS)
│       └── uploads/
│           └── app desgin idea.png     # Reference image from user (design inspiration)
└── .planning/                          # GSD planning workspace
    └── codebase/
        ├── ARCHITECTURE.md             # This repo's architecture analysis
        └── STRUCTURE.md                # This file
```

## Directory Purposes

**`bloom-app-design/`:**
- Purpose: Complete design handoff bundle exported from Claude Design
- Contains: HTML prototype, JSX screens, design tokens CSS, mock data, reference image
- Status: Read-only reference — do not modify these files when building production app
- Key files: `project/index.html` (entry), `project/tokens.css` (copy verbatim to production)

**`bloom-app-design/project/components/`:**
- Purpose: Shared UI primitive components consumed by every screen
- Contains: `Phone.jsx` (mobile frame + navigation chrome), `Bits.jsx` (full icon + component library)
- Key exports (via window): `Phone`, `TabBar`, `StatusBar`, `PhoneWidth` (390), `PhoneHeight` (844), `Icon`, `I` (icon map), `Avatar`, `Chip`, `Progress`, `Ring`, `MultiRing`, `Card`, `Sparkline`, `AppBar`, `SectionHeader`, `IconBtn`, `Btn`

**`bloom-app-design/project/screens/`:**
- Purpose: One file per app screen; each exports a single top-level component to `window`
- Contains: 11 screen files covering all 6 app sections
- Pattern: Each screen wraps its content in `<Phone tab="...">`, uses Bits primitives, and references `FOODS` for mock data

**`bloom-app-design/project/data/`:**
- Purpose: Static mock data shared across screens
- Contains: `foods.js` — 14 food objects with full macro profiles and Unsplash photo URLs

**`bloom-app-design/project/uploads/`:**
- Purpose: User-supplied reference assets uploaded during the design session
- Contains: `app desgin idea.png` — original design inspiration image

**`.planning/codebase/`:**
- Purpose: GSD codebase map documents for planner/executor agents
- Generated: Yes (by `/gsd:map-codebase`)
- Committed: Yes

## Key File Locations

**Entry Point:**
- `bloom-app-design/project/index.html`: Opens in browser to view the full prototype. Defines script load order (the dependency graph).

**Design Tokens:**
- `bloom-app-design/project/tokens.css`: Copy this file verbatim as `src/styles/tokens.css` in production. All CSS custom properties are production-ready.

**Component Library Reference:**
- `bloom-app-design/project/components/Bits.jsx`: Reference implementation for all shared UI components. Rebuild each as a typed ES module in production.
- `bloom-app-design/project/components/Phone.jsx`: Reference for mobile chrome, tab bar structure, and dimensions.

**Screens Reference:**
- `bloom-app-design/project/screens/Home.jsx`: Most complex screen — Today dashboard with composite PCOS score, meal list, symptom chips.
- `bloom-app-design/project/screens/Logging.jsx`: Three-state screen pattern using a `state` prop switch — reference for multi-state page components.
- `bloom-app-design/project/screens/Onboarding.jsx`: Multi-step flow using a `step` prop switch — reference for wizard-style pages.

**Mock Data:**
- `bloom-app-design/project/data/foods.js`: Food data schema. Each entry has: `name`, `short`, `src` (Unsplash URL), `kcal`, `p`, `c`, `f`, `fiber`, `gl`, `sugar`, `tag`.

## What Does Not Exist Yet (Production)

The production Vite app does not exist. All of the following must be created:

```
app/
├── package.json              ← Vite + React + TypeScript + react-router-dom + @supabase/supabase-js
├── vite.config.ts
├── tsconfig.json
├── index.html                ← Vite entry (minimal, no CDN scripts)
└── src/
    ├── main.tsx              ← ReactDOM.createRoot
    ├── App.tsx               ← BrowserRouter + route definitions
    ├── styles/
    │   └── tokens.css        ← Copied verbatim from bloom-app-design/project/tokens.css
    ├── lib/
    │   └── supabase.ts       ← createClient(url, anonKey)
    ├── context/
    │   ├── AuthContext.tsx
    │   └── DiaryContext.tsx
    ├── components/           ← Rebuilt from Bits.jsx + Phone.jsx as typed modules
    │   ├── Phone/
    │   ├── TabBar/
    │   ├── Card/
    │   ├── Chip/
    │   ├── Ring/
    │   ├── MultiRing/
    │   ├── Progress/
    │   ├── Sparkline/
    │   ├── AppBar/
    │   ├── Avatar/
    │   ├── Btn/
    │   └── IconBtn/
    ├── pages/
    │   ├── onboarding/       ← welcome, profile-setup, coach-link
    │   ├── home/             ← today dashboard
    │   ├── diary/            ← food diary
    │   ├── symptoms/         ← symptom check-in
    │   ├── logging/          ← search + barcode + food-detail
    │   ├── macros/           ← macros & GL chart
    │   ├── weight/           ← weight trend
    │   ├── insights/         ← weekly insights
    │   ├── coach/            ← coach protocol
    │   ├── recipes/          ← recipe library
    │   └── profile/          ← profile & settings
    └── hooks/
        ├── useAuth.ts
        ├── useToday.ts       ← today's food log + PCOS score
        ├── useDiary.ts
        ├── useSymptoms.ts
        └── useWeight.ts
```

## Naming Conventions

**Files (prototype):**
- Screen files: PascalCase matching the exported component name (`Home.jsx` → `HomeScreen`)
- Component files: PascalCase (`Bits.jsx`, `Phone.jsx`)
- Data files: camelCase (`foods.js`)
- Config/infrastructure: kebab-case (`design-canvas.jsx`, `tweaks-panel.jsx`, `tokens.css`)

**Files (production — to follow):**
- Pages: kebab-case directories with `index.tsx` (e.g., `pages/home/index.tsx`)
- Components: PascalCase directories with `index.tsx` (e.g., `components/Card/index.tsx`)
- Hooks: camelCase with `use` prefix (`useToday.ts`)
- Lib utilities: camelCase (`supabase.ts`)

**CSS custom properties:**
- All prefixed `--b-` (Bloom namespace): e.g., `--b-primary`, `--b-ink-3`, `--b-r-md`

## Entry Points

**Prototype:**
- `bloom-app-design/project/index.html` — Open in a static file server; loads React from CDN, transpiles JSX in-browser, renders all artboards

**Production (to create):**
- `src/main.tsx` — Vite entry; mounts `<App />` into `#root`
- `src/App.tsx` — Defines all routes via react-router-dom

## Where to Add New Code

**New screen/page:**
- Page component: `src/pages/{screen-name}/index.tsx`
- Data hook: `src/hooks/use{ScreenName}.ts`
- Route: add to route list in `src/App.tsx`
- Reference: corresponding file in `bloom-app-design/project/screens/`

**New shared UI component:**
- Implementation: `src/components/{ComponentName}/index.tsx`
- Reference: `bloom-app-design/project/components/Bits.jsx` (find the matching function)
- Export barrel: add to `src/components/index.ts`

**New Supabase query:**
- Add typed query in the relevant hook under `src/hooks/`
- Use the client from `src/lib/supabase.ts`

**New design tokens:**
- Add CSS custom properties to `src/styles/tokens.css` following the `--b-` naming convention
- Add dark-mode overrides in the `[data-dark="true"]` block
- Add palette-specific overrides in `[data-palette="warm"]` and `[data-palette="sage"]` blocks

## Special Directories

**`bloom-app-design/project/uploads/`:**
- Purpose: Reference image uploaded during the design session (`app desgin idea.png`)
- Generated: No — uploaded by user
- Committed: Yes
- Usage: Visual reference only; not imported by any code

**`.planning/`:**
- Purpose: GSD workspace — plans, phase files, codebase maps
- Generated: Yes — by GSD commands
- Committed: Yes (documents state for future agent sessions)

---

*Structure analysis: 2026-05-18*
