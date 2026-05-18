# Stack Research: Bloom

**Project:** Bloom — PCOS-aware nutrition companion
**Researched:** 2026-05-18
**Confidence:** HIGH (versions npm-verified, patterns Context7-verified)

---

## Recommended Stack

| Layer | Choice | Version | Rationale | Confidence |
|-------|--------|---------|-----------|------------|
| Build tool | Vite | 8.0.13 | Fastest HMR, first-class PWA plugin support. v8 is current stable. | HIGH |
| UI framework | React | 19.2.6 | Already decided. React 19 concurrent features benefit heavy data UIs. | HIGH |
| Language | TypeScript | 6.0.3 | Already decided. Strict mode recommended for health data correctness. | HIGH |
| Routing | react-router-dom | 7.15.1 | Already decided. v7 is current stable (not v6). | HIGH |
| Backend / Auth / DB | Supabase JS | 2.105.4 | Already decided. Handles auth, RLS, realtime, storage. | HIGH |
| AI | Claude API (claude-sonnet-4-6) | — | Already decided. Used for macro target personalization, Insulin Balance score. | HIGH |
| Food data | USDA FoodData Central API | v1 | Free, no auth for basic search, covers 1M+ foods. | HIGH |
| Server state | TanStack Query | 5.100.10 | Gold standard for async server state. Works seamlessly with Supabase RPC/REST. | HIGH |
| Local/UI state | Zustand | 5.0.13 | Minimal boilerplate, persist middleware built-in, TypeScript-first. | HIGH |
| Forms | React Hook Form | 7.76.0 | Uncontrolled inputs = zero re-renders. Best for multi-step onboarding. | HIGH |
| Validation | Zod | 4.4.3 | TypeScript-first, `z.infer<>` gives free type derivation. Zod v4 is stable. | HIGH |
| RHF + Zod bridge | @hookform/resolvers | 5.2.2 | Official resolver package, `zodResolver()` adapter. | HIGH |
| Charts | Recharts | 3.8.1 | React-native SVG charts, RadialBarChart for macro rings, LineChart for weight trend. Smallest bundle of the three options. | HIGH |
| Barcode scanning | html5-qrcode | 2.3.8 | Most popular web barcode lib (2.3M+ weekly downloads), wraps ZXing-C++, no server needed. | MEDIUM |
| PWA | vite-plugin-pwa | 1.3.0 | Zero-config Workbox integration. Confirmed compatible with Vite 8 peer deps. | HIGH |
| CSS tokens | CSS custom properties (--b-*) | — | Design tokens already defined. No additional CSS framework needed. | HIGH |

---

## Key Library Decisions

### State Management

**Decision: Zustand (local/UI) + TanStack Query (server state). Do NOT use a single global store.**

These two libraries solve different problems and work together without conflict:

- **TanStack Query v5** owns all server state: food log entries, user profile, USDA lookups, Claude AI responses. It handles caching, background refetch, stale-while-revalidate, and optimistic updates out of the box.
- **Zustand v5** owns ephemeral UI/local state that does not need to be cached from a server: current food search query, active date selection, onboarding step, symptom draft in progress.

**Why not Jotai?** Jotai's atom-per-value model creates complexity when you need inter-dependent atoms (e.g., selected date affects multiple views). Zustand's single-store-per-domain pattern is easier to reason about in a health tracking context where many views depend on the same date/user context.

**Why not Redux / Zustand for everything?** TanStack Query's automatic background sync, retry logic, and cache invalidation would all need to be hand-rolled in Zustand. This is unnecessary work.

**Zustand store structure for Bloom:**
```typescript
// stores/uiStore.ts — ephemeral UI state only
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface UIState {
  activeDate: string          // ISO date string, persisted
  onboardingStep: number
  foodSearchQuery: string
  setActiveDate: (date: string) => void
  setOnboardingStep: (step: number) => void
  setFoodSearchQuery: (q: string) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      activeDate: new Date().toISOString().split('T')[0],
      onboardingStep: 0,
      foodSearchQuery: '',
      setActiveDate: (date) => set({ activeDate: date }),
      setOnboardingStep: (step) => set({ onboardingStep: step }),
      setFoodSearchQuery: (q) => set({ foodSearchQuery: q }),
    }),
    {
      name: 'bloom-ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ activeDate: state.activeDate }), // only persist date
    }
  )
)
```

**TanStack Query v5 with Supabase pattern:**
```typescript
// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 min — food logs don't change that often
      gcTime: 10 * 60 * 1000,     // keep in cache 10 min after unmount
      retry: 2,
      refetchOnWindowFocus: false, // health app users context-switch often; don't spam Supabase
    },
  },
})

// hooks/useFoodLog.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useFoodLog(date: string, userId: string) {
  return useQuery({
    queryKey: ['food-log', userId, date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('food_log_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('logged_date', date)
        .order('logged_at', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

export function useAddFoodEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (entry: NewFoodEntry) => {
      const { data, error } = await supabase
        .from('food_log_entries')
        .insert(entry)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      // Invalidate the date's food log to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['food-log', data.user_id, data.logged_date] })
    },
  })
}
```

---

### Forms

**Decision: React Hook Form v7 + Zod v4 + @hookform/resolvers v5**

React Hook Form uses uncontrolled inputs — no re-render on every keystroke. This matters for Bloom's multi-step onboarding (8+ fields across 3 steps) and food logging (quick-entry UX must feel instant).

**Zod v4 note:** v4 is now stable as of 2025. The import changed from `from 'zod'` (which still works via re-export) to `from 'zod/v4'` for direct v4 API access. The `zodResolver` in @hookform/resolvers 5.x works with both v3 and v4.

**Example — onboarding step schema:**
```typescript
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

const pcosProfileSchema = z.object({
  age: z.number({ invalid_type_error: 'Required' }).min(13).max(100),
  height_cm: z.number().min(100).max(250),
  weight_kg: z.number().min(30).max(300),
  activity_level: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  pcos_subtype: z.enum(['insulin_resistant', 'adrenal', 'post_pill', 'inflammatory', 'unknown']),
  goals: z.array(z.enum(['weight_loss', 'regulate_cycle', 'reduce_symptoms', 'energy'])).min(1),
})

type PCOSProfile = z.infer<typeof pcosProfileSchema>

function PCOSOnboardingForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PCOSProfile>({
    resolver: zodResolver(pcosProfileSchema),
    mode: 'onBlur',
  })
  // ...
}
```

---

### Charts

**Decision: Recharts v3**

Recharts is the right choice for Bloom because:
1. **Native SVG + React components** — tokens from `--b-*` CSS variables feed directly into `stroke` and `fill` props.
2. **RadialBarChart** is built-in and covers the macro progress rings (carbs/protein/fat vs targets).
3. **Donut chart (PieChart with innerRadius)** works for Insulin Balance score visualization.
4. **LineChart** with `dot={false}` creates clean weight trend sparklines.
5. **ResponsiveContainer** handles mobile-responsive sizing without extra configuration.
6. Bundle: ~100KB gzipped — smaller than Victory (~180KB) and Nivo (~230KB+ with tree-shaking required).

**Why not Victory?** Victory has excellent React Native support, but Bloom is web-only PWA. Its larger bundle is not justified.

**Why not Nivo?** Nivo's charts are beautiful but require D3 as a peer dependency and the bundle is significantly larger. Overkill for sparklines and progress rings.

**Recharts patterns for Bloom:**
```typescript
// Macro progress ring — RadialBarChart
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'

// Weight trend — minimal LineChart sparkline
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'

// Insulin Balance gauge — PieChart as donut
import { PieChart, Pie, Cell } from 'recharts'
```

---

### Barcode Scanning

**Decision: html5-qrcode v2.3.8**

**Context:** Barcode scanning in web is inherently limited — browsers access the camera via `getUserMedia`, decode frames via JavaScript. Performance varies by device.

**html5-qrcode** is the recommended choice because:
- It wraps ZXing-C++ compiled to WASM for fast decoding — handles EAN-13, UPC-A, QR codes (the formats on food packaging).
- 2.3M+ weekly downloads, actively maintained.
- Simple React integration via `Html5QrcodeScanner` or the lower-level `Html5Qrcode` class.
- Supported formats include `EAN_13`, `UPC_A`, `UPC_E` — the barcodes on food packaging.

**@zxing/browser** (`v0.2.0`) is the raw ZXing port. html5-qrcode wraps it with a better DX. Use @zxing/browser only if you need a headless decoder without any UI.

**@ericblade/quagga2** (`v1.12.1`) is CPU-based (no WASM), struggles more with poor lighting. Skip it.

**React integration pattern:**
```typescript
import { Html5Qrcode } from 'html5-qrcode'
import { useEffect, useRef, useState } from 'react'

export function BarcodeScanner({ onScan }: { onScan: (barcode: string) => void }) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const scanner = new Html5Qrcode('barcode-reader')
    scannerRef.current = scanner

    scanner.start(
      { facingMode: 'environment' }, // rear camera
      { fps: 10, qrbox: { width: 250, height: 150 } },
      (decodedText) => {
        onScan(decodedText)
        scanner.stop()
      },
      undefined
    ).catch((err) => setError('Camera access denied'))

    return () => { scanner.stop().catch(() => {}) }
  }, [onScan])

  return <div id="barcode-reader" />
}
```

**Then look up the UPC in USDA FoodData Central:**
```
GET https://api.nal.usda.gov/fdc/v1/foods/search?query={upc}&dataType=Branded&api_key={key}
```

**Confidence note:** html5-qrcode's WASM approach works well on modern mobile browsers. iOS Safari historically had camera API gaps — test on iPhone Safari explicitly. Confidence: MEDIUM (verified popular/maintained, but mobile camera behavior needs real-device testing).

---

### PWA

**Decision: vite-plugin-pwa v1.3.0 with generateSW strategy**

vite-plugin-pwa is the only mature, zero-config PWA solution for Vite. It wraps Workbox and is confirmed compatible with Vite 8 (peer dep: `^3.1.0 || ^4.0.0 || ^5.0.0 || ^6.0.0 || ^7.0.0 || ^8.0.0`).

**Strategy: `generateSW` (not `injectManifest`).** generateSW auto-generates the service worker from config — sufficient for Bloom. injectManifest is only needed when you need custom SW code (e.g., push notifications, background sync for offline food logging — consider in a later phase).

**Caching strategy for a health app:**

| Cache Target | Strategy | Rationale |
|---|---|---|
| App shell (JS/CSS/HTML) | CacheFirst (precache) | Core files are content-hashed by Vite, safe to cache permanently |
| USDA FoodData API responses | StaleWhileRevalidate | Food data rarely changes; show cached, update in background |
| Supabase REST API | NetworkFirst (10s timeout) | User data must be fresh; fall back to cache only if offline |
| Images (food photos) | CacheFirst, 7-day TTL | Heavy assets; worth aggressive caching |
| Claude API calls | NetworkOnly | AI responses are personalized & stateful; never cache |

**vite.config.ts example:**
```typescript
import { VitePWA } from 'vite-plugin-pwa'

VitePWA({
  registerType: 'prompt',  // show "update available" prompt, don't auto-update mid-session
  strategies: 'generateSW',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/api\.nal\.usda\.gov\/.*/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'usda-api-cache',
          expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 }, // 7 days
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'supabase-cache',
          networkTimeoutSeconds: 10,
          expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 }, // 1 hour fallback
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
  },
  manifest: {
    name: 'Bloom — PCOS Nutrition',
    short_name: 'Bloom',
    description: 'Your PCOS-aware nutrition companion',
    theme_color: '#E8A598',    // --b-bloom-blush from design tokens
    background_color: '#FAF7F5',
    display: 'standalone',
    orientation: 'portrait',
    icons: [
      { src: '/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
  },
})
```

**Update prompt:** Use `registerType: 'prompt'` — health app users need to opt into updates. Auto-updating mid-session would be disruptive (they could lose a food log in progress).

---

### USDA FoodData Central API

**Confidence: HIGH for endpoint structure, MEDIUM for exact rate limits (not in Context7, from training + npm package analysis)**

**Base URL:** `https://api.nal.usda.gov/fdc/v1/`

**Authentication:** Free API key from https://api.nal.usda.gov/ — no OAuth, just `?api_key=DEMO_KEY` or header.

**Rate limits:** DEMO_KEY is 30 requests/hour, 50 requests/day. Registered key is 1,000 requests/hour (confirm at signup). Cache aggressively — see PWA strategy above.

**Key endpoints:**

| Endpoint | Method | Use Case |
|---|---|---|
| `/foods/search` | GET | Text search for foods by name |
| `/food/{fdcId}` | GET | Full food detail by FDC ID |
| `/foods` | POST | Batch fetch multiple foods by ID |

**Barcode lookup:** FoodData Central does not have a dedicated UPC endpoint. Use `/foods/search?query={upc}&dataType=Branded` — branded foods include gtinUpc field. Filter results client-side to match exact UPC.

**Critical query parameters for `/foods/search`:**
```
query       — food name or UPC string
dataType    — "Branded" for packaged foods (has UPC), "SR Legacy" for raw ingredients
pageSize    — 10–25 (default 50)
pageNumber  — pagination
nutrients   — comma-separated nutrient IDs to include in response
```

**Fields to extract per food (for PCOS macro/GL tracking):**

| USDA Nutrient ID | Nutrient | Use in Bloom |
|---|---|---|
| 1003 | Protein (g) | Macro tracking |
| 1004 | Total Fat (g) | Macro tracking |
| 1005 | Carbohydrates (g) | Macro tracking + GL calc |
| 1008 | Energy (kcal) | Calorie tracking |
| 1079 | Fiber (g) | GL calculation: GL = (carbs - fiber) * GI / 100 |
| 1093 | Sodium (mg) | Anti-inflammatory tracking |
| 2000 | Total Sugars (g) | Insulin score input |

**Glycemic Load calculation note:** USDA does not provide GI/GL values. You must calculate GL client-side. Standard approximation used in nutrition apps: `GL = (net_carbs) * estimated_GI / 100` where `net_carbs = carbohydrates - fiber`. GI values must come from a separate GI database (e.g., University of Sydney GI database) or Claude API estimation. This is a known gap in the USDA data.

**Example search call:**
```typescript
const USDA_API_KEY = import.meta.env.VITE_USDA_API_KEY

async function searchFoods(query: string, dataType = 'Branded,SR Legacy') {
  const params = new URLSearchParams({
    query,
    dataType,
    pageSize: '20',
    api_key: USDA_API_KEY,
    nutrients: '1003,1004,1005,1008,1079,1093,2000',
  })

  const res = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?${params}`)
  if (!res.ok) throw new Error(`USDA API error: ${res.status}`)
  return res.json() as Promise<FDCSearchResponse>
}
```

---

### Vite + TypeScript Setup

**Vite 8 + React + TypeScript recommended config additions:**

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [react(), VitePWA({ /* ... */ })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**tsconfig.json key settings:**
```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "paths": {
      "@/*": ["./src/*"]
    },
    "noUncheckedIndexedAccess": true
  }
}
```

`noUncheckedIndexedAccess: true` is especially important for a health app — accessing `array[0]` without this check can silently return `undefined` on empty arrays, causing NaN to flow into macro calculations.

**ESLint 9 flat config (recommended for 2025 projects):**
```
@eslint/js, typescript-eslint, eslint-plugin-react-hooks, eslint-plugin-react-refresh
```

---

### CSS Design Tokens

**Decision: CSS custom properties only. No Tailwind, no CSS-in-JS.**

The design system already has `--b-*` tokens. Use them directly via:
1. `var(--b-token-name)` in CSS modules (`.module.css` per component)
2. Inline styles where dynamic values needed: `style={{ color: 'var(--b-bloom-rose)' }}`
3. Recharts `stroke`/`fill` props accept CSS variable strings in modern browsers

No additional CSS framework is needed. Tailwind would conflict with the existing design token system by introducing competing utility classes. CSS-in-JS (styled-components, Emotion) adds runtime overhead that hurts PWA performance metrics.

---

## What NOT to Use

| Library | Why |
|---------|-----|
| Redux Toolkit | Massive overkill. TanStack Query + Zustand covers everything without boilerplate. |
| Jotai | Atom model creates complex dependency chains for date-dependent multi-view state. |
| SWR | TanStack Query v5 is strictly superior: optimistic updates, infinite query, better devtools. |
| Formik | React Hook Form renders far fewer times. Formik re-renders on every keystroke by default. |
| Yup | Zod v4 is TypeScript-first and infers types directly. Yup requires separate type declarations. |
| Victory (charts) | Larger bundle, designed for React Native cross-platform. Web-only app doesn't benefit. |
| Nivo (charts) | Beautiful but requires D3 peer dep, huge bundle. Recharts is sufficient. |
| Tailwind CSS | Conflicts with existing --b-* design token system. No benefit for a custom design system. |
| styled-components | Runtime CSS-in-JS kills PWA performance scores (Lighthouse). |
| @ericblade/quagga2 | CPU-based barcode detection, poor low-light performance vs WASM alternatives. |
| React Native (Expo) | PWA was the confirmed platform decision. Adding RN scope-creeps the project. |
| Next.js | Vite is already decided and sufficient. Next.js adds SSR complexity with no benefit for a PWA. |
| Axios | Fetch API is sufficient. Supabase JS and USDA calls don't need Axios interceptors. |

---

## Versions (verified current as of 2026-05-18)

All versions verified from npm registry:

| Package | Version | Source |
|---------|---------|--------|
| react | 19.2.6 | npm |
| react-dom | 19.2.6 | npm |
| react-router-dom | 7.15.1 | npm |
| vite | 8.0.13 | npm |
| @vitejs/plugin-react | latest with vite 8 | npm |
| typescript | 6.0.3 | npm |
| @tanstack/react-query | 5.100.10 | npm |
| @tanstack/react-query-devtools | 5.x (match query) | npm |
| zustand | 5.0.13 | npm |
| react-hook-form | 7.76.0 | npm |
| zod | 4.4.3 | npm |
| @hookform/resolvers | 5.2.2 | npm |
| recharts | 3.8.1 | npm |
| html5-qrcode | 2.3.8 | npm |
| vite-plugin-pwa | 1.3.0 | npm |
| @supabase/supabase-js | 2.105.4 | npm |

**Note on react-router-dom v7:** This is a major version jump from the widely-documented v6. v7's API is largely compatible but introduces changes to loader/action patterns. The existing `react-router-dom` import still works — the package name did not change.

**Note on Zod v4:** Zod v4 (`zod@4.4.3`) is stable. `@hookform/resolvers@5.2.2` supports both Zod v3 and v4. Use `import { z } from 'zod'` — v4 is the default export.

---

## Installation

```bash
# Core (already decided)
npm install react react-dom react-router-dom
npm install @supabase/supabase-js

# Server state + local state
npm install @tanstack/react-query zustand

# Forms + validation
npm install react-hook-form zod @hookform/resolvers

# Charts
npm install recharts

# Barcode scanning
npm install html5-qrcode

# Dev dependencies
npm install -D vite @vitejs/plugin-react typescript
npm install -D vite-plugin-pwa
npm install -D @tanstack/react-query-devtools
npm install -D @types/react @types/react-dom
```

---

## Sources

- TanStack Query v5 docs: https://tanstack.com/query/v5 (Context7: /tanstack/query)
- Zustand persist docs: https://github.com/pmndrs/zustand (Context7: /pmndrs/zustand)
- React Hook Form docs: https://react-hook-form.com (Context7: /react-hook-form/react-hook-form)
- Zod v4 docs: https://zod.dev (Context7: /colinhacks/zod)
- Recharts docs: https://recharts.org (Context7: /recharts/recharts)
- vite-plugin-pwa docs: https://vite-pwa-org.netlify.app (Context7: /vite-pwa/vite-plugin-pwa)
- npm registry (all versions verified 2026-05-18): https://registry.npmjs.org
- USDA FoodData Central API: https://api.nal.usda.gov (training knowledge, MEDIUM confidence for rate limits)
- html5-qrcode: https://github.com/mebjas/html5-qrcode (training knowledge + npm verification)
