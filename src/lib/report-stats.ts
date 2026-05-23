// Pure aggregation and computation functions for the Doctor-Ready Report.
// No React, no Supabase, no side effects — all functions are deterministic given the same input.

// ─── Exported types ────────────────────────────────────────────────────────────

export type ReportWindow = 30 | 60 | 90

export interface RedFlagStreak {
  startDate: string       // 'YYYY-MM-DD' — first day of the streak
  endDate: string         // 'YYYY-MM-DD' — last day of the streak
  days: number            // count of consecutive days in the streak
  avgOveragePct: number   // e.g. 42 means GL was 42% above ceiling on average
}

export interface MealTimingStats {
  avgFirstMealHour: number      // decimal hours (e.g. 8.25 = 8:15am)
  avgLastMealHour: number       // decimal hours (e.g. 18.75 = 6:45pm)
  avgFastingWindowHours: number // 24 − (avgLastMealHour − avgFirstMealHour)
}

export interface MealSlotDistribution {
  breakfast: number // percentage of total entries (0–100)
  lunch: number
  dinner: number
  snack: number
}

export interface ChartDatum {
  date: string                 // 'YYYY-MM-DD'
  gl: number | null            // daily total GL; null = no food logged that day
  symptomScore: number | null  // composite score 1–5; null = no symptom log
}

export interface ReportStats {
  avgGL: number
  avgFiber: number
  weightChange: number | null     // kg: last weight − first weight in window; null if < 2 weight logs
  cycleLengthDays: number | null  // from profile; null if not configured
  glTrend: '▲' | '▼' | '→'
  fiberTrend: '▲' | '▼' | '→'
  weightTrend: '▲' | '▼' | '→'
  redFlagStreaks: RedFlagStreak[]
  mealTiming: MealTimingStats | null
  mealSlotDistribution: MealSlotDistribution
  chartData: ChartDatum[]
  hasEnoughData: boolean  // true if ≥ 7 unique days have at least 1 food log
  daysWithData: number    // count of unique days that have ≥ 1 food log
}

// Input shape — also exported so computeReportStats can be typed without importing from hooks
export interface ReportInput {
  foodLogs: Array<{
    logged_at: string
    meal_slot: string
    gl: number | null
    fiber_g: number | null
  }>
  weightLogs: Array<{
    log_date: string
    weight_kg: number
  }>
  symptomLogs: Array<{
    log_date: string
    energy: number | null
    mood: number | null
    sleep: number | null
    bloating: number | null
    skin: number | null
    cravings: number | null
  }>
  glCeiling: number       // GL ceiling for red-flag detection (from AI target or STATIC_TARGETS.gl)
  windowDays: ReportWindow
  windowStartStr: string  // 'YYYY-MM-DD' — inclusive start of window
  todayStr: string        // 'YYYY-MM-DD' — inclusive end of window (today)
  cycleLengthDays: number | null
}

// ─── Internal types ────────────────────────────────────────────────────────────

type DailyGLMap = Record<string, number>      // dateStr → total GL for that day
type DailyFiberMap = Record<string, number>   // dateStr → total fiber_g for that day
type DailySymptomMap = Record<string, number> // dateStr → composite score (1–5)

// ─── Internal helpers ──────────────────────────────────────────────────────────

function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

/** Format a Date as 'YYYY-MM-DD' without importing from other modules. */
function formatDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return [y, m, day].join('-')
}

// ─── Exported functions ────────────────────────────────────────────────────────

/**
 * Group food logs by local date and sum GL values.
 * Days where all entries have null gl are excluded from the map.
 */
export function computeDailyGL(foodLogs: ReportInput['foodLogs']): DailyGLMap {
  const map: DailyGLMap = {}
  for (const log of foodLogs) {
    if (log.gl === null) continue
    const dateStr = log.logged_at.slice(0, 10)
    map[dateStr] = (map[dateStr] ?? 0) + log.gl
  }
  return map
}

/**
 * Group food logs by local date and sum fiber_g values.
 * Days where all entries have null fiber_g are excluded from the map.
 */
export function computeDailyFiber(foodLogs: ReportInput['foodLogs']): DailyFiberMap {
  const map: DailyFiberMap = {}
  for (const log of foodLogs) {
    if (log.fiber_g === null) continue
    const dateStr = log.logged_at.slice(0, 10)
    map[dateStr] = (map[dateStr] ?? 0) + log.fiber_g
  }
  return map
}

/**
 * Compute arithmetic mean of all values in a Record<string, number>.
 * Returns 0 for empty map. Rounds to 1 decimal place.
 */
export function computeAvgOfMap(map: Record<string, number>): number {
  const values = Object.values(map)
  if (values.length === 0) return 0
  return Math.round(mean(values) * 10) / 10
}

/**
 * Compute weight change (last − first) in kg.
 * Returns null if fewer than 2 weight logs.
 */
export function computeWeightChange(weightLogs: ReportInput['weightLogs']): number | null {
  if (weightLogs.length < 2) return null
  const sorted = [...weightLogs].sort((a, b) => (a.log_date < b.log_date ? -1 : 1))
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  return Math.round((last.weight_kg - first.weight_kg) * 10) / 10
}

/**
 * Compute composite symptom score for a single log entry.
 * Averages non-null fields: energy, mood, sleep, bloating, skin, cravings.
 * Returns null if all fields are null.
 */
export function computeCompositeSymptomScore(
  log: ReportInput['symptomLogs'][number],
): number | null {
  const values: number[] = []
  if (log.energy !== null) values.push(log.energy)
  if (log.mood !== null) values.push(log.mood)
  if (log.sleep !== null) values.push(log.sleep)
  if (log.bloating !== null) values.push(log.bloating)
  if (log.skin !== null) values.push(log.skin)
  if (log.cravings !== null) values.push(log.cravings)
  if (values.length === 0) return null
  return Math.round(mean(values) * 10) / 10
}

/**
 * Map symptom logs to a daily composite score map.
 * Days with no symptom log or all-null symptoms are excluded.
 */
export function computeDailySymptomScores(
  symptomLogs: ReportInput['symptomLogs'],
): DailySymptomMap {
  const map: DailySymptomMap = {}
  for (const log of symptomLogs) {
    const score = computeCompositeSymptomScore(log)
    if (score !== null) {
      map[log.log_date] = score
    }
  }
  return map
}

/**
 * Detect streaks of 5+ consecutive calendar days where dailyGL > glCeiling × 1.20.
 * Returns an array of RedFlagStreak objects (may be empty).
 */
export function detectRedFlagStreaks(
  dailyGL: DailyGLMap,
  glCeiling: number,
): RedFlagStreak[] {
  const streaks: RedFlagStreak[] = []
  const dates = Object.keys(dailyGL).sort()
  if (dates.length === 0) return streaks

  const threshold = glCeiling * 1.2

  let streakStart: string | null = null
  let streakEnd: string | null = null
  let streakDays = 0
  const streakOverages: number[] = []

  const closeStreak = () => {
    if (streakStart !== null && streakEnd !== null && streakDays >= 5) {
      const avgOveragePct = Math.round(mean(streakOverages) * 10) / 10
      streaks.push({
        startDate: streakStart,
        endDate: streakEnd,
        days: streakDays,
        avgOveragePct,
      })
    }
    streakStart = null
    streakEnd = null
    streakDays = 0
    streakOverages.length = 0
  }

  for (const dateStr of dates) {
    const gl = dailyGL[dateStr]
    if (gl > threshold) {
      const overagePct = ((gl / glCeiling) - 1) * 100
      if (streakStart === null) {
        streakStart = dateStr
      }
      streakEnd = dateStr
      streakDays += 1
      streakOverages.push(overagePct)
    } else {
      closeStreak()
    }
  }
  // Close any open streak after the loop
  closeStreak()

  return streaks
}

/**
 * Compute average meal timing stats (first meal, last meal, fasting window).
 * Returns null if no dates have ≥ 2 log entries.
 */
export function computeMealTimingStats(
  foodLogs: ReportInput['foodLogs'],
): MealTimingStats | null {
  // Group logs by date
  const byDate: Record<string, number[]> = {}
  for (const log of foodLogs) {
    const dateStr = log.logged_at.slice(0, 10)
    const d = new Date(log.logged_at)
    const hour = d.getHours() + d.getMinutes() / 60
    if (!byDate[dateStr]) byDate[dateStr] = []
    byDate[dateStr].push(hour)
  }

  const firstMealHours: number[] = []
  const lastMealHours: number[] = []

  for (const hours of Object.values(byDate)) {
    if (hours.length < 2) continue
    firstMealHours.push(Math.min(...hours))
    lastMealHours.push(Math.max(...hours))
  }

  if (firstMealHours.length === 0) return null

  const avgFirstMealHour = Math.round(mean(firstMealHours) * 100) / 100
  const avgLastMealHour = Math.round(mean(lastMealHours) * 100) / 100
  const avgFastingWindowHours = Math.round((24 - (avgLastMealHour - avgFirstMealHour)) * 100) / 100

  return { avgFirstMealHour, avgLastMealHour, avgFastingWindowHours }
}

/**
 * Compute percentage distribution of food log entries across meal slots.
 */
export function computeMealSlotDistribution(
  foodLogs: ReportInput['foodLogs'],
): MealSlotDistribution {
  if (foodLogs.length === 0) {
    return { breakfast: 0, lunch: 0, dinner: 0, snack: 0 }
  }
  let breakfast = 0
  let lunch = 0
  let dinner = 0
  let snack = 0
  const total = foodLogs.length
  for (const log of foodLogs) {
    const slot = log.meal_slot.toLowerCase()
    if (slot === 'breakfast') breakfast += 1
    else if (slot === 'lunch') lunch += 1
    else if (slot === 'dinner') dinner += 1
    else if (slot === 'snack') snack += 1
  }
  return {
    breakfast: Math.round((breakfast / total) * 100),
    lunch: Math.round((lunch / total) * 100),
    dinner: Math.round((dinner / total) * 100),
    snack: Math.round((snack / total) * 100),
  }
}

/**
 * Compute trend direction from an array of ordered values.
 * Splits into first and second half and compares averages.
 * Returns '→' if fewer than 4 values (insufficient data).
 */
export function computeTrend(values: number[]): '▲' | '▼' | '→' {
  if (values.length < 4) return '→'
  const midpoint = Math.floor(values.length / 2)
  const firstHalf = values.slice(0, midpoint)
  const secondHalf = values.slice(midpoint)
  const firstHalfAvg = mean(firstHalf)
  const secondHalfAvg = mean(secondHalf)
  if (firstHalfAvg === 0) return '→'
  const changePct = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100
  if (changePct > 5) return '▲'
  if (changePct < -5) return '▼'
  return '→'
}

/**
 * Generate one ChartDatum per calendar day from windowStartStr to todayStr (inclusive).
 * GL and symptomScore are null for days without data.
 */
export function buildChartData(
  dailyGL: DailyGLMap,
  dailySymptomScores: DailySymptomMap,
  windowStartStr: string,
  todayStr: string,
): ChartDatum[] {
  const result: ChartDatum[] = []
  const current = new Date(windowStartStr + 'T12:00:00')
  const end = new Date(todayStr + 'T12:00:00')

  while (current <= end) {
    const dateStr = formatDateStr(current)
    result.push({
      date: dateStr,
      gl: dailyGL[dateStr] ?? null,
      symptomScore: dailySymptomScores[dateStr] ?? null,
    })
    current.setDate(current.getDate() + 1)
  }

  return result
}

/**
 * Master aggregation function. Calls all sub-functions and assembles ReportStats.
 */
export function computeReportStats(input: ReportInput): ReportStats {
  const dailyGL = computeDailyGL(input.foodLogs)
  const dailyFiber = computeDailyFiber(input.foodLogs)
  const dailySymptomScores = computeDailySymptomScores(input.symptomLogs)

  const avgGL = computeAvgOfMap(dailyGL)
  const avgFiber = computeAvgOfMap(dailyFiber)
  const weightChange = computeWeightChange(input.weightLogs)

  const glTrend = computeTrend(Object.values(dailyGL))
  const fiberTrend = computeTrend(Object.values(dailyFiber))
  const weightTrend = computeTrend(
    [...input.weightLogs]
      .sort((a, b) => (a.log_date < b.log_date ? -1 : 1))
      .map((w) => w.weight_kg),
  )

  const redFlagStreaks = detectRedFlagStreaks(dailyGL, input.glCeiling)
  const mealTiming = computeMealTimingStats(input.foodLogs)
  const mealSlotDistribution = computeMealSlotDistribution(input.foodLogs)
  const chartData = buildChartData(
    dailyGL,
    dailySymptomScores,
    input.windowStartStr,
    input.todayStr,
  )

  const daysWithData = Object.keys(dailyGL).length
  const hasEnoughData = daysWithData >= 7

  return {
    avgGL,
    avgFiber,
    weightChange,
    cycleLengthDays: input.cycleLengthDays,
    glTrend,
    fiberTrend,
    weightTrend,
    redFlagStreaks,
    mealTiming,
    mealSlotDistribution,
    chartData,
    hasEnoughData,
    daysWithData,
  }
}
