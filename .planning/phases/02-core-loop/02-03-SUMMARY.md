---
phase: "02"
plan: "03"
subsystem: "core-loop"
tags: ["barcode", "html5-qrcode", "camera", "usda-cache", "tdd", "fallback"]
dependency_graph:
  requires:
    - "02-01 (getFoodByBarcode in usda.ts)"
    - "02-02 (FoodDetailScreen at /log/detail/:fdcId)"
  provides:
    - "useFoodByBarcode hook — queries usda_foods cache by UPC"
    - "BarcodeScanScreen at /log/scan?slot=<slot>"
    - "UPC normalization to 14-digit GTIN (EAN-13 / UPC-A)"
    - "5 scan states: starting / scanning / looking-up / not-found / error"
    - "First-class manual fallback always visible in bottom strip"
  affects:
    - "02-04 (recent foods — independent; scan is another entry point to food_logs)"
    - "02-05 (Today dashboard reads food_logs regardless of how entry was logged)"
key_files:
  created:
    - "tests/logging/use-food-by-barcode.test.tsx"
    - "src/hooks/useFoodByBarcode.ts"
    - "src/screens/logging/BarcodeScanScreen.tsx"
  modified:
    - "src/App.tsx"
    - "package.json (html5-qrcode added)"
decisions:
  - "Dynamic import of html5-qrcode inside useEffect — avoids loading the camera library on module init; lets Vite code-split it away from the main bundle."
  - "Custom dark header instead of AppBar — AppBar hardcodes text-b-ink which is unreadable on the dark (#0E1620) camera background."
  - "UPC normalized to 14-digit GTIN (padStart 14) before cache lookup — USDA FoodData Central stores GTINs zero-padded to 14 digits."
  - "hasScannedRef guard — html5-qrcode fires onScanSuccess on every frame that decodes successfully; ref prevents duplicate lookups."
  - "isStarted flag in useEffect — scanner.stop() throws if called before start() resolves; flag ensures stop is only called after start completes."
  - "Bottom strip 'Search by name' is always visible (all states) — CLAUDE.md note: iOS Safari barcode scan confidence is MEDIUM, fallback must be first-class."
  - "Not-found overlay offers both 'Search by name' and 'Scan again' — 'Scan again' navigates to same route with replace to cleanly remount the camera."
metrics:
  duration: "~20 minutes"
  completed: "2026-05-18"
  tasks_completed: 3
  files_created: 3
---

# Phase 02 Plan 03: Barcode Scan

**One-liner:** BarcodeScanScreen with html5-qrcode camera, UPC cache lookup, 5 scan states, and first-class manual fallback — 31/31 tests, 0 TS errors.

## What Was Built

### Task 1: useFoodByBarcode (TDD — RED → GREEN)

| Test | Result |
|------|--------|
| Does not call getFoodByBarcode when upc is null | PASS |
| Calls getFoodByBarcode with provided upc, returns food | PASS |
| Returns null on cache miss | PASS |

Disabled when `upc` is null (no wasted query). `retry: 0` — cache miss is not a transient error.

### Task 2: BarcodeScanScreen

Route: `/log/scan?slot=<slot>`

| State | Trigger | UI |
|-------|---------|-----|
| `starting` | Component mount | Spinner + "Initializing camera…" |
| `scanning` | Camera stream active | Reticle with animated coral scan line |
| `looking-up` | Barcode decoded | Spinner + "Looking up product…" |
| `not-found` | Cache miss | Overlay: "Product not found" + search + scan-again buttons |
| `error` | Camera permission denied or unavailable | Overlay: tailored message + search CTA |

**Scan line animation:** `@keyframes bloom-scan` injected via `<style>` tag — Tailwind v4 doesn't ship arbitrary keyframes, so this is intentional.

**UPC normalization:**
- EAN-13 (13 digits) → padStart(14, '0') → matches USDA GTIN format
- UPC-A (12 digits) → padStart(14, '0') → same

**Cleanup contract:** `isStarted` flag ensures `scanner.stop()` is only called after `start()` resolves. `mounted` flag prevents state updates post-unmount.

### Task 3: App.tsx wiring

Replaced stub with real import. No route changes — route `/log/scan` was already present.

## Verification Results

| Check | Result |
|-------|--------|
| `npx vitest run` | 31/31 pass |
| `npx tsc --noEmit` | 0 errors |
| "Search by name" visible in all states | confirmed (bottom strip always renders) |
| hasScannedRef prevents duplicate scan processing | confirmed |
| UPC normalization to 14 digits | confirmed (normalizeUpc fn) |
| Camera cleanup on unmount (stop + clear) | confirmed (isStarted guard) |
| No style prop on src/components/ui/ components | confirmed (custom header, not AppBar) |

## Self-Check: PASSED
