import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1'
// USDA_API_KEY set in Supabase Edge Function secrets. Falls back to DEMO_KEY for dev.
const USDA_KEY = Deno.env.get('USDA_API_KEY') ?? 'DEMO_KEY'

const NUTRIENT_IDS = {
  KCAL: [1008, 2047, 2048],
  PROTEIN: [1003],
  FAT: [1004],
  CARBS: [1005],
  FIBER: [1079],
  SUGAR: [2000],
}

function getNutrient(nutrients: unknown[], ids: number[]): number | null {
  for (const n of nutrients as Record<string, unknown>[]) {
    // Search result format: { nutrientId, value }
    const nId = Number(n['nutrientId'] ?? (n['nutrient'] as Record<string, unknown>)?.['id'])
    if (ids.includes(nId)) {
      const v = Number(n['value'] ?? n['amount'])
      return isNaN(v) ? null : Math.round(v * 100) / 100
    }
  }
  return null
}

function parseFood(f: Record<string, unknown>) {
  const nutrients = (f['foodNutrients'] as unknown[]) ?? []
  return {
    fdc_id: String(f['fdcId']),
    description: String(f['description'] ?? ''),
    data_type: (f['dataType'] as string) ?? null,
    brand_owner: (f['brandOwner'] as string) ?? null,
    gtin_upc: (f['gtinUpc'] as string) ?? null,
    kcal_per_100g: getNutrient(nutrients, NUTRIENT_IDS.KCAL),
    protein_g_per_100g: getNutrient(nutrients, NUTRIENT_IDS.PROTEIN),
    carbs_g_per_100g: getNutrient(nutrients, NUTRIENT_IDS.CARBS),
    fat_g_per_100g: getNutrient(nutrients, NUTRIENT_IDS.FAT),
    fiber_g_per_100g: getNutrient(nutrients, NUTRIENT_IDS.FIBER),
    sugar_g_per_100g: getNutrient(nutrients, NUTRIENT_IDS.SUGAR),
    raw_nutrients: nutrients,
    fetched_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  }
}

// verify_jwt: false — JWT verified manually below so OPTIONS preflight can return 200
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' }

  // Verify caller JWT
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: jsonHeaders })
  }
  const supabaseUser = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )
  const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: jsonHeaders })
  }

  try {
    const body = await req.json() as Record<string, unknown>
    const query = body['query'] as string | undefined
    const fdcId = body['fdcId'] as string | undefined

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ── Single food lookup ─────────────────────────────────────────────────
    if (fdcId) {
      // Check cache first
      const { data: cached } = await admin
        .from('usda_foods')
        .select('*')
        .eq('fdc_id', fdcId)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

      if (cached) {
        return new Response(JSON.stringify({ food: cached }), {
          headers: jsonHeaders,
        })
      }

      const res = await fetch(`${USDA_BASE}/food/${fdcId}?api_key=${USDA_KEY}`)
      if (!res.ok) throw new Error(`USDA ${res.status}`)

      const raw = await res.json() as Record<string, unknown>
      const food = parseFood(raw)

      // Cache it (fire-and-forget)
      admin.from('usda_foods').upsert(food, { onConflict: 'fdc_id' }).then(() => {})

      return new Response(JSON.stringify({ food }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // ── Food search ────────────────────────────────────────────────────────
    if (!query || query.trim().length < 2) {
      return new Response(JSON.stringify({ foods: [] }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const url =
      `${USDA_BASE}/foods/search` +
      `?query=${encodeURIComponent(query.trim())}` +
      `&pageSize=15` +
      `&dataType=Foundation,SR%20Legacy,Branded` +
      `&api_key=${USDA_KEY}`

    const res = await fetch(url)
    if (!res.ok) throw new Error(`USDA ${res.status}`)

    const data = await res.json() as Record<string, unknown>
    const foods = ((data['foods'] as unknown[]) ?? []).map((f) =>
      parseFood(f as Record<string, unknown>)
    )

    // Cache search results (fire-and-forget)
    if (foods.length > 0) {
      admin.from('usda_foods').upsert(foods, { onConflict: 'fdc_id' }).then(() => {})
    }

    return new Response(JSON.stringify({ foods }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
