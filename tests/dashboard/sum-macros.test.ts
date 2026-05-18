import { describe, it, expect } from 'vitest'
import { sumMacros } from '@/lib/macros'
import type { Tables } from '@/lib/database.types'

type FoodLog = Tables<'food_logs'>

function makeEntry(overrides: Partial<FoodLog> = {}): FoodLog {
  return {
    id: 'id-1', fdc_id: 'fdc-1', food_name: 'Food', serving_g: 100,
    meal_slot: 'lunch', logged_at: '2026-05-18T12:00:00Z', user_id: 'u1', created_at: null,
    kcal: 100, protein_g: 10, carbs_g: 20, fat_g: 5, fiber_g: 3, sugar_g: 8,
    gi: null, gl: 10,
    ...overrides,
  }
}

describe('sumMacros', () => {
  it('returns all zeros for an empty array', () => {
    const result = sumMacros([])
    expect(result.kcal).toBe(0)
    expect(result.protein_g).toBe(0)
    expect(result.gl).toBe(0)
  })

  it('sums macros correctly and treats null as 0', () => {
    const entries = [
      makeEntry({ kcal: 100, protein_g: 10, gl: 5 }),
      makeEntry({ kcal: 200, protein_g: null, gl: null }),
    ]
    const result = sumMacros(entries)
    expect(result.kcal).toBe(300)
    expect(result.protein_g).toBe(10)
    expect(result.gl).toBe(5)
  })

  it('rounds totals to 1 decimal to avoid floating-point drift', () => {
    const entries = [
      makeEntry({ fiber_g: 2.1 }),
      makeEntry({ fiber_g: 1.2 }),
    ]
    const result = sumMacros(entries)
    expect(result.fiber_g).toBe(3.3)
  })
})
