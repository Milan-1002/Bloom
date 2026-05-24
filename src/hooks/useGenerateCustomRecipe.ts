import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { type Recipe, recipeImage } from '@/hooks/useRecipes'

// ── Types ──────────────────────────────────────────────────────────────────────

export type GenerateMode = 'profile' | 'fridge'

export type GenerateParams = {
  mode: GenerateMode
  ingredients?: string[]
}

type RawRecipe = {
  name: string
  category: string
  timeMin: number
  kcal: number
  protein_g: number
  fiber_g: number
  carbs_g: number
  gl: number
  tags: string[]
  ingredients: string[]
  instructions: string[]
}

// ── hook ──────────────────────────────────────────────────────────────────────

/**
 * Calls the generate-custom-recipe Edge Function.
 * Returns a fully-shaped Recipe object ready to render.
 * Does NOT store in DB — caller decides whether to save it via useSavedRecipes.
 */
export function useGenerateCustomRecipe() {
  return useMutation({
    mutationFn: async ({ mode, ingredients }: GenerateParams): Promise<Recipe> => {
      const { data, error } = await supabase.functions.invoke<{ recipe: RawRecipe; source: string }>(
        'generate-custom-recipe',
        { body: { mode, ingredients } }
      )

      if (error) throw new Error(error.message ?? 'generation_failed')
      if (!data?.recipe?.name) throw new Error('invalid_recipe_response')

      const raw = data.recipe
      return {
        id: `custom-${Date.now()}`,
        name: raw.name,
        image: recipeImage(raw.category ?? 'bowl'),
        timeMin: raw.timeMin,
        kcal: raw.kcal,
        protein_g: raw.protein_g,
        fiber_g: raw.fiber_g,
        carbs_g: raw.carbs_g ?? 0,
        gl: raw.gl,
        tags: Array.isArray(raw.tags) ? raw.tags : [],
        ingredients: Array.isArray(raw.ingredients) ? raw.ingredients : [],
        instructions: Array.isArray(raw.instructions) ? raw.instructions : [],
      }
    },
  })
}
