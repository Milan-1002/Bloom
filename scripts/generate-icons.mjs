// scripts/generate-icons.mjs
// Generates the extra icon sizes (72, 96, 128, 144, 152, 384px) not covered by
// the @vite-pwa/assets-generator minimal-2023 preset.
// Run: node scripts/generate-icons.mjs
import sharp from 'sharp'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const svgBuffer = readFileSync(join(__dirname, '../public/icon-source.svg'))

// Sizes required by PWA-01 not covered by minimal-2023 preset
const extraSizes = [72, 96, 128, 144, 152, 384]

for (const size of extraSizes) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(join(__dirname, `../public/pwa-${size}x${size}.png`))
  console.log(`  Generated pwa-${size}x${size}.png`)
}

console.log('Done — all extra icon sizes generated.')
