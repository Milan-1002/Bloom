import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { STATIC_TARGETS } from '@/lib/targets'
import { getCyclePhase } from '@/lib/cycle'

export type AITargets = {
  protein_g: number
  fiber_g: number
  gl_target: number
  added_sugar_g: number
  calorie_min: number
  calorie_max: number
  pc_ratio_target: number
  insulin_score: number | null
  narrative: string
  generated_at: string
  source: 'ai' | 'static'
  cycle_phase?: string | null
}

const FALLBACK: AITargets = {
  protein_g: STATIC_TARGETS.protein_g,
  fiber_g: STATIC_TARGETS.fiber_g,
  gl_target: STATIC_TARGETS.gl,
  added_sugar_g: STATIC_TARGETS.sugar_g,
  calorie_min: STATIC_TARGETS.kcal - 150,
  calorie_max: STATIC_TARGETS.kcal + 150,
  pc_ratio_target: 0.3,
  insulin_score: null,
  narrative: '',
  generated_at: '',
  source: 'static',
  cycle_phase: null,
}

function rowToTargets(row: Record<string, unknown>): AITargets {
  return {
    protein_g:       Number(row.protein_g)       || FALLBACK.protein_g,
    fiber_g:         Number(row.fiber_g)         || FALLBACK.fiber_g,
    gl_target:       Number(row.gl_target)       || FALLBACK.gl_target,
    added_sugar_g:   Number(row.added_sugar_g)   || FALLBACK.added_sugar_g,
    calorie_min:     Number(row.calorie_min)     || FALLBACK.calorie_min,
    calorie_max:     Number(row.calorie_max)     || FALLBACK.calorie_max,
    pc_ratio_target: Number(row.pc_ratio_target) || FALLBACK.pc_ratio_target,
    insulin_score:   row.insulin_score != null ? Number(row.insulin_score) : null,
    narrative:       typeof row.narrative === 'string' ? row.narrative : '',
    generated_at:    typeof row.generated_at === 'string' ? row.generated_at : '',
    source: 'ai',
    cycle_phase:     typeof row.cycle_phase === 'string' ? row.cycle_phase : null,
  }
}

export function useAITargets() {
  const { user } = useAuth()

  return useQuery<AITargets>({
    queryKey: ['ai-targets', user?.id],
    queryFn: async () => {
      if (!user) return FALLBACK

      // Fetch latest ai_daily_targets row + profile (with cycle fields) in parallel
      const [targetsRes, profileRes] = await Promise.all([
        supabase
          .from('ai_daily_targets')
          .select('*')
          .eq('user_id', user.id)
          .order('generated_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('updated_at, last_period_date, cycle_length_days')
          .eq('id', user.id)
          .single(),
      ])

      const existing = targetsRes.data
      const profileUpdatedAt = profileRes.data?.updated_at ?? null

      // Compute current cycle phase from profile data
      const lastPeriodDateRaw = profileRes.data?.last_period_date ?? null
      const cycleLengthDays = profileRes.data?.cycle_length_days ?? 28
      const lastPeriodDate = lastPeriodDateRaw ? new Date(lastPeriodDateRaw) : null
      const cycleResult = getCyclePhase(lastPeriodDate, cycleLengthDays)
      const computedPhase = cycleResult?.phase ?? null

      // Phase-drift check: regenerate if stored phase differs from computed phase
      const phaseDrifted =
        computedPhase !== null &&
        existing != null &&
        (existing as Record<string, unknown>).cycle_phase !== computedPhase

      // Prompt-version check: regenerate if row was generated with an older prompt
      const promptVersionStale =
        existing != null &&
        (((existing as Record<string, unknown>).prompt_version as number) ?? 0) < 2

      // Regenerate if: no row, phase drifted, prompt stale, or profile updated after generation
      const needsRegen =
        !existing ||
        phaseDrifted ||
        promptVersionStale ||
        (profileUpdatedAt != null && existing.generated_at < profileUpdatedAt)

      if (!needsRegen && existing) {
        return rowToTargets(existing as Record<string, unknown>)
      }

      // Call Edge Function — falls back to existing row or static on failure
      try {
        const { data, error } = await supabase.functions.invoke<AITargets>('generate-targets')
        if (error || !data) {
          return existing ? rowToTargets(existing as Record<string, unknown>) : FALLBACK
        }
        return { ...data, source: 'ai' }
      } catch {
        return existing ? rowToTargets(existing as Record<string, unknown>) : FALLBACK
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}
