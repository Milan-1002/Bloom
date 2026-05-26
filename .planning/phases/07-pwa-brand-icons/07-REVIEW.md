---
phase: 07-pwa-brand-icons
reviewed: 2026-05-26T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - scripts/generate-icons.mjs
  - vite.config.ts
  - index.html
  - public/icon-source.svg
findings:
  critical: 1
  warning: 4
  info: 1
  total: 6
status: issues_found
---

# Phase 07: Code Review Report

**Reviewed:** 2026-05-26
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Reviewed the four files introduced for the PWA brand-icon phase: the icon-generation script, Vite/PWA config, HTML shell, and SVG source. The implementation is largely correct — the SVG safe-zone math checks out, the manifest structure is valid W3C, and the Workbox strategy is reasonable.

One critical dependency management bug will break the script for any developer on a fresh clone. Four warnings cover a missing npm entry-point for the script, a stale comment in the SVG, an unnecessary file being precached by the service worker, and a Workbox cache configuration that allows opaque (status-0) responses to be stored.

---

## Critical Issues

### CR-01: `sharp` is an undeclared dependency — script fails on fresh install

**File:** `scripts/generate-icons.mjs:5`

**Issue:** `generate-icons.mjs` imports `sharp` at the top of the file, but `sharp` is not listed in `package.json` under `dependencies` or `devDependencies`. It happens to exist in the current `node_modules` because it was installed manually (or pulled in transitively and is now gone after a clean install). Any developer who clones the repo and runs `npm install` followed by `node scripts/generate-icons.mjs` will get:

```
Error [ERR_PACKAGE_NOT_FOUND]: Cannot find package 'sharp'
```

All six "extra" icon sizes (72, 96, 128, 144, 152, 384 px) will be missing from `public/`, breaking the PWA manifest at build time.

**Fix:** Add `sharp` to `devDependencies` in `package.json`:

```json
"devDependencies": {
  "sharp": "^0.33.5",
  ...
}
```

Then run `npm install` to commit the lock-file entry.

---

## Warnings

### WR-01: No npm script entry-point for `generate-icons.mjs`

**File:** `package.json` (no line — field is absent)

**Issue:** The script must be run manually with `node scripts/generate-icons.mjs` but there is no `"generate:icons"` (or similar) entry in `package.json` `scripts`. Combined with CR-01 (missing dependency), a new developer has no obvious way to discover or reproduce the icon set. This is a one-time codegen script, so it also needs to be clear when to re-run it (e.g., after changing `icon-source.svg`).

**Fix:** Add to `package.json` scripts:

```json
"generate:icons": "node scripts/generate-icons.mjs"
```

Optionally add a brief comment in the script header or `README.md` explaining that this must be re-run whenever `public/icon-source.svg` changes.

---

### WR-02: SVG comment states wrong vertical center — `(256, 256)` vs actual `(256, 262)`

**File:** `public/icon-source.svg:5`

**Issue:** The comment on line 5 reads:

```
Centers the 48×46 path at canvas center (256,256), scaled to ~400px
```

But the `<g>` transform on line 8 is `translate(256, 262)`, placing the center 6 pixels below canvas center. The 6-pixel optical offset is reasonable for a top-heavy lightning bolt, but the comment is factually wrong. A future maintainer adjusting the SVG layout may be misled into "fixing" the Y offset to 256, inadvertently moving the mark off-optical-center.

**Fix:** Update the comment to reflect the actual transform:

```
Centers the 48×46 path at (256, 262) — 6 px below geometric center for optical balance
```

---

### WR-03: Workbox `cacheableResponse` includes status `0` — opaque responses cached for Supabase

**File:** `vite.config.ts:31`

**Issue:** The Supabase runtime-cache rule includes `cacheableResponse: { statuses: [0, 200] }`. Status `0` is an opaque cross-origin response (request made without CORS, or a network failure mid-flight). While Supabase's API does send proper CORS headers so normal responses arrive as status 200, including `0` means any opaque or intercepted failure could be stored and later served as if it were valid data. Under `NetworkFirst` the network is tried first, so the failure path is: network times out (10 s) → Workbox finds a cached status-0 entry → serves it to the app as though it were food/nutrition data.

**Fix:** Restrict to successful responses only:

```ts
cacheableResponse: { statuses: [200] },
```

If offline support for Supabase data is required, opaque responses should be handled with explicit error checking rather than blanket caching.

---

### WR-04: `globPatterns` precaches `icon-source.svg` — build artifact shipped to users

**File:** `vite.config.ts:23`

**Issue:** `workbox.globPatterns` is set to `'**/*.{js,css,html,ico,png,svg,woff2}'`, which matches every SVG in the built `dist/` directory. Because `public/icon-source.svg` is a plain file in `public/`, Vite copies it verbatim to `dist/`, and Workbox then adds it to the precache manifest. `icon-source.svg` is a build-time source file; it serves no purpose at runtime and should not be downloaded and cached by every user's browser.

**Fix:** Either move `icon-source.svg` out of `public/` (e.g., `assets/icon-source.svg`) so Vite does not copy it to `dist/`, or exclude it explicitly via Workbox's `globIgnores`:

```ts
workbox: {
  globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
  globIgnores: ['icon-source.svg'],
  ...
}
```

---

## Info

### IN-01: `includeAssets` PNG list overlaps with `globPatterns` — redundant precache entries

**File:** `vite.config.ts:14-21`

**Issue:** `includeAssets` explicitly lists every PNG icon (e.g., `pwa-64x64.png`, `pwa-192x192.png`, …). `workbox.globPatterns` includes `**/*.png`, which already captures all of these files during the build. `vite-plugin-pwa` processes `includeAssets` as `additionalManifestEntries` while Workbox's glob pass independently enumerates the same files. Workbox deduplicates by URL at build time, so there is no runtime bug, but the `includeAssets` array is purely redundant when `globPatterns` already covers `*.png`.

**Fix:** Remove the explicit PNG entries from `includeAssets` and rely on `globPatterns` alone, keeping only files that are NOT in `dist/` but need to be precached (e.g., `favicon.svg`, `favicon.ico`):

```ts
includeAssets: ['favicon.svg', 'favicon.ico'],
```

This reduces configuration surface and eliminates the need to update `includeAssets` when icon sizes change.

---

_Reviewed: 2026-05-26_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
