import { supabase } from '@/lib/supabase'

export interface USDAFood {
  fdc_id: string
  description: string
  data_type: string | null
  brand_owner: string | null
  gtin_upc: string | null
  kcal_per_100g: number | null
  protein_g_per_100g: number | null
  carbs_g_per_100g: number | null
  fat_g_per_100g: number | null
  fiber_g_per_100g: number | null
  sugar_g_per_100g: number | null
}

export async function searchFoods(query: string): Promise<USDAFood[]> {
  const { data, error } = await supabase.functions.invoke('usda-search', {
    body: { query },
  })
  if (error) throw error
  return (data as { foods: USDAFood[] }).foods ?? []
}

export async function getFoodByFdcId(fdcId: string): Promise<USDAFood> {
  // Check local cache first (authenticated SELECT is allowed)
  const { data: cached } = await supabase
    .from('usda_foods')
    .select('*')
    .eq('fdc_id', fdcId)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (cached) return cached as USDAFood

  const { data, error } = await supabase.functions.invoke('usda-search', {
    body: { fdcId },
  })
  if (error) throw error
  return (data as { food: USDAFood }).food
}

export async function getFoodByBarcode(gtin: string): Promise<USDAFood | null> {
  const { data } = await supabase
    .from('usda_foods')
    .select('*')
    .eq('gtin_upc', gtin)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  return (data as USDAFood | null)
}

/** Scale macros from per-100g to a given serving size */
export function scaleMacros(food: USDAFood, servingG: number) {
  const scale = servingG / 100
  return {
    kcal: food.kcal_per_100g != null ? Math.round(food.kcal_per_100g * scale) : null,
    protein_g: food.protein_g_per_100g != null ? Math.round(food.protein_g_per_100g * scale * 10) / 10 : null,
    carbs_g: food.carbs_g_per_100g != null ? Math.round(food.carbs_g_per_100g * scale * 10) / 10 : null,
    fat_g: food.fat_g_per_100g != null ? Math.round(food.fat_g_per_100g * scale * 10) / 10 : null,
    fiber_g: food.fiber_g_per_100g != null ? Math.round(food.fiber_g_per_100g * scale * 10) / 10 : null,
    sugar_g: food.sugar_g_per_100g != null ? Math.round(food.sugar_g_per_100g * scale * 10) / 10 : null,
  }
}
