# Phase 7: PWA Brand Icons - Research

**Researched:** 2026-05-26
**Domain:** PWA icon pipeline — SVG icon authoring, PNG rasterization, vite-plugin-pwa manifest configuration
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PWA-01 | App installs with real Bloom brand icons in all standard PWA sizes (72, 96, 128, 144, 152, 192, 384, 512px PNG) — replaces 1×1px placeholder icons | Icon file list, rasterization toolchain, manifest config, and apple-touch-icon all documented below |

</phase_requirements>

---

## Summary

The Bloom app currently ships two 69-byte placeholder PNG files (`public/icons/pwa-192x192.png`, `public/icons/pwa-512x512.png`) — these are 1×1px transparent images that satisfy the build step but render as a blank square on device home screens. The PWA manifest in `vite.config.ts` references only those two sizes. The `index.html` already points to `public/favicon.svg` for the browser tab favicon, and that SVG contains a valid Bloom lightning-bolt mark — but the SVG relies heavily on `feGaussianBlur` filter elements that render inconsistently when rasterized by `sharp` (via librsvg).

The recommended approach is a two-part plan: (1) create a purpose-built **icon-source.svg** (flat, no filters, solid background) from the Bloom mark and colors, and (2) use `@vite-pwa/assets-generator` (the official vite-pwa toolchain) to rasterize it into all required sizes in one command. This tool wraps `sharp` and produces the exact file names vite-plugin-pwa expects, including a separate maskable variant and an `apple-touch-icon-180x180.png`. The manifest config in `vite.config.ts` is then updated to reference all generated files with correct `purpose` values. The `index.html` title and apple-touch-icon link are also updated.

**Primary recommendation:** Author a filter-free `public/icon-source.svg`, run `pwa-assets-generator --preset minimal-2023 public/icon-source.svg`, update `vite.config.ts` manifest icons to reference the output, add `<link rel="apple-touch-icon">` to `index.html`. Do not use the complex gradient/blur `favicon.svg` as the rasterization source.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Icon file generation | Build-time script | — | One-time script (`scripts/generate-icons.mjs`) run before `vite build`; produces static PNG files |
| PWA manifest icon entries | Build-time config (`vite.config.ts`) | — | vite-plugin-pwa injects manifest at build time; manifest lives in the Vite plugin config |
| Browser favicon | Static file (`public/favicon.svg`) | `index.html` `<link>` | Already in place; SVG favicon served directly, no build step needed |
| Apple touch icon | Static file (`public/apple-touch-icon-180x180.png`) | `index.html` `<link>` | iOS Safari ignores manifest; reads `<link rel="apple-touch-icon">` in HTML head |
| Service worker cache | Build-time plugin | — | `workbox.globPatterns` already includes `png`; no additional config needed |

---

## Codebase State (Current)

### Existing Icon Files

| File | Size | Contents |
|------|------|----------|
| `public/icons/pwa-192x192.png` | 69 bytes | 1×1px transparent PNG (placeholder) |
| `public/icons/pwa-512x512.png` | 69 bytes | 1×1px transparent PNG (placeholder) |
| `public/favicon.svg` | ~11 KB | Full Bloom lightning-bolt icon with `feGaussianBlur` blur layers, purple gradient mark |
| `public/icons.svg` | ~2 KB | SVG sprite for social icons (Bluesky, Discord, GitHub, etc.) — unrelated |

### Current vite.config.ts Manifest Icon Config

```typescript
// Source: C:\Users\sunar\Desktop\Bloom_APP\app\vite.config.ts (read directly)
icons: [
  { src: '/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
  { src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
],
```

**Problems with current config:**
1. Only 2 icon sizes — Chrome requires 192 and 512 minimum, but PWA-01 requires 72, 96, 128, 144, 152, 192, 384, 512px
2. `purpose: 'any maskable'` on one icon is an anti-pattern [CITED: https://dev.to/progressier/why-a-pwa-app-icon-shouldnt-have-a-purpose-set-to-any-maskable-4c78] — the same image looks wrong when displayed without a mask (icon has too much padding) or with a mask (content gets cropped)
3. The 1×1px files would render as invisible squares regardless

### Current index.html State

```html
<!-- Source: C:\Users\sunar\Desktop\Bloom_APP\app\index.html (read directly) -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<!-- Missing: apple-touch-icon, theme-color meta, proper title -->
<title>app-tmp</title>  <!-- placeholder title -->
```

### Brand Colors (from tokens.css)

| Context | Color | Hex |
|---------|-------|-----|
| Default `--b-primary` (slate) | Deep slate navy | `#1F3A4D` |
| Warm palette `--b-primary` | Terracotta | `#C16D4A` |
| Sage palette `--b-primary` | Forest green | `#4D6A47` |
| Default `--b-accent` | Slate blue | `#4E84A4` |
| Existing favicon mark | Bloom purple | `#863bff` |

The existing `favicon.svg` uses `#863bff` (a purple/violet) as the brand mark color. This is different from the app's `--b-primary` slate navy. The icon design decision (which color to use) is addressed in the Open Questions section.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `vite-plugin-pwa` | 1.3.0 (installed) | PWA manifest injection, service worker | Already in project; the integration point for all icon config |
| `@vite-pwa/assets-generator` | 1.0.2 (npm latest) | CLI to rasterize SVG → PNG at all required sizes | Official vite-pwa companion tool; produces correct file names and sizes for vite-plugin-pwa; wraps `sharp` internally |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `sharp` | 0.34.5 (npm latest, not installed) | Node.js image processing — used internally by `@vite-pwa/assets-generator` | Installed as a transitive dependency of `@vite-pwa/assets-generator`; do not call directly |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@vite-pwa/assets-generator` | Custom Node.js script using `sharp` directly | Custom script is ~50 lines and works, but `@vite-pwa/assets-generator` handles file naming conventions, preset validation, and manifest entry generation automatically — use the official tool |
| `@vite-pwa/assets-generator` | `@resvg/resvg-js` | `resvg-js` uses Rust-based Resvg (better SVG filter support than sharp/librsvg) but requires a full custom script; `@vite-pwa/assets-generator` is the first-class solution |
| Filter-heavy `favicon.svg` as source | New flat `icon-source.svg` | The existing `favicon.svg` uses `feGaussianBlur` SVG filter primitives. Sharp/librsvg has documented rendering inconsistencies with these filters [CITED: https://github.com/lovell/sharp/issues/804]. A flat/filter-free SVG is required for reliable rasterization |
| Separate maskable and non-maskable files | `purpose: 'any maskable'` (combined) | Combined purpose is an anti-pattern — one image cannot look correct both with and without a mask at the same time [CITED: https://dev.to/progressier/why-a-pwa-app-icon-shouldnt-have-a-purpose-set-to-any-maskable-4c78] |

**Installation:**

```bash
npm install -D @vite-pwa/assets-generator
```

(`sharp` is installed as a transitive dep of `@vite-pwa/assets-generator`)

**Version verification:**
```bash
npm view @vite-pwa/assets-generator version   # 1.0.2 (verified 2026-05-26)
npm view sharp version                         # 0.34.5 (verified 2026-05-26)
```

---

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| `@vite-pwa/assets-generator` | npm | ~3 yrs (2023-06-05) | High (official vite-pwa org) | github.com/vite-pwa/assets-generator | [OK] | Approved |
| `sharp` | npm | ~13 yrs (2013-08-20) | 50M+/wk (major ecosystem package) | github.com/lovell/sharp | [OK] | Approved — installed transitively |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

---

## Architecture Patterns

### System Architecture Diagram

```
SVG Source (icon-source.svg)
       │
       ▼
[Build script: pwa-assets-generator]
  uses @vite-pwa/assets-generator CLI
       │
       ├─► public/pwa-64x64.png
       ├─► public/pwa-192x192.png          ← replaces placeholder
       ├─► public/pwa-512x512.png          ← replaces placeholder
       ├─► public/maskable-icon-512x512.png
       ├─► public/apple-touch-icon-180x180.png
       └─► public/favicon.ico (48×48 embedded)
                  │
                  ▼
         [vite build]
          vite-plugin-pwa reads manifest.icons config
               │
               ├─► dist/manifest.webmanifest (with icon entries)
               └─► dist/sw.js (Workbox precaches *.png)
```

Note: For PWA-01 requirement which lists 72, 96, 128, 144, 152, 384px sizes — these are generated via a custom generation script beyond the `minimal-2023` preset. See Patterns section.

### Recommended Project Structure

```
public/
├── icon-source.svg          # NEW: filter-free source SVG (square canvas, solid bg)
├── favicon.svg              # KEEP: existing (browser tab only — complex OK here)
├── favicon.ico              # NEW: generated by pwa-assets-generator
├── apple-touch-icon-180x180.png  # NEW: generated
├── pwa-64x64.png            # NEW: generated
├── pwa-192x192.png          # NEW: overwrites placeholder
├── pwa-512x512.png          # NEW: overwrites placeholder
└── maskable-icon-512x512.png # NEW: generated (safe zone padded)

scripts/
└── generate-icons.mjs       # NEW: wraps pwa-assets-generator for all sizes

(note: public/icons/pwa-*.png are REMOVED — moved to public/ root to match convention)
```

### Pattern 1: Authoring the Icon Source SVG

**What:** Create a flat, filter-free SVG with a square viewBox, solid background, and the Bloom mark centered within the safe zone (inner 80%).
**When to use:** The source SVG must be rasterized by sharp/librsvg. Any `<filter>` elements will render inconsistently — especially `feGaussianBlur`.

```svg
<!-- Source: authored based on maskable safe-zone requirements
     [CITED: https://web.dev/articles/maskable-icon] -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <!-- Solid background fills entire canvas — required for maskable -->
  <rect width="512" height="512" rx="0" fill="#1F3A4D"/>
  <!-- Bloom mark centered and scaled to fit within inner 80% (safe zone)
       Inner 80% = 410×410px centered → starts at (51,51) -->
  <!-- Lightning-bolt / bloom mark paths scaled to ~300px, centered at 256,256 -->
  <!-- ... path data ... -->
</svg>
```

**Key constraints for the SVG:**
- Square viewBox (512×512 or 1024×1024)
- No `<filter>`, `<feGaussianBlur>`, or `<feMerge>` elements — they break sharp
- Solid `<rect>` background (same color as icon — no transparency for maskable)
- All mark paths use static `fill` attributes (no CSS variables — they don't resolve in SVG rasterization context)
- Mark content fits within inner 80% circle (safe zone radius = 40% of width = 204px from center for 512px canvas)

### Pattern 2: Running @vite-pwa/assets-generator CLI

**What:** Generate all PWA-required icon sizes from the source SVG.
**When to use:** After authoring `public/icon-source.svg`.

```bash
# Source: https://vite-pwa-org.netlify.app/assets-generator/cli
# Generates: pwa-64x64.png, pwa-192x192.png, pwa-512x512.png,
#            maskable-icon-512x512.png, apple-touch-icon-180x180.png, favicon.ico
npx @vite-pwa/assets-generator --preset minimal-2023 public/icon-source.svg
```

The `minimal-2023` preset generates these files in the same directory as the source:
- `pwa-64x64.png`
- `pwa-192x192.png`
- `pwa-512x512.png`
- `maskable-icon-512x512.png`
- `apple-touch-icon-180x180.png`
- `favicon.ico` (48×48 embedded)

For the additional sizes in PWA-01 (72, 96, 128, 144, 152, 384px), a supplementary `scripts/generate-icons.mjs` script calls `sharp` directly to produce those sizes from `icon-source.svg`. This is straightforward since `sharp` is installed transitively.

### Pattern 3: Generating Additional Sizes with Sharp

**What:** Produce the extra sizes (72, 96, 128, 144, 152, 384px) that `minimal-2023` does not generate.

```javascript
// scripts/generate-icons.mjs
// Source: sharp API at https://sharp.pixelplumbing.com + direct codebase authoring
import sharp from 'sharp'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const svgSource = readFileSync(join(__dirname, '../public/icon-source.svg'))

const sizes = [72, 96, 128, 144, 152, 384]

for (const size of sizes) {
  await sharp(svgSource)
    .resize(size, size)
    .png()
    .toFile(join(__dirname, `../public/pwa-${size}x${size}.png`))
  console.log(`Generated pwa-${size}x${size}.png`)
}
```

### Pattern 4: Updated vite.config.ts Manifest Icons

**What:** Replace the two placeholder entries with the full set, using correct `purpose` values.

```typescript
// Source: vite-pwa-org.netlify.app/guide/pwa-minimal-requirements.html
// CRITICAL: never combine 'any maskable' — use separate entries
icons: [
  { src: '/pwa-64x64.png',            sizes: '64x64',   type: 'image/png' },
  { src: '/pwa-72x72.png',            sizes: '72x72',   type: 'image/png' },
  { src: '/pwa-96x96.png',            sizes: '96x96',   type: 'image/png' },
  { src: '/pwa-128x128.png',          sizes: '128x128', type: 'image/png' },
  { src: '/pwa-144x144.png',          sizes: '144x144', type: 'image/png' },
  { src: '/pwa-152x152.png',          sizes: '152x152', type: 'image/png' },
  { src: '/pwa-192x192.png',          sizes: '192x192', type: 'image/png' },
  { src: '/pwa-384x384.png',          sizes: '384x384', type: 'image/png' },
  { src: '/pwa-512x512.png',          sizes: '512x512', type: 'image/png', purpose: 'any' },
  { src: '/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
],
```

Note: `src` paths use `/pwa-*.png` at root of `public/` — not `/icons/pwa-*.png`. The `includeAssets` array in the VitePWA config must include these files so Workbox precaches them.

### Pattern 5: Updated index.html Head

```html
<!-- Source: vite-pwa-org.netlify.app/guide/pwa-minimal-requirements.html -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="icon" type="image/png" sizes="64x64" href="/pwa-64x64.png" />
<link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png" sizes="180x180" />
<meta name="theme-color" content="#1F3A4D" />
<title>Bloom — PCOS Nutrition</title>
```

Note: The SVG favicon stays in place — the existing `favicon.svg` renders fine in browser tabs (blur filters work in browser SVG rendering). The rasterization problem only affects sharp. The PNG fallback (`pwa-64x64.png`) covers browsers that don't support SVG favicons.

### Anti-Patterns to Avoid

- **`purpose: 'any maskable'` on one icon:** This is an explicitly documented anti-pattern. The same PNG cannot serve both purposes without visual degradation on either masked or unmasked surfaces [CITED: https://dev.to/progressier/why-a-pwa-app-icon-shouldnt-have-a-purpose-set-to-any-maskable-4c78].
- **Using `favicon.svg` as the rasterization source:** It uses `feGaussianBlur` SVG filters that sharp/librsvg renders incorrectly — the output would have artifacts or missing blur effects [CITED: https://github.com/lovell/sharp/issues/804].
- **Leaving `/icons/pwa-*.png` path convention:** The `minimal-2023` preset outputs to the same directory as the source SVG; standardizing on `public/pwa-*.png` root paths avoids path mismatch in the manifest.
- **CSS variable colors in icon SVG:** `var(--b-primary)` does not resolve in SVG files processed by sharp. Use literal hex values in `icon-source.svg`.
- **Forgetting `includeAssets` in VitePWA config:** Workbox precaches only files referenced by `globPatterns` or `includeAssets`; new icon files at the public root must be listed or the pattern `**/*.png` must cover them.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SVG to PNG at multiple sizes | Custom Node.js + canvas + `createImageBitmap` | `@vite-pwa/assets-generator` (wraps `sharp`) | sharp handles PNG compression, output format, proper dimensions; canvas APIs in Node.js require `canvas` package and have platform build issues |
| Maskable icon safe-zone padding | Manual SVG path adjustments | Design directly in SVG source with 10% padding per side | The safe zone rule is geometric — design the SVG correctly once, rasterize at any size |
| Favicon.ico generation | Convert PNG → ICO manually | `@vite-pwa/assets-generator` (produces `favicon.ico` automatically) | ICO format requires multi-resolution embedding; the generator handles this |

**Key insight:** The hardest part of this phase is SVG design, not tooling. The toolchain is single-command once the source SVG is right.

---

## Common Pitfalls

### Pitfall 1: Using the Complex favicon.svg for Rasterization

**What goes wrong:** Running `@vite-pwa/assets-generator` against `public/favicon.svg` produces PNGs with incorrect blur rendering — either missing glow effects or rendering artifacts.
**Why it happens:** `favicon.svg` uses multiple `feGaussianBlur` SVG filter primitives. sharp uses librsvg under the hood, which has documented inconsistencies rendering SVG filter effects.
**How to avoid:** Create a separate `public/icon-source.svg` that reproduces the Bloom mark using solid fills and paths only — no `<filter>` elements.
**Warning signs:** Generated PNGs look different from the browser-rendered SVG; inner glow/blur effects appear solid or missing.

### Pitfall 2: Combining `purpose: 'any maskable'` on a Single Entry

**What goes wrong:** On Android, Chrome applies a circular or squircle mask to the icon and the content appears correctly but with harsh cropping. On iOS (which reads `apple-touch-icon`, not the manifest) the image may look fine. But on some Android launchers, the maskable icon is displayed without a mask, showing the full padded image which looks small inside a white square.
**Why it happens:** The W3C spec defines `any` and `maskable` as different design intents. `any` means "fill the full canvas"; `maskable` means "keep content in safe zone, fill entire bg."
**How to avoid:** Always provide two separate 512x512 PNGs: one for `purpose: 'any'` (mark fills canvas), one for `purpose: 'maskable'` (mark in safe zone, solid bg to edges). The `minimal-2023` preset does this correctly.
**Warning signs:** Lighthouse PWA audit warns "Maskable icon not specified."

### Pitfall 3: Wrong Icon Paths in Manifest

**What goes wrong:** vite-plugin-pwa generates `manifest.webmanifest` referencing `/icons/pwa-192x192.png` (old path) but the new files are at `/pwa-192x192.png` (root). The browser tries to fetch the old path and gets 404s.
**Why it happens:** Old config referenced `'/icons/pwa-192x192.png'`; new files land at `public/pwa-192x192.png` = `/pwa-192x192.png` in prod.
**How to avoid:** Update `manifest.icons` in `vite.config.ts` with the correct paths before running the build. The old `/icons/` directory and its placeholder files should be deleted.
**Warning signs:** Chrome DevTools Application panel shows icon errors; "Add to Home Screen" shows blank icon.

### Pitfall 4: Missing apple-touch-icon in index.html

**What goes wrong:** iOS Safari and older iOS Chrome ignore `manifest.webmanifest` for icons. When a user adds the app to their iPhone home screen, they see the generic browser favicon (or a screenshot thumbnail) instead of the Bloom icon.
**Why it happens:** iOS Safari has never adopted the manifest icons spec; it reads `<link rel="apple-touch-icon">` from the HTML head instead.
**How to avoid:** Add `<link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png" sizes="180x180">` to `index.html`. This is separate from the manifest config.
**Warning signs:** Android shows correct icon; iOS home screen shows a webpage screenshot thumbnail.

### Pitfall 5: index.html Title Still "app-tmp"

**What goes wrong:** When the PWA is installed, the app tile on the home screen may show "app-tmp" as the display name rather than "Bloom" (depending on browser).
**Why it happens:** `index.html` still has `<title>app-tmp</title>` from the original scaffold. PWA installs use `manifest.name` / `manifest.short_name` primarily, but the `<title>` is used as a fallback and appears in browser history.
**How to avoid:** Update `<title>Bloom — PCOS Nutrition</title>` while touching `index.html` for the apple-touch-icon link.
**Warning signs:** Browser tab and browser history show "app-tmp"; PWA install dialog may show wrong name.

---

## Code Examples

### Generate All Required Icon Sizes

```javascript
// scripts/generate-icons.mjs
// Source: sharp documentation at https://sharp.pixelplumbing.com + minimal-2023 preset docs
import sharp from 'sharp'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const src = join(__dirname, '../public/icon-source.svg')
const svgBuffer = readFileSync(src)

// Sizes required by PWA-01 not covered by minimal-2023 preset
const extraSizes = [72, 96, 128, 144, 152, 384]

for (const size of extraSizes) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(join(__dirname, `../public/pwa-${size}x${size}.png`))
  console.log(`  pwa-${size}x${size}.png`)
}
```

### Complete vite.config.ts VitePWA Block

```typescript
// Source: vite-pwa-org.netlify.app/guide/pwa-minimal-requirements.html
VitePWA({
  registerType: 'prompt',
  strategies: 'generateSW',
  includeAssets: [
    'favicon.svg', 'favicon.ico',
    'apple-touch-icon-180x180.png',
    'pwa-64x64.png', 'pwa-72x72.png', 'pwa-96x96.png',
    'pwa-128x128.png', 'pwa-144x144.png', 'pwa-152x152.png',
    'pwa-192x192.png', 'pwa-384x384.png', 'pwa-512x512.png',
    'maskable-icon-512x512.png',
  ],
  workbox: { /* existing workbox config unchanged */ },
  manifest: {
    name: 'Bloom — PCOS Nutrition',
    short_name: 'Bloom',
    description: 'Your PCOS-aware nutrition companion',
    theme_color: '#1F3A4D',
    background_color: '#EEF2F5',
    display: 'standalone',
    orientation: 'portrait',
    icons: [
      { src: '/pwa-64x64.png',             sizes: '64x64',   type: 'image/png' },
      { src: '/pwa-72x72.png',             sizes: '72x72',   type: 'image/png' },
      { src: '/pwa-96x96.png',             sizes: '96x96',   type: 'image/png' },
      { src: '/pwa-128x128.png',           sizes: '128x128', type: 'image/png' },
      { src: '/pwa-144x144.png',           sizes: '144x144', type: 'image/png' },
      { src: '/pwa-152x152.png',           sizes: '152x152', type: 'image/png' },
      { src: '/pwa-192x192.png',           sizes: '192x192', type: 'image/png' },
      { src: '/pwa-384x384.png',           sizes: '384x384', type: 'image/png' },
      { src: '/pwa-512x512.png',           sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
})
```

### Maskable Icon Safe Zone Template (SVG)

```svg
<!--
  icon-source.svg — filter-free source for rasterization
  Safe zone: inner 80% of 512px canvas = 410×410px region centered at (256, 256)
  Bloom mark content must stay within x: 51–461, y: 51–461
  Source: safe zone math from https://web.dev/articles/maskable-icon
-->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <!-- Full-bleed solid background — required for maskable to look correct -->
  <rect width="512" height="512" fill="#1F3A4D"/>
  <!-- Bloom lightning-bolt mark, paths scaled to ~300px, centered at 256,256 -->
  <!-- All fills are static hex values — CSS variables do NOT resolve here -->
  <g transform="translate(256, 256) scale(6) translate(-24, -23)">
    <!-- scaled bloom mark paths here -->
  </g>
</svg>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `purpose: 'any maskable'` combined | Separate `purpose: 'any'` and `purpose: 'maskable'` entries | ~2021 (W3C spec clarification) | Prevents visual artifacts on maskless Android launchers |
| `favicon.ico` only | SVG favicon + PNG fallback + ICO | ~2021 (browser SVG favicon support) | SVG favicon scales perfectly to any DPI; PNG/ICO for legacy |
| Manual icon creation in image editor | `@vite-pwa/assets-generator --preset minimal-2023` | 2023 (tool release) | One-command generation of all required files from a single SVG |
| Relative icon paths with explicit sizes listing | Chrome auto-scales 192 and 512 | 2020+ | Chrome resizes 192x192 for smaller contexts; only 192 and 512 are hard requirements for installability |

**Deprecated/outdated:**
- `purpose: 'any maskable'` (combined string): Discouraged since adaptive icons specification; always use separate entries.
- Providing 9+ individual sizes manually: Chrome's installability checker only requires 192 and 512; extra sizes are optional quality-of-life but not required for install prompt.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The Bloom mark's purple color (`#863bff` from `favicon.svg`) is the intended icon color for the PWA icon | Design section throughout | If the intended icon color is the app's slate navy `--b-primary` (`#1F3A4D`), the icon source SVG needs different fill values — very low effort to fix |
| A2 | sharp/librsvg renders the `feGaussianBlur` filters in `favicon.svg` incorrectly — verified from GitHub issues, not from running a test | Pitfall 1 | If the current sharp version (0.34.5) handles it correctly, `favicon.svg` could be used directly — low probability given the issue age |
| A3 | PWA-01 lists 72, 96, 128, 144, 152, 192, 384, 512px as required sizes | Requirements interpretation | The `minimal-2023` preset only generates 64, 192, 512, maskable-512, apple-180. Extra sizes need the custom script — if PWA-01 intent is "at minimum 192+512," the custom script is optional |

---

## Open Questions (RESOLVED)

1. **Icon color: purple vs. slate navy** ✓ RESOLVED
   - **Decision:** Use slate navy `#1F3A4D` background with white `#FFFFFF` Bloom mark — matches `--b-primary` design token and `theme_color` in manifest.
   - Rationale: User confirmed slate navy to align the PWA icon with the app's primary brand color.

2. **Icon sizes: strict vs. minimal** ✓ RESOLVED
   - **Decision:** Implement ALL 8 PWA-01 sizes (72, 96, 128, 144, 152, 192, 384, 512px) plus the 64px from the minimal-2023 preset.
   - Rationale: User confirmed full size list; custom sharp script is ~15 lines and provides coverage across all Android/browser UI resolutions.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | `generate-icons.mjs` script | ✓ | v22.15.0 | — |
| npm | Package install | ✓ | (detected) | — |
| `@vite-pwa/assets-generator` | Icon generation | ✗ (not installed) | — | Install as devDependency |
| `sharp` | Transitive dep of above | ✗ (not installed) | — | Installed with `@vite-pwa/assets-generator` |
| `vite-plugin-pwa` | Manifest config | ✓ | 1.3.0 (installed) | — |

**Missing dependencies with no fallback:**
- `@vite-pwa/assets-generator` — plan must include `npm install -D @vite-pwa/assets-generator` as the first task

**Missing dependencies with fallback:**
- None

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.6 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PWA-01 | Generated PNG files exist at correct paths | Smoke (file system check) | `npm test -- tests/pwa/icon-files.test.ts` | ❌ Wave 0 |
| PWA-01 | Manifest references all required icon sizes | Unit (manifest JSON validation) | `npm test -- tests/pwa/manifest.test.ts` | ❌ Wave 0 |
| PWA-01 | Generated PNGs have correct dimensions | Smoke (PNG header check) | included in icon-files.test.ts | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test` (runs full suite — fast; no browser needed)
- **Per wave merge:** `npm test` + manual browser check in Chrome DevTools Application panel
- **Phase gate:** Full suite green + Chrome Lighthouse PWA audit passes without icon warnings

### Wave 0 Gaps

- [ ] `tests/pwa/icon-files.test.ts` — verifies all required PNG files exist in `public/` at correct sizes
- [ ] `tests/pwa/manifest.test.ts` — parses built `manifest.webmanifest` and verifies icon entries (requires running vite build first, or mocking)

**Simpler alternative for Wave 0:** Since this phase is file-generation work, the test can be a straightforward Node.js script that checks file existence and PNG dimensions using the `fs` module and a minimal PNG header parser. Vitest can run this as a unit test without a browser environment.

---

## Security Domain

> This phase makes no changes to authentication, data handling, or network requests. Icons are static public files served by the CDN. No ASVS categories apply.

| ASVS Category | Applies | Notes |
|---------------|---------|-------|
| V2 Authentication | No | No auth changes |
| V5 Input Validation | No | No user input |
| V6 Cryptography | No | No crypto |
| V9 Communications | No | Icons are static public files |

---

## Sources

### Primary (HIGH confidence)
- [vite-pwa-org.netlify.app/guide/pwa-minimal-requirements.html](https://vite-pwa-org.netlify.app/guide/pwa-minimal-requirements.html) — icon sizes (192, 512 minimum), apple-touch-icon setup, HTML head requirements
- [vite-pwa-org.netlify.app/assets-generator/cli.html](https://vite-pwa-org.netlify.app/assets-generator/cli.html) — CLI command, minimal-2023 preset output files
- [vite-pwa-org.netlify.app/assets-generator/integrations](https://vite-pwa-org.netlify.app/assets-generator/integrations) — vite-plugin-pwa pwaAssets integration, overrideManifestIcons
- [web.dev/articles/maskable-icon](https://web.dev/articles/maskable-icon) — safe zone 40% radius rule, maskable design requirements
- [developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Define_app_icons](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Define_app_icons) — purpose values, maskable safe zone
- Codebase direct read — `public/favicon.svg`, `public/icons/pwa-*.png`, `vite.config.ts`, `index.html`, `src/styles/tokens.css`, `package.json`

### Secondary (MEDIUM confidence)
- [dev.to/progressier/why-a-pwa-app-icon-shouldnt-have-a-purpose-set-to-any-maskable-4c78](https://dev.to/progressier/why-a-pwa-app-icon-shouldnt-have-a-purpose-set-to-any-maskable-4c78) — anti-pattern: combined `purpose: 'any maskable'`
- npm registry `npm view @vite-pwa/assets-generator version` — confirmed 1.0.2, created 2023-06-05
- npm registry `npm view sharp version` — confirmed 0.34.5, created 2013-08-20 (13-year-old package, highly trusted)

### Tertiary (LOW confidence)
- [github.com/lovell/sharp/issues/804](https://github.com/lovell/sharp/issues/804) — sharp SVG filter support limitations (searched, not directly fetched; issue confirmed to exist from web search results)
- slopcheck results — both `@vite-pwa/assets-generator` and `sharp` rated [OK]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — vite-pwa/assets-generator is the official toolchain; verified via npm view and official docs
- Architecture: HIGH — vite-plugin-pwa manifest config verified from official docs; codebase state verified by direct file read
- Pitfalls: HIGH for items 2-5 (directly verified); MEDIUM for Pitfall 1 (sharp filter rendering confirmed via GitHub issues, not local test)
- Icon design: MEDIUM — SVG authoring guidance is standard; specific Bloom mark recreation depends on design decisions in Open Questions

**Research date:** 2026-05-26
**Valid until:** 2026-11-26 (stable ecosystem — vite-plugin-pwa and PWA spec are mature)
