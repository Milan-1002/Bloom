# Coding Conventions

**Analysis Date:** 2026-05-18

> **Source:** Design prototype only (`bloom-app-design/project/`). No production app code exists yet.
> Sections are split into **Current (prototype)** — what the design files actually do — and
> **Production** — what to carry forward or change when building the real app.

---

## Naming Conventions

### Components

**Current (prototype):**
- Screen-level components: `PascalCase` suffixed with `Screen` — e.g., `HomeScreen`, `DiaryScreen`, `LoggingScreen`, `OnboardingScreen`
- Shared/bit components: short `PascalCase` nouns — `Card`, `Chip`, `Ring`, `AppBar`, `IconBtn`, `Btn`, `Avatar`, `Progress`, `Photo`, `SectionHeader`
- Sub-components scoped to a screen: `PascalCase` named for their role — `MealRow`, `MetricLine`, `SubMetric`, `AddMealCTA`, `Feeling`
- Icon map object: single uppercase `I` — `I.bell`, `I.back`, `I.plus`

**Production — carry forward:**
- Keep `PascalCase` for all React components.
- Keep the `Screen` suffix for top-level route components.
- Give sub-components descriptive names; avoid abbreviations beyond established ones (`Btn`, `IconBtn`).
- Replace the `I.*` global icon map with named exports from an `icons/` directory, one icon per file or a single typed barrel: `import { BellIcon } from '@/icons'`.

### Files

**Current (prototype):**
- Screen files: `PascalCase.jsx` matching the screen name — `Home.jsx`, `Logging.jsx`, `Onboarding.jsx`
- Component files: `PascalCase.jsx` — `Bits.jsx`, `Phone.jsx`
- Data files: `camelCase.js` — `foods.js`
- Style file: `kebab-case.css` — `tokens.css`

**Production:**
- One component per file. Split `Bits.jsx` into individual files: `Card.tsx`, `Chip.tsx`, `Avatar.tsx`, etc., under `src/components/ui/`.
- Screen files remain `PascalCase.tsx` under `src/screens/` or `src/pages/`.
- Data/utility files: `camelCase.ts` under `src/lib/` or `src/utils/`.
- Token file: keep as a single `tokens.css` (or convert to `tailwind.config.ts` theme extension).

### CSS Custom Properties

**Current (prototype) — defined in `bloom-app-design/project/tokens.css`:**

All tokens use the `--b-` prefix:

| Category | Pattern | Examples |
|----------|---------|---------|
| Surfaces | `--b-bg`, `--b-surface`, `--b-surface-2`, `--b-surface-sunken` | Background layers |
| Ink (text) | `--b-ink`, `--b-ink-2`, `--b-ink-3`, `--b-ink-4` | Hierarchy by number |
| Brand tones | `--b-primary`, `--b-accent`, `--b-mint`, `--b-coral`, `--b-berry`, `--b-amber` | Semantic colors |
| Soft variants | `--b-{tone}-soft` | e.g., `--b-mint-soft` |
| Ink on brand | `--b-primary-ink` | Text color on primary fill |
| Macros | `--b-protein`, `--b-carbs`, `--b-fat`, `--b-fiber` | Chart / chip colors |
| Radius | `--b-r-xs`, `--b-r-sm`, `--b-r-md`, `--b-r-lg`, `--b-r-xl`, `--b-r-pill` | `8 12 18 26 32 999px` |
| Shadows | `--b-shadow-card`, `--b-shadow-pop` | Two-level elevation |
| Fonts | `--b-font-body`, `--b-font-display`, `--b-font-mono` | Three font roles |
| Hairline | `--b-hairline` | Dividers and borders |

**Production — carry forward entirely.** The `--b-*` token system is well-structured and should
be preserved in production CSS. If adopting Tailwind, map these tokens into `tailwind.config.ts`
as CSS variable references so class names resolve to the same values.

### Data Attributes for Theming

**Current (prototype):**
- Palette variants: `data-palette="warm"` / `data-palette="sage"` (default is slate, no attribute needed)
- Dark mode: `data-dark="true"` on `<html>`
- Photo visibility: `data-bloom-photo` and `data-bloom-photo-bg` on image elements; toggled by `.b-hide-img` CSS class

**Production — carry forward.** Apply `data-palette` and `data-dark` at the document root via a
theme context. These attributes power the entire token cascade without JavaScript style injection.

---

## Inline Styles Pattern

### Current (prototype)

All styling in the prototype is done with JSX `style` objects — no CSS modules, no utility classes,
no styled-components:

```jsx
// From bloom-app-design/project/screens/Home.jsx
<div style={{
  fontSize: 22, fontWeight: 400, color: 'var(--b-ink)', lineHeight: 1.1,
  fontFamily: 'var(--b-font-display)',
}}>
  <span style={{ fontStyle: 'italic' }}>Good morning,</span> Maya
</div>
```

Style objects are written inline at every usage site. Values are a mix of:
- CSS variable references for colors and radii: `'var(--b-ink-3)'`, `'var(--b-r-md)'`
- Hardcoded pixel numbers for font sizes, gaps, padding: `fontSize: 13.5`, `gap: 14`
- Hardcoded pixel strings for dimensions: `width: 96`, `height: 52`

Color tokens are always consumed via CSS variables — no hex values appear inline in JSX.
Font sizes are in `px` (as numeric values in the style object), not `rem`.

### Why this must change for production

1. **No deduplication.** The same `{ fontSize: 12, fontWeight: 600, color: 'var(--b-ink-3)' }` block
   appears dozens of times across screens. Any global type scale change requires a mass find-replace.
2. **No IDE completion or type safety.** Typos in property names fail silently at runtime.
3. **Performance.** React creates a new style object on every render for every element.
4. **No theming hooks.** Dark mode / palette switching works via CSS variables, but logic that
   conditionally changes styles (e.g., hover, focus, active states) requires inline `onMouseEnter`
   hacks — not feasible at scale.

### Production recommendation

Use **CSS Modules** (`.module.css`) as the primary styling approach:
- Scoped class names solve deduplication.
- Works natively with Vite (zero config).
- Keeps the CSS variable token system intact.
- Familiar to any React developer.

Alternatively, use **Tailwind CSS** with the design tokens mapped to the theme config:
- Custom colors: `bg-b-surface`, `text-b-ink-3` etc. resolve to `var(--b-surface)`.
- Radius scale, shadow scale, and font families added as theme extensions.
- Faster to write than CSS modules for utility-heavy layouts.

Do **not** use styled-components or Emotion — adds runtime overhead and is unnecessary given the
existing CSS variable token system.

---

## Color and Token System Conventions

**Never hardcode colors in component code.** Always reference a `--b-*` token:

```jsx
// Correct
color: 'var(--b-ink)'
background: 'var(--b-mint-soft)'

// Wrong — breaks palette/dark mode switching
color: '#6B7E91'
background: '#DCE9E3'
```

**Use semantic tokens, not palette primitives.** Prefer `--b-ink-3` over a hex value that happens
to be the same color. Semantic tokens automatically adapt to palette and dark mode changes.

**Macro colors are semantic.** Use `--b-protein`, `--b-carbs`, `--b-fat`, `--b-fiber` for all
macro-related UI elements (chips, progress bars, chart lines). Do not substitute `--b-accent` or
other tones for macro display.

**Tone system for status / state:**
- `mint` — on-track, positive, success
- `coral` — off-target, warning, negative
- `amber` — caution, moderate
- `berry` — cycle / menstrual data
- `accent` — interactive, links, highlights
- `primary` — primary actions, hero fills
- `ghost` — de-emphasized, secondary

---

## Component Prop Patterns

### Current (prototype)

Props are destructured inline in the function signature:

```jsx
// From bloom-app-design/project/components/Bits.jsx
function Chip({ children, tone = 'neutral', size = 'md', icon, style }) { ... }
function Ring({ value = 0, max = 100, size = 64, stroke = 7, color = 'var(--b-primary)', ... }) { ... }
function Btn({ children, tone = 'primary', size = 'md', full, icon, style }) { ... }
```

Default values are declared in the destructuring. Boolean flags (`full`, `lowerBetter`, `static`) are
bare (falsy when absent). String enums (`tone`, `size`) use string literals, not TypeScript unions.

### Production

Add TypeScript interfaces for all component props:

```tsx
interface ChipProps {
  children: React.ReactNode;
  tone?: 'neutral' | 'primary' | 'accent' | 'mint' | 'coral' | 'berry' | 'amber' | 'ghost';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;  // replace open-ended `style` prop
}
```

- Replace the open `style` escape-hatch prop with `className` once CSS modules/Tailwind are in use.
- Keep default values in destructuring — that pattern transfers cleanly to TypeScript.
- Avoid prop names that clash with HTML attributes (`static` is a reserved word — rename to `isStatic`).

---

## Typography Conventions

**Three font roles** — defined as CSS variables and used consistently:

| Role | Variable | Family | Used For |
|------|----------|--------|----------|
| Body | `--b-font-body` | Manrope 400–800 | All body copy, labels, UI text |
| Display | `--b-font-display` | Instrument Serif (regular + italic) | Hero headings, greeting line, wordmark |
| Mono | `--b-font-mono` | JetBrains Mono | Numeric data if tabular alignment needed |

**Font size scale observed in prototype (px):**

| Usage | Size |
|-------|------|
| Micro label / badge | 9–10px |
| Caption / tag | 11–12px |
| Body small | 13–13.5px |
| Body default | 14px |
| Sub-heading | 16–17px |
| Screen title (AppBar) | 17px |
| Card heading | 22px |
| Hero display | 24–38px |

**Production:** Express sizes as a named scale in the Tailwind theme or as CSS custom properties
(`--b-text-xs: 11px` etc.) rather than hardcoded values per element. Use `px` values if matching
the prototype exactly, or convert to `rem` if following web accessibility best practices (allows
user browser font scaling). Pick one approach and apply it consistently.

**Letter spacing conventions:**
- Body: `-0.005em` (set globally on `.bloom`)
- Display headings: `-0.01em`
- Uppercase labels: `0.3–0.5px` positive tracking
- Numeric values: `font-variant-numeric: tabular-nums` via `.b-num` helper class

---

## Conventions to Carry Forward vs. Change

### Carry forward

| Convention | Rationale |
|------------|-----------|
| `--b-*` CSS variable token system | Fully covers palette × dark mode theming |
| `data-palette` / `data-dark` data attributes on `<html>` | Clean, CSS-native theme switching |
| PascalCase component names with `Screen` suffix | Clear, consistent |
| Semantic tone props (`tone="mint"`) on shared components | Self-documenting, avoids magic colors |
| Inline prop destructuring with defaults | Readable, transfers to TypeScript |
| Brief functional comments at top of each file | Good habit, keep it |

### Change for production

| Current Pattern | Production Pattern |
|----------------|-------------------|
| Inline `style` objects | CSS Modules or Tailwind classes |
| `window.ScreenName = ScreenName` global exports | ES module `export function ScreenName` |
| All components in `Bits.jsx` | One component per file in `src/components/ui/` |
| `foods.js` global constant | Typed data in `src/lib/foods.ts` or Supabase DB rows |
| No TypeScript | TypeScript throughout; prop interfaces for every component |
| `style` escape-hatch prop | `className` prop; or no escape hatch at all |
| Hardcoded `px` font sizes per element | Named type scale tokens |
| React + Babel via CDN | Vite build with local React |
| `static` as prop name | `isStatic` (avoids JS reserved word) |

---

## Import Organization

**Current (prototype):** No imports — everything is loaded via `<script>` tags in `index.html` and
exposed as globals via `window.X = X`. There is no module system.

**Production — use this order:**

```tsx
// 1. React and framework
import React, { useState, useEffect } from 'react';

// 2. Third-party libraries
import { useQuery } from '@tanstack/react-query';

// 3. Internal — absolute paths via alias
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';

// 4. Internal — relative paths (same feature/directory)
import { MacroRing } from './MacroRing';

// 5. Types
import type { FoodEntry } from '@/types';

// 6. Styles
import styles from './HomeScreen.module.css';
```

Use a `@/` path alias pointing to `src/` (configure in `tsconfig.json` and `vite.config.ts`).

---

## Module Design

**Current (prototype):** No modules. Single flat namespace via globals.

**Production:**
- Each UI component is a named export from its own file: `export function Card(...)`
- Barrel files (`index.ts`) per directory for clean import paths:
  `import { Card, Chip, Ring } from '@/components/ui'`
- No default exports for components — named exports are easier to refactor and grep.
- Default exports acceptable for page/screen components if required by the router.

---

*Convention analysis: 2026-05-18*
