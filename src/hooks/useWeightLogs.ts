import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/database.types'

type WeightLogRow = Pick<Tables<'weight_logs'>, 'id' | 'log_date' | 'weight_kg' | 'logged_at'>

export function useWeightLogs() {
  return useQuery({
    queryKey: ['weight-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weight_logs')
        .select('id, log_date, weight_kg, logged_at')
        .order('log_date', { ascending: true })
        .limit(30)
      if (error) throw error
      return (data ?? []) as WeightLogRow[]
    },
    staleTime: 60 * 1000,
  })
}
