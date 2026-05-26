---
phase: 07-pwa-brand-icons
plan: "01"
subsystem: pwa
tags: [pwa, icons, brand, manifest, vite-plugin-pwa]
dependency_graph:
  requires: []
  provides: [pwa-brand-icons, maskable-icon, apple-touch-icon, manifest-icons]
  affects: [vite.config.ts, index.html, public/]
tech_stack:
  added: ["@vite-pwa/assets-generator@1.0.2"]
  patterns: [filter-free-svg-rasterization, pwa-minimal-2023-preset, sharp-icon-generation]
key_files:
  created:
    - public/icon-source.svg
    - public/pwa-64x64.png
    - public/pwa-72x72.png
    - public/pwa-96x96.png
    - public/pwa-128x128.png
    - public/pwa-144x144.png
    - public/pwa-152x152.png
    - public/pwa-192x192.png
    - public/pwa-384x384.png
    - public/pwa-512x512.png
    - public/maskable-icon-512x512.png
    - public/apple-touch-icon-180x180.png
    - public/favicon.ico
    - scripts/generate-icons.mjs
  modified:
    - vite.config.ts
    - index.html
  deleted:
    - public/icons/pwa-192x192.png
    - public/icons/pwa-512x512.png
decisions:
  - "icon-source.svg uses slate navy #1F3A4D background with white #FFFFFF lightning-bolt mark (aligns with --b-primary design token)"
  - "Lightning-bolt transform: translate(256, 262) scale(8.33) translate(-24, -22.5) — centers 48x46 path at 512x512 canvas center at ~400px scaled size"
  - "@vite-pwa/assets-generator v1.0.2 (minimal-2023 preset) generates 6 files; scripts/generate-icons.mjs generates 6 extra sizes via transitive sharp"
  - "Separate purpose: 'any' (pwa-512x512.png) and purpose: 'maskable' (maskable-icon-512x512.png) entries replace the anti-pattern 'any maskable'"
  - "public/icons/ directory deleted — all icons now at public/ root matching /pwa-*.png convention"
metrics:
  duration: "~8 minutes"
  completed_date: "2026-05-26"
  tasks_completed: 2
  tasks_total: 2
  files_created: 14
  files_modified: 2
  files_deleted: 2
---

# Phase 7 Plan 01: PWA Brand Icons Summary

Real Bloom brand icons delivered for all PWA sizes — lightning-bolt mark on slate navy background, replacing 69-byte 1×1px transparent placeholder PNGs.

## What Was Built

### Task 1: Icon source SVG + asset generation

**public/icon-source.svg** — filter-free flat SVG master for rasterization:
- viewBox="0 0 512 512", 512×512 canvas
- Full-bleed `<rect width="512" height="512" fill="#1F3A4D"/>` (slate navy background)
- White lightning-bolt mark via `<path fill="#FFFFFF" d="M25.946 44.938...">` (path copied verbatim from favicon.svg)
- Transform applied: `translate(256, 262) scale(8.33) translate(-24, -22.5)` — maps the 48×46 favicon path to approximately 400px, centered at canvas center (256,256)
- Zero `<filter>`, `<feGaussianBlur>`, `<feMerge>`, or `<mask>` elements
- Zero CSS variable references (literal hex fills only)

**@vite-pwa/assets-generator v1.0.2** (minimal-2023 preset) generated:
- `public/pwa-64x64.png` (387 B — valid 64×64 PNG, compression efficient at this small size)
- `public/pwa-192x192.png` (886 B — replaces 69-byte placeholder)
- `public/pwa-512x512.png` (2.07 KB — replaces 69-byte placeholder)
- `public/maskable-icon-512x512.png` (1.94 KB — mark confined to inner 80% safe zone)
- `public/apple-touch-icon-180x180.png` (682 B)
- `public/favicon.ico` (502 B — 48×48 embedded ICO for legacy browsers)

**scripts/generate-icons.mjs** — repeatable sharp script for 6 extra sizes:
- Generates: 72, 96, 128, 144, 152, 384px PNGs from `public/icon-source.svg`
- ESM module, derives `__dirname` from `import.meta.url`
- Run: `node scripts/generate-icons.mjs`

### Task 2: vite.config.ts + index.html + cleanup

**vite.config.ts changes:**
- Added `includeAssets` array listing all 13 icon files (ensures Workbox precaches them)
- Replaced 2-entry placeholder icons array with 10-entry manifest icons:
  - 8 entries without purpose: 64, 72, 96, 128, 144, 152, 192, 384px
  - 1 entry `purpose: 'any'`: `/pwa-512x512.png`
  - 1 entry `purpose: 'maskable'`: `/maskable-icon-512x512.png`
- All src paths use `/pwa-*.png` root convention (no `/icons/` prefix)
- Eliminated `purpose: 'any maskable'` anti-pattern

**index.html changes:**
- Added `<link rel="icon" type="image/png" sizes="64x64" href="/pwa-64x64.png" />` (PNG fallback for non-SVG browsers)
- Added `<link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png" sizes="180x180" />` (iOS home screen support)
- Added `<meta name="theme-color" content="#1F3A4D" />` (browser chrome color)
- Changed `<title>app-tmp</title>` to `<title>Bloom — PCOS Nutrition</title>`

**Deleted:** `public/icons/pwa-192x192.png` and `public/icons/pwa-512x512.png` (69-byte 1×1px transparent placeholder files)

## Verification Results

| Check | Result |
|-------|--------|
| All 11 PNG files exist in public/ | PASS |
| favicon.ico exists in public/ | PASS |
| pwa-64x64.png: 387 B (valid 64×64 PNG) | PASS |
| pwa-192x192.png: 886 B (was 69-byte placeholder) | PASS |
| pwa-512x512.png: 2.07 KB (was 69-byte placeholder) | PASS |
| icon-source.svg: filter-free (`feGaussianBlur: false`) | PASS |
| icon-source.svg: #1F3A4D background present | PASS |
| icon-source.svg: #FFFFFF white mark present | PASS |
| icon-source.svg: no CSS variable references | PASS |
| vite.config.ts: no `any maskable` anti-pattern | PASS |
| vite.config.ts: no `/icons/pwa-` old paths | PASS |
| vite.config.ts: maskable-icon-512x512.png entry | PASS |
| vite.config.ts: separate purpose 'any' + 'maskable' | PASS |
| index.html: apple-touch-icon link present | PASS |
| index.html: theme-color meta present | PASS |
| index.html: title is "Bloom — PCOS Nutrition" | PASS |
| public/icons/ directory deleted | PASS |
| npm run build: exit 0 | PASS |
| dist/manifest.webmanifest: 10 icon entries | PASS |
| dist/manifest.webmanifest: /pwa-192x192.png present | PASS |
| dist/manifest.webmanifest: /maskable-icon-512x512.png present | PASS |

## Icon Transform Details

The favicon.svg uses a 48×46 viewBox. To place the mark in the inner 80% safe zone of a 512×512 canvas:

```
translate(256, 262) scale(8.33) translate(-24, -22.5)
```

- `translate(256, 262)` — move origin to canvas center (Y offset +6 to account for mark asymmetry)
- `scale(8.33)` — scale from 48px to ~400px width (512 * 0.80 / 48 ≈ 8.53, adjusted to 8.33 for visual centering)
- `translate(-24, -22.5)` — center the 48×46 source path (half of path width=48, half of path height≈45)

Result: mark occupies approximately 400×374px centered at (256,262), well within the 410×410px safe zone boundary.

## @vite-pwa/assets-generator Details

| Property | Value |
|----------|-------|
| Package | @vite-pwa/assets-generator |
| Version installed | 1.0.2 |
| Preset used | minimal-2023 |
| Output location | Same directory as source SVG (public/) |
| Files generated by preset | pwa-64x64.png, pwa-192x192.png, pwa-512x512.png, maskable-icon-512x512.png, apple-touch-icon-180x180.png, favicon.ico |
| sharp (transitive dep) | Installed automatically |

The `minimal-2023` preset confirmed outputs all go to the same directory as the source file — `public/`. No configuration file was needed; the CLI flags `--preset minimal-2023 public/icon-source.svg` were sufficient.

## Final Manifest Icons (10 entries)

```json
[
  { "src": "/pwa-64x64.png",             "sizes": "64x64",   "type": "image/png" },
  { "src": "/pwa-72x72.png",             "sizes": "72x72",   "type": "image/png" },
  { "src": "/pwa-96x96.png",             "sizes": "96x96",   "type": "image/png" },
  { "src": "/pwa-128x128.png",           "sizes": "128x128", "type": "image/png" },
  { "src": "/pwa-144x144.png",           "sizes": "144x144", "type": "image/png" },
  { "src": "/pwa-152x152.png",           "sizes": "152x152", "type": "image/png" },
  { "src": "/pwa-192x192.png",           "sizes": "192x192", "type": "image/png" },
  { "src": "/pwa-384x384.png",           "sizes": "384x384", "type": "image/png" },
  { "src": "/pwa-512x512.png",           "sizes": "512x512", "type": "image/png", "purpose": "any" },
  { "src": "/maskable-icon-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
]
```

## Deviations from Plan

### Auto-noted: pwa-64x64.png file size below 500-byte plan threshold

**Found during:** Task 1 verification
**Issue:** Plan's automated verify script used a 500-byte threshold; `pwa-64x64.png` is 387 bytes. The file is a legitimate valid 64×64 PNG (PNG header confirmed, width=64, height=64). At 64px with a simple 2-color design (dark background + white shape), PNG compression produces files well under 500 bytes. The threshold was conservative for the larger sizes.
**Resolution:** File verified as valid via PNG header inspection. All other 11 files exceed the threshold. The plan's threshold was calibrated for images > 64px and does not apply to pwa-64x64.png at its native size.
**Classification:** Not a bug — expected behavior for small monochromatic icons.

None — plan executed as written except for the size threshold note above.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. All changes are static public files and build configuration. No threat flags.

## Known Stubs

None. All icon files are real brand-mark PNGs. The manifest correctly references them at root paths. No placeholder data flows to any UI rendering.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | e4d619d | feat(07-01): generate Bloom brand icons for PWA — all 12 PNG/ICO sizes |
| Task 2 | 353e3e9 | feat(07-01): update vite manifest icons, fix index.html, remove old placeholders |

## Self-Check: PASSED

- public/icon-source.svg: EXISTS
- public/pwa-64x64.png: EXISTS
- public/pwa-192x192.png: EXISTS
- public/pwa-512x512.png: EXISTS
- public/maskable-icon-512x512.png: EXISTS
- public/apple-touch-icon-180x180.png: EXISTS
- public/favicon.ico: EXISTS
- scripts/generate-icons.mjs: EXISTS
- Commits e4d619d and 353e3e9: VERIFIED in git log
- npm run build: PASSED (exit 0)
- dist/manifest.webmanifest: 10 icon entries at /pwa-*.png root paths
