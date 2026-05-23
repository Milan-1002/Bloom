import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { toLocalDateStr } from '@/lib/dates'
import { STATIC_TARGETS } from '@/lib/targets'
import type { ReportWindow, ReportInput } from '@/lib/report-stats'

// Re-export ReportWindow so consumers can import it from this module
export type { ReportWindow } from '@/lib/report-stats'

// ReportRawData is the full ReportInput ready to pass to computeReportStats
export interface ReportRawData extends ReportInput {}

export function useReportData(windowDays: ReportWindow) {
  const { user } = useAuth()

  return useQuery<ReportInput>({
    queryKey: ['report-data', user?.id, windowDays],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated')

      // Compute window boundaries in local time
      const today = new Date()
      const todayStr = toLocalDateStr(today)

      // windowStart = windowDays calendar days before today (local time)
      const windowStartDate = new Date(todayStr + 'T00:00:00')
      windowStartDate.setDate(windowStartDate.getDate() - windowDays)
      const windowStartStr = toLocalDateStr(windowStartDate)

      // ISO timestamps for food_logs (logged_at is timestamptz)
      const windowStartISO = windowStartDate.toISOString()
      const todayEndISO = new Date(todayStr + 'T23:59:59.999').toISOString()

      // Parallel fetch of all 5 data sources
      const [foodRes, weightRes, symptomRes, aiTargetRes, profileRes] = await Promise.all([
        supabase
          .from('food_logs')
          .select('logged_at, meal_slot, gl, fiber_g')
          .gte('logged_at', windowStartISO)
          .lte('logged_at', todayEndISO)
          .order('logged_at', { ascending: true }),

        supabase
          .from('weight_logs')
          .select('log_date, weight_kg')
          .gte('log_date', windowStartStr)
          .lte('log_date', todayStr)
          .order('log_date', { ascending: true }),

        supabase
          .from('symptom_logs')
          .select('log_date, energy, mood, sleep, bloating, skin, cravings')
          .gte('log_date', windowStartStr)
          .lte('log_date', todayStr)
          .order('log_date', { ascending: true }),

        supabase
          .from('ai_daily_targets')
          .select('gl_target')
          .order('generated_at', { ascending: false })
          .limit(1)
          .maybeSingle(),

        supabase
          .from('profiles')
          .select('cycle_length_days')
          .eq('id', user.id)
          .single(),
      ])

      // Throw on Supabase errors (ai_daily_targets is optional — skip its error check)
      if (foodRes.error) throw foodRes.error
      if (weightRes.error) throw weightRes.error
      if (symptomRes.error) throw symptomRes.error
      if (profileRes.error) throw profileRes.error

      const glCeiling = aiTargetRes.data?.gl_target ?? STATIC_TARGETS.gl

      return {
        foodLogs: foodRes.data ?? [],
        weightLogs: weightRes.data ?? [],
        symptomLogs: symptomRes.data ?? [],
        glCeiling,
        windowDays,
        windowStartStr,
        todayStr,
        cycleLengthDays: profileRes.data?.cycle_length_days ?? null,
      } satisfies ReportInput
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes — report data is not real-time
    retry: false,
  })
}
