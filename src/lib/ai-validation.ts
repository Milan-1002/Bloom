export interface AITargetsOutput {
  protein_g: number
  fiber_g: number
  gl_target: number
  added_sugar_g: number
  calorie_min: number
  calorie_max: number
  pc_ratio_target: number
  insulin_score: number
  narrative: string
  key_factors: string[]
}

export type ProfileInput = {
  pcos_type: string | null
  goals: string[] | null
  age: number | null
  height_cm: number | null
  current_weight_kg: number | null
  goal_weight_kg: number | null
}

function assertRange(name: string, val: number, min: number, max: number): void {
  if (typeof val !== 'number' || isNaN(val) || !isFinite(val) || val < min || val > max) {
    throw new Error(`${name} out of range: ${val} (expected ${min}–${max})`)
  }
}

export function validateTargets(raw: unknown): AITargetsOutput {
  if (typeof raw !== 'object' || raw === null) throw new Error('Not an object')
  const r = raw as Record<string, unknown>

  assertRange('protein_g',       Number(r.protein_g),       40,   300)
  assertRange('fiber_g',         Number(r.fiber_g),         15,   80)
  assertRange('gl_target',       Number(r.gl_target),       40,   200)
  assertRange('added_sugar_g',   Number(r.added_sugar_g),   10,   60)
  assertRange('calorie_min',     Number(r.calorie_min),     1200, 2500)
  assertRange('calorie_max',     Number(r.calorie_max),     1400, 3000)
  assertRange('pc_ratio_target', Number(r.pc_ratio_target), 0.15, 0.60)
  assertRange('insulin_score',   Number(r.insulin_score),   0,    100)

  if (Number(r.calorie_min) >= Number(r.calorie_max)) {
    throw new Error(`calorie_min must be less than calorie_max`)
  }
  if (Number(r.calorie_max) - Number(r.calorie_min) < 200) {
    throw new Error('calorie range too narrow (must be >= 200)')
  }

  if (typeof r.narrative !== 'string' || r.narrative.trim().length === 0) {
    throw new Error('narrative missing or empty')
  }
  if (r.narrative.length > 300) {
    throw new Error('narrative too long (max 300 chars)')
  }
  if (!Array.isArray(r.key_factors) || r.key_factors.length === 0) {
    throw new Error('key_factors missing or empty')
  }

  return r as unknown as AITargetsOutput
}

export const FORBIDDEN_PATTERNS: RegExp[] = [
  /diagnos/i,
  /mg\/day/i,
  /prescri/i,
  /[Mm]etformin/,
  /dosage/i,
]

export function checkForbidden(text: string): void {
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(`forbidden:${pattern.source}`)
    }
  }
}

export function buildUserPrompt(profile: ProfileInput): string {
  const lines = [
    `PCOS type: ${profile.pcos_type ?? 'not specified'}`,
    `Age: ${profile.age ?? 'not specified'}`,
    `Height: ${profile.height_cm ? profile.height_cm + ' cm' : 'not specified'}`,
    `Current weight: ${profile.current_weight_kg ? profile.current_weight_kg + ' kg' : 'not specified'}`,
    `Goal weight: ${profile.goal_weight_kg ? profile.goal_weight_kg + ' kg' : 'not specified (maintenance)'}`,
    `Goals: ${profile.goals && profile.goals.length > 0 ? profile.goals.join(', ') : 'not specified'}`,
  ]
  return lines.join('\n') + '\n\nGenerate daily macro targets for this user.'
}
