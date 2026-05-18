# Testing Patterns

**Analysis Date:** 2026-05-18

> **Source:** Design prototype only (`bloom-app-design/project/`). No tests exist anywhere in the
> current codebase. All sections below describe the target testing approach for the production app.

---

## Current State

Zero tests. The prototype is a design mockup — a static HTML page loading React via CDN with
Babel transpilation in the browser. There is:

- No test framework
- No test files (no `*.test.*`, `*.spec.*` files anywhere)
- No CI/CD pipeline
- No test runner configuration
- No coverage tooling

This is expected and acceptable for a design prototype. Tests are a production concern.

---

## Recommended Testing Stack

| Layer | Tool | Version target |
|-------|------|----------------|
| Test runner | Vitest | `^2.x` |
| DOM environment | jsdom (via Vitest) | bundled |
| Component testing | React Testing Library | `^16.x` |
| User events | `@testing-library/user-event` | `^14.x` |
| E2E / critical paths | Playwright | `^1.x` |
| Coverage | V8 (built into Vitest) | bundled |

**Why Vitest over Jest:**
- Native Vite integration — same config, same transform pipeline, no separate Babel setup.
- ES module support without extra configuration.
- Compatible with Jest's API (`describe`, `it`, `expect`) — zero learning curve.

**Run Commands:**
```bash
npx vitest                 # Run all unit/component tests in watch mode
npx vitest run             # Single pass (for CI)
npx vitest run --coverage  # Generate coverage report
npx playwright test        # Run all E2E tests
npx playwright test --ui   # Playwright interactive UI
```

---

## Test File Organization

**Location:** Co-located with source files for unit/component tests; separate `e2e/` directory
for Playwright tests.

```
src/
  components/
    ui/
      Chip.tsx
      Chip.test.tsx          # co-located
      Card.tsx
      Card.test.tsx
  screens/
    HomeScreen.tsx
    HomeScreen.test.tsx
  lib/
    macros.ts
    macros.test.ts
    glycemicLoad.ts
    glycemicLoad.test.ts
e2e/
  logMeal.spec.ts
  onboarding.spec.ts
  dashboard.spec.ts
```

**Naming:**
- Unit / component tests: `{FileName}.test.tsx` or `{FileName}.test.ts`
- E2E tests: `{feature}.spec.ts`
- Test helpers / fixtures: `src/test/` directory

---

## Vitest Configuration

Place in `vitest.config.ts` (or extend `vite.config.ts`):

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'e2e/', 'src/test/'],
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

```ts
// src/test/setup.ts
import '@testing-library/jest-dom';
```

---

## Test Types and Scope

### 1. Unit Tests — Utility Functions

These are the highest-priority tests. The app's correctness depends on nutrition calculations.
Pure functions with no UI dependency — easiest to test and most valuable to cover at 100%.

**Target files (to be created):**

`src/lib/macros.ts` — macro aggregation helpers
```ts
// calculateDailyTotals(entries: FoodEntry[]): MacroTotals
// calculateMacroPercent(value: number, target: number): number
// formatMacro(grams: number, unit: 'g' | 'kcal'): string
```

`src/lib/glycemicLoad.ts` — GL calculation
```ts
// calculateGL(glycemicIndex: number, carbsG: number): number
// classifyGL(gl: number): 'low' | 'medium' | 'high'
// calculateDailyGL(entries: FoodEntry[]): number
```

`src/lib/proteinRatio.ts` — P:C ratio
```ts
// calculateProteinCarbRatio(proteinG: number, carbsG: number): number
// classifyRatio(ratio: number, target: number): 'on-track' | 'low' | 'high'
```

**Test structure pattern:**
```ts
// src/lib/glycemicLoad.test.ts
import { describe, it, expect } from 'vitest';
import { calculateGL, classifyGL } from './glycemicLoad';

describe('calculateGL', () => {
  it('returns 0 for 0 carbs', () => {
    expect(calculateGL(55, 0)).toBe(0);
  });

  it('calculates GL correctly: GI=55, carbs=20g → GL=11', () => {
    expect(calculateGL(55, 20)).toBe(11);
  });

  it('rounds to nearest integer', () => {
    expect(calculateGL(72, 10)).toBe(7);
  });
});

describe('classifyGL', () => {
  it('classifies GL ≤10 as low', () => {
    expect(classifyGL(8)).toBe('low');
  });
  it('classifies GL 11–19 as medium', () => {
    expect(classifyGL(15)).toBe('medium');
  });
  it('classifies GL ≥20 as high', () => {
    expect(classifyGL(22)).toBe('high');
  });
});
```

---

### 2. Component Tests — UI Components

Test the shared components from `src/components/ui/` (the production version of `Bits.jsx`).
Focus on behavior and accessibility, not visual layout.

**Priority components to test:**

| Component | What to test |
|-----------|-------------|
| `Chip` | Renders children; applies correct tone class/style; renders icon when provided |
| `Progress` | Clamps value between 0–100; correct `width` style applied |
| `Ring` | Renders SVG; correct `strokeDashoffset` computed from value/max |
| `Btn` | Renders children; fires `onClick`; disabled state |
| `Avatar` | Shows initials when no `src`; shows image when `src` provided |
| `MacroRow` | Displays protein/fiber/GL values correctly |

**Test structure pattern:**
```tsx
// src/components/ui/Chip.test.tsx
import { render, screen } from '@testing-library/react';
import { Chip } from './Chip';

describe('Chip', () => {
  it('renders children', () => {
    render(<Chip>On track</Chip>);
    expect(screen.getByText('On track')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    const icon = <span data-testid="icon" />;
    render(<Chip icon={icon}>Label</Chip>);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('applies ghost border when tone is ghost', () => {
    const { container } = render(<Chip tone="ghost">Ghost</Chip>);
    const el = container.firstChild as HTMLElement;
    expect(el.style.border).toContain('var(--b-hairline)');
  });
});
```

---

### 3. Screen Component Tests — Key UI Screens

Test the screens that contain conditional logic or computed display values.

**Priority screens:**

`HomeScreen` — most complex screen; displays computed macro progress:
- Renders protein/fiber/GL rings from calculated percentages
- Conditionally shows symptom widgets based on `dashboardSymptoms` prop
- Renders correct meal count from meals array

`LoggingScreen` — state-driven rendering:
- Renders `SearchFoods` when `state="search"`
- Renders `BarcodeScan` when `state="barcode"`
- Renders `FoodDetail` when `state="detail"`

`OnboardingScreen` — step-driven rendering:
- Renders `Welcome` when `step="welcome"`
- Renders `ProfileSetup` when `step="profile"`
- Renders `CoachLink` when `step="coach"`

**Pattern:**
```tsx
// src/screens/HomeScreen.test.tsx
import { render, screen } from '@testing-library/react';
import { HomeScreen } from './HomeScreen';

describe('HomeScreen', () => {
  it('renders all four default symptom widgets', () => {
    render(<HomeScreen tweaks={{ dashboardSymptoms: ['energy', 'mood', 'cycle', 'sleep'] }} />);
    expect(screen.getByText('Energy')).toBeInTheDocument();
    expect(screen.getByText('Mood')).toBeInTheDocument();
    expect(screen.getByText('Cycle')).toBeInTheDocument();
    expect(screen.getByText('Sleep')).toBeInTheDocument();
  });

  it('hides symptom widgets not in dashboardSymptoms', () => {
    render(<HomeScreen tweaks={{ dashboardSymptoms: ['energy'] }} />);
    expect(screen.queryByText('Mood')).not.toBeInTheDocument();
  });
});
```

---

### 4. Integration Tests — Auth Flows

These tests cover multi-step user flows that involve Supabase auth. Use mocking to isolate
from the real Supabase instance.

**Mock Supabase client:**
```ts
// src/test/mocks/supabase.ts
import { vi } from 'vitest';

export const mockSupabase = {
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
  },
};

vi.mock('@/lib/supabase', () => ({ supabase: mockSupabase }));
```

**Target flows:**

`onboarding.test.tsx` — welcome → profile setup → coach link:
- User fills name/email → clicks continue → profile form appears
- User submits profile → Supabase `signUp` called with correct payload
- Error state renders when sign-up fails

`login.test.tsx` — sign in:
- User enters credentials → `signInWithPassword` called
- Successful login redirects to home
- Invalid credentials shows error message

---

### 5. E2E Tests — Critical User Paths (Playwright)

E2E tests run against the real built app (or a staging environment with seeded test data).
Cover only the paths that would cause the most user pain if broken.

**Config:** `playwright.config.ts` at repo root.

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'Mobile Chrome', use: { ...devices['Pixel 7'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 14'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Critical paths to cover:**

`e2e/logMeal.spec.ts` — Log a meal (core loop):
1. User opens app, navigates to food diary
2. Taps "Add food" / "Log" CTA
3. Searches for "chicken"
4. Selects a result
5. Confirms portion and taps "Add"
6. Returns to diary — new entry visible with correct macros

`e2e/dashboard.spec.ts` — Home dashboard displays today's data:
1. User with existing log entries opens app
2. Macro rings show non-zero progress
3. Today's meals list shows logged items
4. PCOS balance score is visible

`e2e/onboarding.spec.ts` — First-time user flow:
1. Fresh install state — welcome screen shows
2. User taps "Start my journey"
3. Profile form appears — user fills required fields
4. Proceeds to coach link step
5. Completes onboarding — redirected to home

**E2E test pattern:**
```ts
// e2e/logMeal.spec.ts
import { test, expect } from '@playwright/test';

test('user can log a meal and see it in the diary', async ({ page }) => {
  await page.goto('/');
  // Log in with test credentials
  await page.getByLabel('Email').fill('test@bloom.app');
  await page.getByLabel('Password').fill('testpassword123');
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Navigate to diary and add food
  await page.getByRole('tab', { name: 'Diary' }).click();
  await page.getByRole('button', { name: 'Log lunch' }).click();
  await page.getByPlaceholder('Search foods').fill('chicken');
  await page.getByText('Grilled chicken salad').click();
  await page.getByRole('button', { name: 'Add to diary' }).click();

  // Verify entry appears
  await expect(page.getByText('Grilled chicken salad')).toBeVisible();
  await expect(page.getByText('460 kcal')).toBeVisible();
});
```

---

## Mocking Strategy

**What to mock:**
- Supabase client in unit and component tests — use `vi.mock('@/lib/supabase', ...)`
- External API calls (food database, AI coach) — mock fetch or the SDK client
- `Date.now()` / `new Date()` when testing date-dependent UI (cycle day, weekly summaries) — use `vi.setSystemTime()`

**What NOT to mock:**
- Pure calculation functions (`calculateGL`, `calculateMacroPercent`, etc.) — test with real inputs
- React component rendering — always use real React DOM via jsdom
- Token CSS variables — jsdom does not process CSS; test behavior/structure, not computed styles

**Supabase in E2E:**
- Use a dedicated test Supabase project (separate from production).
- Seed test users and food entries before E2E runs via a `global-setup.ts` script.
- Never run E2E against the production database.

---

## Coverage

**Requirements:** None enforced at prototype stage. Production targets:

| Area | Target |
|------|--------|
| Utility functions (`src/lib/`) | 100% |
| UI components (`src/components/ui/`) | 80% |
| Screen components (`src/screens/`) | 60% |
| Overall | 70% |

**View Coverage:**
```bash
npx vitest run --coverage
# Report at: coverage/index.html
```

---

## Test Data / Fixtures

Reuse the food data structure from `bloom-app-design/project/data/foods.js` as typed fixtures:

```ts
// src/test/fixtures/foods.ts
import type { FoodEntry } from '@/types';

export const mockFoods = {
  yogurt: {
    id: 'yogurt-1',
    name: 'Greek yogurt parfait',
    kcal: 280, protein: 22, carbs: 28, fat: 9, fiber: 7, gl: 8,
    tag: 'Breakfast',
  } satisfies FoodEntry,
  salmonBowl: {
    id: 'salmon-1',
    name: 'Salmon quinoa bowl',
    kcal: 540, protein: 38, carbs: 42, fat: 18, fiber: 9, gl: 13,
    tag: 'Lunch',
  } satisfies FoodEntry,
};
```

---

## Test Gaps to Address First

When the production app is built, prioritize tests in this order:

1. **Macro calculation utilities** — bugs here silently give users wrong nutritional data.
2. **GL calculation utility** — central to the PCOS value proposition; must be correct.
3. **Auth flow integration tests** — login and onboarding are entry barriers; breakage blocks all users.
4. **HomeScreen component** — the most complex screen; most likely to regress.
5. **LoggingScreen state machine** — three distinct UI states; easy to introduce rendering regressions.
6. **E2E: log a meal** — the single most critical user action in the app.

---

*Testing analysis: 2026-05-18*
