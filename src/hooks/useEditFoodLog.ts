import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { calculateGL } from '@/lib/gl'

interface EditableEntry {
  serving_g: number
  kcal: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  fiber_g: number | null
  sugar_g: number | null
  food_name: string
}

export interface EditFoodLogPayload {
  id: string
  entry: EditableEntry
  newServingG: number
  newSlot: string
}

function round1(v: number | null, ratio: number): number | null {
  return v != null ? Math.round(v * ratio * 10) / 10 : null
}

export function useEditFoodLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, entry, newServingG, newSlot }: EditFoodLogPayload) => {
      const ratio = newServingG / entry.serving_g
      const newCarbs = round1(entry.carbs_g, ratio)
      const { error } = await supabase
        .from('food_logs')
        .update({
          serving_g: newServingG,
          meal_slot: newSlot,
          kcal: entry.kcal != null ? Math.round(entry.kcal * ratio) : null,
          protein_g: round1(entry.protein_g, ratio),
          carbs_g: newCarbs,
          fat_g: round1(entry.fat_g, ratio),
          fiber_g: round1(entry.fiber_g, ratio),
          sugar_g: round1(entry.sugar_g, ratio),
          gl: newCarbs != null ? calculateGL(entry.food_name, newCarbs) : null,
        })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food-logs'] })
    },
  })
}
