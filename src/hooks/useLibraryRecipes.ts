import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { type Recipe, recipeImage } from '@/hooks/useRecipes'

// ── DB row type from library_recipes table ────────────────────────────────────

type DBLibraryRecipe = {
  id: string
  name: string
  category: string
  time_min: number
  kcal: number
  protein_g: number
  fiber_g: number
  carbs_g: number
  gl: number
  tags: string[]
  ingredients: string[]
  instructions: string[]
}

function mapLibraryRecipe(r: DBLibraryRecipe): Recipe {
  return {
    id: `lib-${r.id}`,
    name: r.name,
    image: recipeImage(r.category),
    timeMin: r.time_min,
    kcal: r.kcal,
    protein_g: r.protein_g,
    fiber_g: r.fiber_g,
    carbs_g: r.carbs_g,
    gl: r.gl,
    tags: r.tags ?? [],
    ingredients: r.ingredients ?? [],
    instructions: r.instructions ?? [],
  }
}

// ── hook ──────────────────────────────────────────────────────────────────────

/**
 * Loads the pre-seeded PCOS recipe library from Supabase.
 * Much faster than generate-recipes because it's a simple SELECT with no Claude call.
 * Cached for 7 days — recipes rarely change.
 */
export function useLibraryRecipes() {
  const { user } = useAuth()

  return useQuery<Recipe[]>({
    queryKey: ['library-recipes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('library_recipes')
        .select('*')
        .order('name')
      if (error) throw error
      return (data as DBLibraryRecipe[]).map(mapLibraryRecipe)
    },
    enabled: !!user?.id,
    staleTime: 7 * 24 * 60 * 60 * 1000,  // 7 days
    gcTime:    7 * 24 * 60 * 60 * 1000,
  })
}
