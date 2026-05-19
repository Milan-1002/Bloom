import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

export type Recipe = {
  id: string
  name: string
  image: string
  timeMin: number
  kcal: number
  protein_g: number
  fiber_g: number
  carbs_g: number
  gl: number
  tags: string[]
}

// Verified Unsplash photo IDs per recipe category
const PHOTO_BY_CATEGORY: Record<string, string> = {
  bowl:      '1512621776951-a57141f2eefd',
  salmon:    '1546069901-ba9599a7e63c',
  eggs:      '1482049016688-2d3e1b311543',
  soup:      '1547592180-85f173990554',
  salad:     '1540420773420-3366772f4999',
  stir_fry:  '1547592166-23ac45744acd',
  toast:     '1525351484163-7529414344d8',
  legumes:   '1512621776951-a57141f2eefd',
  chicken:   '1598515214211-89d3c73ae83b',
  pasta_alt: '1455619452474-d2be8b1e70cd',
}
const FALLBACK_PHOTO = '1546069901-ba9599a7e63c'

function recipeImage(category: string, width = 480): string {
  const id = PHOTO_BY_CATEGORY[category] ?? FALLBACK_PHOTO
  return `https://images.unsplash.com/photo-${id}?w=${width}&q=80&auto=format&fit=crop`
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
}

function toRecipe(raw: RawRecipe, index: number): Recipe {
  return {
    id: `r-${index}`,
    name: raw.name,
    image: recipeImage(raw.category),
    timeMin: raw.timeMin,
    kcal: raw.kcal,
    protein_g: raw.protein_g,
    fiber_g: raw.fiber_g,
    carbs_g: raw.carbs_g ?? 0,
    gl: raw.gl,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
  }
}

export function useRecipes() {
  const { user } = useAuth()

  return useQuery<Recipe[]>({
    queryKey: ['recipes', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase.functions.invoke<{ recipes: RawRecipe[] }>('generate-recipes')
      if (error || !data?.recipes) return []
      return data.recipes.map(toRecipe)
    },
    enabled: !!user?.id,
    staleTime: 24 * 60 * 60 * 1000,
    retry: false,
  })
}
