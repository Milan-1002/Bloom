import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { dateBounds } from '@/lib/dates'
import type { Tables } from '@/lib/database.types'

export function useFoodLogs(dateStr: string) {
  return useQuery({
    queryKey: ['food-logs', dateStr],
    queryFn: async () => {
      const { gte, lte } = dateBounds(dateStr)
      const { data, error } = await supabase
        .from('food_logs')
        .select('*')
        .gte('logged_at', gte)
        .lte('logged_at', lte)
        .order('logged_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as Tables<'food_logs'>[]
    },
    staleTime: 30 * 1000,
  })
}
