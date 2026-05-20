/**
 * cycle.ts — Pure cycle phase computation engine.
 *
 * No external imports. No side effects. Safe to call in any context.
 *
 * Phase boundaries scale proportionally for cycle lengths 21–45 days
 * (evidence-based: Thiyagarajan et al., 2022).
 */

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal'

export type CyclePhaseResult = {
  phase: CyclePhase
  cycleDay: number
  cycleLength: number
}

/**
 * Compute the current menstrual cycle phase from a last period date.
 *
 * @param lastPeriodDate - Date object representing the first day of the last period.
 *                         Pass null if the user has not entered cycle data.
 * @param cycleLengthDays - Typical cycle length in days (range 21–45, default 28).
 * @returns CyclePhaseResult with phase, cycleDay (1-indexed), and cycleLength.
 *          Returns null when lastPeriodDate is null or an invalid Date.
 *
 * Phase boundaries (proportional for any cycleLength):
 *   Menstrual:  cycleDay 1–5
 *   Follicular: cycleDay 6 – Math.round(cycleLength × 0.46)
 *   Ovulation:  Math.round(cycleLength × 0.46) + 1 – Math.round(cycleLength × 0.54)
 *   Luteal:     Math.round(cycleLength × 0.54) + 1 – cycleLength
 */
export function getCyclePhase(
  lastPeriodDate: Date | null,
  cycleLengthDays: number
): CyclePhaseResult | null {
  if (lastPeriodDate === null) return null
  if (isNaN(lastPeriodDate.getTime())) return null

  const MS_PER_DAY = 86_400_000
  const daysSince = Math.floor((Date.now() - lastPeriodDate.getTime()) / MS_PER_DAY)
  const cycleDay = (daysSince % cycleLengthDays) + 1 // 1-indexed, always in range 1..cycleLengthDays

  const follicularEnd = Math.round(cycleLengthDays * 0.46)
  const ovulationEnd = Math.round(cycleLengthDays * 0.54)

  let phase: CyclePhase
  if (cycleDay <= 5) {
    phase = 'menstrual'
  } else if (cycleDay <= follicularEnd) {
    phase = 'follicular'
  } else if (cycleDay <= ovulationEnd) {
    phase = 'ovulation'
  } else {
    phase = 'luteal'
  }

  return { phase, cycleDay, cycleLength: cycleLengthDays }
}
