import { describe, it, expect, beforeEach, vi } from 'vitest'

// We import from the module under test — this will fail until theme.ts is implemented
import { applyTheme, loadTheme, saveTheme } from '@/lib/theme'

describe('theme', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    // Reset data attributes
    document.documentElement.removeAttribute('data-palette')
    document.documentElement.removeAttribute('data-dark')
  })

  describe('loadTheme()', () => {
    it('returns { palette: "slate", dark: false } when localStorage is empty', () => {
      const result = loadTheme()
      expect(result).toEqual({ palette: 'slate', dark: false })
    })

    it('returns saved palette from localStorage', () => {
      localStorage.setItem('bloom-palette', 'warm')
      localStorage.setItem('bloom-dark', 'false')
      const result = loadTheme()
      expect(result.palette).toBe('warm')
    })

    it('returns saved dark flag from localStorage', () => {
      localStorage.setItem('bloom-palette', 'slate')
      localStorage.setItem('bloom-dark', 'true')
      const result = loadTheme()
      expect(result.dark).toBe(true)
    })

    it('falls back to "slate" for invalid palette values', () => {
      localStorage.setItem('bloom-palette', 'malicious-value')
      const result = loadTheme()
      expect(result.palette).toBe('slate')
    })
  })

  describe('applyTheme()', () => {
    it('sets data-palette to "" (empty) and data-dark to "false" for slate/light', () => {
      applyTheme('slate', false)
      expect(document.documentElement.getAttribute('data-palette')).toBe('')
      expect(document.documentElement.getAttribute('data-dark')).toBe('false')
    })

    it('sets data-palette="warm" and data-dark="true" for warm/dark', () => {
      applyTheme('warm', true)
      expect(document.documentElement.getAttribute('data-palette')).toBe('warm')
      expect(document.documentElement.getAttribute('data-dark')).toBe('true')
    })

    it('sets data-palette="sage" for sage palette', () => {
      applyTheme('sage', false)
      expect(document.documentElement.getAttribute('data-palette')).toBe('sage')
    })
  })

  describe('saveTheme()', () => {
    it('persists palette and dark flag to localStorage', () => {
      saveTheme('sage', false)
      expect(localStorage.getItem('bloom-palette')).toBe('sage')
      expect(localStorage.getItem('bloom-dark')).toBe('false')
    })

    it('calls applyTheme — sets data-palette on documentElement', () => {
      saveTheme('warm', true)
      expect(document.documentElement.getAttribute('data-palette')).toBe('warm')
      expect(document.documentElement.getAttribute('data-dark')).toBe('true')
    })

    it('persists dark=true correctly', () => {
      saveTheme('sage', true)
      expect(localStorage.getItem('bloom-dark')).toBe('true')
    })
  })
})
