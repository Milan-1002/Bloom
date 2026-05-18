import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/database.types'

type FoodLog = Tables<'food_logs'>

export function deduplicateByFdcId(logs: FoodLog[], limit: number): FoodLog[] {
  const seen = new Set<string>()
  return logs
    .filter((log) => {
      if (!log.fdc_id || seen.has(log.fdc_id)) return false
      seen.add(log.fdc_id)
      return true
    })
    .slice(0, limit)
}

export function useRecentFoods() {
  return useQuery({
    queryKey: ['food-logs', 'recent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('food_logs')
        .select('id, fdc_id, food_name, serving_g, meal_slot, logged_at, kcal, protein_g, carbs_g, fat_g, fiber_g, sugar_g, gi, gl')
        .order('logged_at', { ascending: false })
        .limit(200)
      if (error) throw error
      return deduplicateByFdcId((data ?? []) as FoodLog[], 20)
    },
    staleTime: 60 * 1000,
  })
}
