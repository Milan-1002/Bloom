import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export interface LogFoodPayload {
  fdc_id: string
  food_name: string
  meal_slot: string
  serving_g: number
  kcal: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  fiber_g: number | null
  sugar_g: number | null
  gi: number | null
  gl: number | null
}

export function useLogFood() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: LogFoodPayload) => {
      const { error } = await supabase.from('food_logs').insert({
        user_id: user!.id,
        fdc_id: payload.fdc_id,
        food_name: payload.food_name,
        meal_slot: payload.meal_slot,
        serving_g: payload.serving_g,
        logged_at: new Date().toISOString(),
        kcal: payload.kcal,
        protein_g: payload.protein_g,
        carbs_g: payload.carbs_g,
        fat_g: payload.fat_g,
        fiber_g: payload.fiber_g,
        sugar_g: payload.sugar_g,
        gi: payload.gi,
        gl: payload.gl,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food-logs'] })
    },
  })
}
