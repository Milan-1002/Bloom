import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { STATIC_TARGETS } from '@/lib/targets'

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
  }
}

export function useAITargets() {
  const { user } = useAuth()

  return useQuery<AITargets>({
    queryKey: ['ai-targets', user?.id],
    queryFn: async () => {
      if (!user) return FALLBACK

      // Fetch latest ai_daily_targets row + profile updated_at in parallel
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
          .select('updated_at')
          .eq('id', user.id)
          .single(),
      ])

      const existing = targetsRes.data
      const profileUpdatedAt = profileRes.data?.updated_at ?? null

      // Regenerate if no row exists, or profile was updated after last generation
      const needsRegen =
        !existing ||
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
