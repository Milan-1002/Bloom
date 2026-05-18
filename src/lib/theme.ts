const PALETTE_KEY = 'bloom-palette'
const DARK_KEY = 'bloom-dark'

type Palette = 'slate' | 'warm' | 'sage'

const VALID_PALETTES: Palette[] = ['slate', 'warm', 'sage']

/**
 * Apply theme attributes to document.documentElement.
 * When palette is 'slate', data-palette is set to '' (empty string)
 * to match the :root selector which has no [data-palette] override.
 */
export function applyTheme(palette: Palette, dark: boolean): void {
  document.documentElement.setAttribute('data-palette', palette === 'slate' ? '' : palette)
  document.documentElement.setAttribute('data-dark', String(dark))
}

/**
 * Load theme from localStorage. Falls back to { palette: 'slate', dark: false }
 * if not set or if the stored palette is invalid.
 */
export function loadTheme(): { palette: Palette; dark: boolean } {
  const storedPalette = localStorage.getItem(PALETTE_KEY)
  const storedDark = localStorage.getItem(DARK_KEY)

  const palette: Palette =
    storedPalette && (VALID_PALETTES as string[]).includes(storedPalette)
      ? (storedPalette as Palette)
      : 'slate'

  const dark = storedDark === 'true'

  return { palette, dark }
}

/**
 * Save theme to localStorage and apply it immediately.
 */
export function saveTheme(palette: Palette, dark: boolean): void {
  localStorage.setItem(PALETTE_KEY, palette)
  localStorage.setItem(DARK_KEY, String(dark))
  applyTheme(palette, dark)
}
