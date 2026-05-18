// Static PCOS reference targets — Phase 4 replaces these with AI-generated values
// from ai_daily_targets via useAITargets hook.
export const STATIC_TARGETS = {
  protein_g: 120,
  fiber_g: 30,
  gl: 100,     // daily GL ceiling (lower-is-better)
  sugar_g: 25, // added sugar ceiling
  kcal: 1700,
} as const

export type DailyTargets = typeof STATIC_TARGETS
