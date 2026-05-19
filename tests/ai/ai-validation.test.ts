import { describe, it, expect } from 'vitest'
import {
  validateTargets,
  checkForbidden,
  buildUserPrompt,
  FORBIDDEN_PATTERNS,
} from '@/lib/ai-validation'
import type { AITargetsOutput, ProfileInput } from '@/lib/ai-validation'

const VALID: AITargetsOutput = {
  protein_g: 120,
  fiber_g: 30,
  gl_target: 90,
  added_sugar_g: 20,
  calorie_min: 1500,
  calorie_max: 1800,
  pc_ratio_target: 0.35,
  insulin_score: 74,
  narrative: 'These targets support steady insulin levels. Prioritise fiber and protein at each meal.',
  key_factors: ['insulin_resistance_type', 'weight_loss_goal'],
}

describe('validateTargets', () => {
  it('happy path: valid object is returned unchanged', () => {
    const result = validateTargets(VALID)
    expect(result).toEqual(VALID)
  })

  it('throws when protein_g is below floor (39)', () => {
    expect(() => validateTargets({ ...VALID, protein_g: 39 })).toThrow('protein_g')
  })

  it('throws when protein_g is above ceiling (301)', () => {
    expect(() => validateTargets({ ...VALID, protein_g: 301 })).toThrow()
  })

  it('throws when calorie_min >= calorie_max (equal)', () => {
    expect(() => validateTargets({ ...VALID, calorie_min: 1800, calorie_max: 1800 })).toThrow('calorie_min')
  })

  it('throws when calorie range too narrow (< 200)', () => {
    expect(() => validateTargets({ ...VALID, calorie_min: 1400, calorie_max: 1550 })).toThrow()
  })

  it('throws when narrative is empty string', () => {
    expect(() => validateTargets({ ...VALID, narrative: '' })).toThrow()
  })

  it('throws when narrative is over 300 chars', () => {
    expect(() => validateTargets({ ...VALID, narrative: 'x'.repeat(301) })).toThrow()
  })

  it('throws when key_factors is empty array', () => {
    expect(() => validateTargets({ ...VALID, key_factors: [] })).toThrow()
  })

  it('throws when input is null', () => {
    expect(() => validateTargets(null)).toThrow()
  })

  it('throws when insulin_score is 101 (out of range)', () => {
    expect(() => validateTargets({ ...VALID, insulin_score: 101 })).toThrow('insulin_score')
  })

  it('throws when fiber_g is 14 (below 15 floor)', () => {
    expect(() => validateTargets({ ...VALID, fiber_g: 14 })).toThrow('fiber_g')
  })
})

describe('checkForbidden', () => {
  it('throws on "diagnoses insulin resistance" (/diagnos/i)', () => {
    expect(() => checkForbidden('This diagnoses insulin resistance')).toThrow()
  })

  it('throws on "take 500mg/day of inositol" (/mg\\/day/i)', () => {
    expect(() => checkForbidden('take 500mg/day of inositol')).toThrow()
  })

  it('throws on "we prescribe this for" (/prescri/i)', () => {
    expect(() => checkForbidden('we prescribe this for you')).toThrow()
  })

  it('throws on "Metformin interactions" (/[Mm]etformin/)', () => {
    expect(() => checkForbidden('Metformin interactions may occur')).toThrow()
  })

  it('throws on "dosage adjustment needed" (/dosage/i)', () => {
    expect(() => checkForbidden('dosage adjustment needed')).toThrow()
  })

  it('does NOT throw on clean nutritional text', () => {
    expect(() => checkForbidden('Your targets support steady energy throughout the day.')).not.toThrow()
  })
})

describe('buildUserPrompt', () => {
  const PROFILE: ProfileInput = {
    pcos_type: 'Insulin Resistance',
    age: 32,
    height_cm: 165,
    current_weight_kg: 72,
    goal_weight_kg: 65,
    goals: ['weight loss', 'steady energy'],
  }

  it('contains "PCOS type: Insulin Resistance"', () => {
    expect(buildUserPrompt(PROFILE)).toContain('PCOS type: Insulin Resistance')
  })

  it('contains "Age: 32"', () => {
    expect(buildUserPrompt(PROFILE)).toContain('Age: 32')
  })

  it('contains "Height: 165 cm"', () => {
    expect(buildUserPrompt(PROFILE)).toContain('Height: 165 cm')
  })

  it('contains goals joined by comma', () => {
    expect(buildUserPrompt(PROFILE)).toContain('weight loss, steady energy')
  })

  it('does NOT contain user_id value (GDPR)', () => {
    const profileWithId = { ...PROFILE } as ProfileInput & { user_id?: string }
    profileWithId.user_id = 'abc-123-secret'
    expect(buildUserPrompt(profileWithId as ProfileInput)).not.toContain('abc-123-secret')
  })

  it('ends with "Generate daily macro targets for this user."', () => {
    expect(buildUserPrompt(PROFILE)).toContain('Generate daily macro targets for this user.')
  })

  it('handles null pcos_type with "not specified"', () => {
    expect(buildUserPrompt({ ...PROFILE, pcos_type: null })).toContain('not specified')
  })
})

describe('FORBIDDEN_PATTERNS', () => {
  it('exports an array of 5 patterns', () => {
    expect(Array.isArray(FORBIDDEN_PATTERNS)).toBe(true)
    expect(FORBIDDEN_PATTERNS).toHaveLength(5)
  })
})
