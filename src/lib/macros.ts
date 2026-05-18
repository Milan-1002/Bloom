import type { Tables } from '@/lib/database.types'

type FoodLog = Tables<'food_logs'>

export interface MacroTotals {
  kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  sugar_g: number
  gl: number
}

function round1(v: number): number {
  return Math.round(v * 10) / 10
}

export function sumMacros(entries: FoodLog[]): MacroTotals {
  return entries.reduce(
    (acc, e) => ({
      kcal: acc.kcal + (e.kcal ?? 0),
      protein_g: round1(acc.protein_g + (e.protein_g ?? 0)),
      carbs_g: round1(acc.carbs_g + (e.carbs_g ?? 0)),
      fat_g: round1(acc.fat_g + (e.fat_g ?? 0)),
      fiber_g: round1(acc.fiber_g + (e.fiber_g ?? 0)),
      sugar_g: round1(acc.sugar_g + (e.sugar_g ?? 0)),
      gl: round1(acc.gl + (e.gl ?? 0)),
    }),
    { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, sugar_g: 0, gl: 0 },
  )
}
