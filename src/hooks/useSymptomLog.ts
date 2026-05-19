import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/database.types'

export function useSymptomLog(dateStr: string) {
  return useQuery({
    queryKey: ['symptom-log', dateStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('symptom_logs')
        .select('*')
        .eq('log_date', dateStr)
        .maybeSingle()
      if (error) throw error
      return data as Tables<'symptom_logs'> | null
    },
    staleTime: 30 * 1000,
  })
}
