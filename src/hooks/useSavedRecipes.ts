import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { type Recipe } from '@/hooks/useRecipes'
import { type Json } from '@/lib/database.types'

// ── Types ──────────────────────────────────────────────────────────────────────

export type RecipeSource = 'library' | 'generated_profile' | 'generated_fridge'

type SavedRecipeRow = {
  id: string
  recipe_id: string
  recipe: Recipe
  source: RecipeSource
  saved_at: string
}

// ── hook ──────────────────────────────────────────────────────────────────────

/**
 * DB-backed favourites. Provides:
 *   savedIds  — Set<string> of saved recipe_ids for quick O(1) lookup
 *   data      — full saved rows with recipe JSON
 *   save()    — upsert a recipe into saved_recipes
 *   unsave()  — delete a saved recipe
 */
export function useSavedRecipes() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const queryKey = ['saved-recipes', user?.id]

  const query = useQuery<SavedRecipeRow[]>({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_recipes')
        .select('id, recipe_id, recipe, source, saved_at')
        .eq('user_id', user!.id)
        .order('saved_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as SavedRecipeRow[]
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  })

  const savedIds = new Set<string>(query.data?.map(r => r.recipe_id) ?? [])

  // ── optimistic save ──────────────────────────────────────────────────────────

  const save = useMutation({
    mutationFn: async ({ recipe, source }: { recipe: Recipe; source: RecipeSource }) => {
      const { error } = await supabase.from('saved_recipes').upsert(
        {
          user_id: user!.id,
          recipe_id: recipe.id,
          recipe: recipe as unknown as Json,
          source,
        },
        { onConflict: 'user_id,recipe_id' }
      )
      if (error) throw error
    },
    onMutate: async ({ recipe, source }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<SavedRecipeRow[]>(queryKey)
      queryClient.setQueryData<SavedRecipeRow[]>(queryKey, old => [
        { id: 'optimistic', recipe_id: recipe.id, recipe, source, saved_at: new Date().toISOString() },
        ...(old ?? []),
      ])
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(queryKey, ctx.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  // ── optimistic unsave ─────────────────────────────────────────────────────────

  const unsave = useMutation({
    mutationFn: async (recipeId: string) => {
      const { error } = await supabase
        .from('saved_recipes')
        .delete()
        .eq('user_id', user!.id)
        .eq('recipe_id', recipeId)
      if (error) throw error
    },
    onMutate: async (recipeId) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<SavedRecipeRow[]>(queryKey)
      queryClient.setQueryData<SavedRecipeRow[]>(queryKey, old =>
        (old ?? []).filter(r => r.recipe_id !== recipeId)
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(queryKey, ctx.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  return { ...query, savedIds, save, unsave }
}
