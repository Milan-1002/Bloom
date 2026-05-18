<!-- refreshed: 2026-05-18 -->
# Architecture

**Analysis Date:** 2026-05-18

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────┐
│                         index.html (entry)                          │
│  CDN: React 18.3.1, ReactDOM 18.3.1, Babel Standalone 7.29.0       │
└──────────┬──────────────────────────────────────────────────────────┘
           │ script tags (load order matters — no module system)
           ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Layer 1 — Canvas infrastructure (globals)                           │
│  `design-canvas.jsx`  → window.{DesignCanvas, DCSection, DCArtboard} │
│  `tweaks-panel.jsx`   → window.{TweaksPanel, TweakSection, ...}      │
└──────────┬───────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Layer 2 — Shared primitives (globals)                               │
│  `data/foods.js`         → window.FOODS (plain object, no Babel)     │
│  `components/Phone.jsx`  → window.{Phone, TabBar, PhoneWidth, ...}   │
│  `components/Bits.jsx`   → window.{Icon, I, Avatar, Chip, Card, ...} │
└──────────┬───────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Layer 3 — Screen components (globals)                               │
│  screens/Onboarding.jsx  → window.OnboardingScreen                  │
│  screens/Home.jsx        → window.HomeScreen                        │
│  screens/Logging.jsx     → window.LoggingScreen                     │
│  screens/Diary.jsx       → window.DiaryScreen                       │
│  screens/Macros.jsx      → window.MacrosScreen                      │
│  screens/Weight.jsx      → window.WeightScreen                      │
│  screens/Symptoms.jsx    → window.SymptomsScreen                    │
│  screens/Coach.jsx       → window.CoachScreen                       │
│  screens/Insights.jsx    → window.InsightsScreen                    │
│  screens/Recipes.jsx     → window.RecipesScreen                     │
│  screens/Profile.jsx     → window.ProfileScreen                     │
└──────────┬───────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Layer 4 — App entry                                                 │
│  `app.jsx` — mounts all screens into DCArtboard grid, applies theme  │
│  ReactDOM.createRoot('#root').render(<App />)                        │
└──────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| `DesignCanvas` | Figma-style infinite pan/zoom canvas container | `bloom-app-design/project/design-canvas.jsx` |
| `DCSection` | Horizontal row of artboards with editable title | `bloom-app-design/project/design-canvas.jsx` |
| `DCArtboard` | Single artboard slot (marker component, renders as DCArtboardFrame) | `bloom-app-design/project/design-canvas.jsx` |
| `DCViewport` | Transform-based pan/zoom input handler | `bloom-app-design/project/design-canvas.jsx` |
| `DCFocusOverlay` | Fullscreen single-artboard focus mode with keyboard navigation | `bloom-app-design/project/design-canvas.jsx` |
| `TweaksPanel` | Dev-only floating panel: palette, dark mode, symptom toggles | `bloom-app-design/project/tweaks-panel.jsx` |
| `Phone` | 390×844 mobile frame with StatusBar + scrollable content + TabBar | `bloom-app-design/project/components/Phone.jsx` |
| `TabBar` | 5-item bottom nav: Today, Diary, Log (FAB), Insights, Me | `bloom-app-design/project/components/Phone.jsx` |
| `Bits` (module) | All shared UI primitives: icons, Avatar, Chip, Progress, Ring, MultiRing, Card, Sparkline, AppBar, SectionHeader, IconBtn, Btn | `bloom-app-design/project/components/Bits.jsx` |
| `OnboardingScreen` | 3-step first-run flow: welcome, profile-setup, coach-link | `bloom-app-design/project/screens/Onboarding.jsx` |
| `HomeScreen` | Today dashboard: insulin score, PCOS metrics, meal log, symptom chips | `bloom-app-design/project/screens/Home.jsx` |
| `DiaryScreen` | Full food diary grouped by meal | `bloom-app-design/project/screens/Diary.jsx` |
| `SymptomsScreen` | Daily symptom check-in (energy, mood, sleep, bloating, skin, cycle) | `bloom-app-design/project/screens/Symptoms.jsx` |
| `LoggingScreen` | 3-state meal logging: search, barcode scan, food detail | `bloom-app-design/project/screens/Logging.jsx` |
| `MacrosScreen` | Macros progress bars + glycemic load chart | `bloom-app-design/project/screens/Macros.jsx` |
| `WeightScreen` | Weight trend sparkline chart | `bloom-app-design/project/screens/Weight.jsx` |
| `InsightsScreen` | Weekly summary and pattern insights | `bloom-app-design/project/screens/Insights.jsx` |
| `CoachScreen` | Coach's protocol: targets, meal templates, habits | `bloom-app-design/project/screens/Coach.jsx` |
| `RecipesScreen` | PCOS-friendly recipe library with filter chips | `bloom-app-design/project/screens/Recipes.jsx` |
| `ProfileScreen` | Profile info, settings, integrations | `bloom-app-design/project/screens/Profile.jsx` |
| `FOODS` | Static mock food data (14 meals, macros, Unsplash photos) | `bloom-app-design/project/data/foods.js` |

## Pattern Overview

**Overall:** Static prototype with global-scope React components loaded via CDN script tags. No module system, no routing, no state management, no API calls. All screens are rendered simultaneously as artboards on a single infinite design canvas.

**Key Characteristics:**
- Every file assigns its exports to `window.*` (e.g., `Object.assign(window, { Phone, TabBar, PhoneWidth, PhoneHeight })`)
- Load order in `index.html` is the dependency graph — later scripts can reference globals set by earlier ones
- Babel Standalone transpiles JSX in the browser at runtime (no build step)
- All data is inline JavaScript constants — no fetch calls, no Supabase, no auth
- Theme is applied via `data-palette` and `data-dark` attributes on `<html>`, consumed by CSS variables in `tokens.css`

## Screen Inventory

**Section 1 — Get Started:**
- `welcome` — Full-bleed hero image with brand wordmark, sign-up CTA. No tab bar.
- `profile-setup` — Form: name, age, weight, PCOS diagnosis date, goals.
- `coach-link` — Coach invitation code entry screen.

**Section 2 — Daily Flow:**
- `home` — Today dashboard. Insulin balance score ring, PCOS macro metrics (protein, fiber, GL, P:C ratio), today's meal list with food photography, symptom quick-chips.
- `diary` — Full food diary grouped by Breakfast/Lunch/Snack/Dinner with per-meal macros.
- `symptoms` — Daily symptom check-in: rate energy, mood, sleep, bloating, skin, cycle day.

**Section 3 — Logging a Meal:**
- `search` — Food search with recent items and live results list.
- `barcode` — Camera viewfinder for barcode scanning.
- `detail` — Full food detail: macros breakdown, serving size stepper, GL impact, add-to-meal button.

**Section 4 — Insights & Trends:**
- `macros` — Macro progress bars with weekly averages, glycemic load chart.
- `weight` — Weight trend sparkline, 7-day history, BMI context.
- `weekly` — Weekly narrative summary of PCOS-relevant patterns.

**Section 5 — Plan & Library:**
- `coach` — Coach's nutrition protocol: daily targets, meal template suggestions, habit checklist.
- `recipes` — Recipe library with filter chips (High Protein, Low GL, etc.) and food photography cards.

**Section 6 — Account:**
- `profile` — User profile, app settings, integrations (wearable sync, coach connection).

## Layers

**Canvas Infrastructure:**
- Purpose: Figma-style design review tool; not part of the production app
- Location: `bloom-app-design/project/design-canvas.jsx`, `bloom-app-design/project/tweaks-panel.jsx`
- Contains: Pan/zoom viewport, artboard frames, drag-reorder, fullscreen focus, state persisted to `.design-canvas.state.json`, export PNG/HTML
- Depends on: React, ReactDOM (CDN globals)
- Used by: `app.jsx` only

**Shared Primitives:**
- Purpose: Design system components that every screen consumes
- Location: `bloom-app-design/project/components/Phone.jsx`, `bloom-app-design/project/components/Bits.jsx`
- Contains: Phone frame, tab bar, icon library (`I.*`), Avatar, Chip, Progress, Ring, MultiRing, Card, Sparkline, AppBar, SectionHeader, IconBtn, Btn
- Depends on: CSS custom properties from `tokens.css`
- Used by: All screen files

**Screen Components:**
- Purpose: Individual app screens, each a standalone React function component
- Location: `bloom-app-design/project/screens/`
- Contains: All UI for one screen, inline mock data, Unsplash image URLs
- Depends on: Phone, Bits primitives (via window globals), FOODS data
- Used by: `app.jsx` (mounted inside DCArtboard slots)

**Data:**
- Purpose: Shared mock food data referenced across screens
- Location: `bloom-app-design/project/data/foods.js`
- Contains: 14 food objects with name, macros (kcal, p, c, f, fiber, gl, sugar), Unsplash photo URL
- Loaded as plain `<script>` (no Babel), assigns `window.FOODS`

## Design Token System

**File:** `bloom-app-design/project/tokens.css`

**Three palettes** applied via `data-palette` attribute on `<html>`:
- `slate` (default) — cool blue-gray; `--b-primary: #1F3A4D`, `--b-accent: #4E84A4`
- `warm` — peach/terracotta; `--b-primary: #C16D4A`, `--b-accent: #D88A6B`
- `sage` — earthy green; `--b-primary: #4D6A47`, `--b-accent: #7B9B66`

**Dark mode** applied via `data-dark="true"` on `<html>`, overrides surface and ink tokens across all palettes.

**Token categories:**
- Surfaces: `--b-bg`, `--b-surface`, `--b-surface-2`, `--b-surface-sunken`
- Text: `--b-ink` (primary), `--b-ink-2` (secondary), `--b-ink-3` (tertiary), `--b-ink-4` (faint)
- Brand: `--b-primary`, `--b-primary-ink`, `--b-primary-soft`, `--b-accent`, `--b-accent-soft`
- Semantic: `--b-mint` (success), `--b-coral` (warning), `--b-berry` (cycle), `--b-amber` (caution)
- Macros: `--b-protein`, `--b-carbs`, `--b-fat`, `--b-fiber` (per-palette color-coded)
- Shape: `--b-r-xs` (8px) through `--b-r-xl` (32px), `--b-r-pill` (999px)
- Shadow: `--b-shadow-card`, `--b-shadow-pop`
- Typography: `--b-font-body` (Manrope), `--b-font-display` (Instrument Serif), `--b-font-mono` (JetBrains Mono)

**CSS helper classes:** `.bloom` (base reset), `.b-display` (serif font switch), `.b-num` (tabular nums), `.b-hide-img` (toggle food photography via `data-bloom-photo` / `data-bloom-photo-bg` attributes)

## Component Hierarchy (per artboard)

```text
DCArtboard
└── Phone (390×844, bloom class applied)
    ├── StatusBar (44px, fixed header simulation)
    ├── [screen content — flex:1, overflow:auto]
    │   ├── AppBar (or custom header)
    │   ├── [body cards, lists, charts]
    │   │   ├── Card → children
    │   │   ├── Ring / MultiRing
    │   │   ├── Progress
    │   │   ├── Sparkline
    │   │   ├── Chip
    │   │   ├── Avatar
    │   │   ├── Btn / IconBtn
    │   │   └── SectionHeader
    │   └── [inline mock data, Unsplash images]
    ├── TabBar (5 tabs, center FAB)
    └── HomeIndicator (24px bottom bar)
```

## Data Flow

### Current (Prototype)

1. `index.html` loads CDN React + Babel, then script tags in order
2. Each script assigns globals to `window`
3. `app.jsx` reads globals, renders all 16 artboards simultaneously
4. Theme state lives in `useTweaks()` hook in `App`, applied to `document.documentElement` via `useEffect`
5. No user input is persisted — all data is inline constants

### Planned Production Flow

1. User opens Vite SPA → `src/main.tsx` mounts React app
2. `react-router-dom` reads URL → renders matching page component
3. Page components call Supabase client for real data (auth, meals, symptoms, weight)
4. Shared state (auth session, today's log) lives in React Context or Zustand
5. Tokens from `tokens.css` imported into the Vite build; theme applied the same way (`data-palette` / `data-dark` on `<html>`)

## Gap: Prototype → Production

| Area | Prototype | Production target |
|------|-----------|-------------------|
| Build | None — Babel in browser | Vite + TypeScript |
| Routing | None — all screens rendered as artboards | `react-router-dom` v6 with typed routes |
| Auth | None | Supabase Auth (email + magic link) |
| Data | Inline JS constants (`FOODS`, hardcoded totals) | Supabase Postgres + Supabase client |
| State | No shared state; props drilling within each screen | React Context or Zustand for session/daily log |
| Components | Global window exports | ES module named exports from `src/components/` |
| Styling | `tokens.css` + inline styles | Same `tokens.css` imported in Vite; CSS Modules or Tailwind per team preference |
| Canvas | `DesignCanvas` / `TweaksPanel` infrastructure | Deleted — dev tooling only |
| Data (food) | 14 Unsplash mock entries in `foods.js` | Supabase `foods` table + USDA/Open Food Facts API |
| Images | Unsplash CDN URLs in JS constants | Production food photo CDN or Supabase Storage |
| Barcode | Static mock state | `quagga2` or native camera API |
| Charting | Custom SVG `Sparkline` component | Same SVG approach or `recharts` / `victory` |

## Planned Production Architecture

```text
src/
├── main.tsx                  ← ReactDOM.createRoot, router
├── router.tsx                ← react-router-dom BrowserRouter + routes
├── lib/
│   └── supabase.ts           ← Supabase client (createClient)
├── context/
│   ├── AuthContext.tsx        ← session + user object
│   └── DiaryContext.tsx       ← today's food log state
├── components/               ← rebuilt Bits + Phone as ES modules
│   ├── Phone.tsx
│   ├── TabBar.tsx
│   ├── Card.tsx
│   ├── Chip.tsx
│   ├── Ring.tsx
│   ├── Progress.tsx
│   ├── Sparkline.tsx
│   └── ...
├── pages/                    ← one file per screen
│   ├── onboarding/
│   ├── home/
│   ├── diary/
│   ├── logging/
│   ├── macros/
│   ├── weight/
│   ├── insights/
│   ├── coach/
│   ├── recipes/
│   └── profile/
└── styles/
    └── tokens.css            ← copied from design handoff verbatim
```

## Architectural Constraints

- **Threading:** Single-threaded browser event loop; camera/barcode work will need a web worker or native bridge in a future React Native port
- **Global state:** Prototype has none intentionally; production needs auth session globally available before any data fetch
- **Circular imports:** None possible in prototype (no module system); production must avoid circular context dependencies
- **Phone dimensions:** All artboards are fixed at 390×844px (`PhoneWidth` / `PhoneHeight` in `Phone.jsx`). Production should use CSS viewport units instead
- **No routing:** The prototype renders all screens at once; there is no URL-based navigation to reference for route design — route structure must be designed from scratch

## Anti-Patterns

### Global window exports

**What happens:** Every prototype file assigns components to `window` (e.g., `Object.assign(window, { Phone, TabBar })`).
**Why it's wrong:** Globals cannot be tree-shaken, have no type safety, and cause name collisions in a Vite build.
**Do this instead:** Use named ES module exports from `src/components/` and import them explicitly.

### Inline mock data in screen files

**What happens:** Each screen file hardcodes its own data (e.g., `const meals = [{ ...FOODS.yogurt, time: '8:12 am' }]` in `screens/Home.jsx`).
**Why it's wrong:** Production screens must fetch real data asynchronously; mixing fetch logic with render logic creates untestable components.
**Do this instead:** Separate data fetching into custom hooks (`useToday()`, `useDiary()`) and pass data as props to presentational components.

---

*Architecture analysis: 2026-05-18*
