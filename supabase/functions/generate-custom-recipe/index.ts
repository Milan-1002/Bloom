import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `You are a PCOS nutrition specialist. Generate ONE realistic, home-cookable recipe for a woman with PCOS.

STRICT PROHIBITIONS:
- Never recommend specific supplements, vitamins, or herbs with dosages
- Never suggest anything requiring a healthcare provider
- Frame the recipe as supportive nutrition, not medical treatment

OUTPUT FORMAT — return ONLY a valid JSON object, no prose, no markdown:
{
  "name": "<recipe name, max 55 chars>",
  "category": "<one of: bowl, salmon, eggs, soup, salad, stir_fry, toast, legumes, chicken, pasta_alt>",
  "timeMin": <integer 5–60>,
  "kcal": <integer 200–750>,
  "protein_g": <integer 5–55>,
  "fiber_g": <integer 1–22>,
  "carbs_g": <integer 5–75>,
  "gl": <integer 1–50>,
  "tags": [<zero or more of: "low-gl", "high-protein", "high-fiber", "anti-inflam", "quick">],
  "ingredients": ["<quantity + ingredient>", ...],
  "instructions": ["<full step text>", ...]
}

TAGGING RULES — apply strictly:
- "low-gl": gl <= 10
- "high-protein": protein_g >= 25
- "high-fiber": fiber_g >= 8
- "anti-inflam": recipe features salmon, sardines, turmeric, ginger, berries, dark leafy greens, or olive oil as primary ingredients
- "quick": timeMin <= 30

INGREDIENTS: 6–10 items, each as "<quantity> <ingredient>"
INSTRUCTIONS: 4–7 clear steps in plain English, each step one or two sentences.`

interface RawRecipe {
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

interface FoodLog {
  food_name: string
  protein_g: number | null
  fiber_g: number | null
  carbs_g: number | null
  kcal: number | null
  logged_at: string
}

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' }

  try {
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

    // Parse request body
    const body = await req.json().catch(() => ({})) as {
      mode?: 'profile' | 'fridge'
      ingredients?: string[]
    }

    const mode = body.mode ?? 'profile'
    const fridgeIngredients: string[] = Array.isArray(body.ingredients) ? body.ingredients : []

    // For 'profile' mode: fetch user profile + recent food logs
    let userPrompt: string

    if (mode === 'fridge') {
      if (fridgeIngredients.length === 0) {
        return new Response(
          JSON.stringify({ error: 'no_ingredients', message: 'Provide at least one ingredient' }),
          { status: 400, headers: jsonHeaders }
        )
      }

      userPrompt = [
        `I have these ingredients available: ${fridgeIngredients.join(', ')}.`,
        '',
        'Generate ONE PCOS-friendly recipe that uses primarily these ingredients.',
        'You may add up to 3 pantry staples (olive oil, garlic, salt, pepper, herbs, lemon, vinegar) if needed.',
        'Do NOT use any other ingredients not on the list or in the pantry staples.',
        'Focus on insulin balance, low glycemic load, and anti-inflammatory properties where possible.',
      ].join('\n')

    } else {
      // profile mode — fetch context in parallel
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      const [profileRes, logsRes] = await Promise.all([
        supabaseUser
          .from('profiles')
          .select('pcos_type, goals, current_weight_kg, goal_weight_kg')
          .eq('id', user.id)
          .single(),
        supabaseUser
          .from('food_logs')
          .select('food_name, protein_g, fiber_g, carbs_g, kcal, logged_at')
          .eq('user_id', user.id)
          .gte('logged_at', sevenDaysAgo)
          .order('logged_at', { ascending: false })
          .limit(20),
      ])

      const profile = profileRes.data
      const logs: FoodLog[] = logsRes.data ?? []

      // Summarise recent eating patterns
      let nutritionContext = 'No recent food logs available.'
      if (logs.length > 0) {
        const avgProtein = Math.round(logs.reduce((s, l) => s + (l.protein_g ?? 0), 0) / logs.length)
        const avgFiber = Math.round(logs.reduce((s, l) => s + (l.fiber_g ?? 0), 0) / logs.length)
        const recentFoods = [...new Set(logs.slice(0, 8).map(l => l.food_name))].join(', ')
        nutritionContext = `Avg protein per meal: ${avgProtein}g | Avg fiber per meal: ${avgFiber}g | Recent foods: ${recentFoods}`
      }

      userPrompt = [
        `PCOS type: ${profile?.pcos_type ?? 'not specified'}`,
        `Goals: ${profile?.goals?.length ? (profile.goals as string[]).join(', ') : 'general hormonal health'}`,
        `Recent nutrition: ${nutritionContext}`,
        '',
        'Generate ONE personalised PCOS-friendly recipe that:',
        '- Complements the user\'s recent eating patterns (fill nutritional gaps if visible)',
        '- Supports insulin balance and hormonal health',
        '- Is practical to cook at home today',
        '- Has high protein (≥25g) or high fiber (≥8g) if the recent logs show a gap',
      ].join('\n')
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      temperature: 0.8,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    if (!text) throw new Error('empty_response')

    let jsonText = text.trim()
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\r?\n?/, '').replace(/\r?\n?```$/, '').trim()
    }

    const recipe = JSON.parse(jsonText) as RawRecipe

    if (!recipe.name || !Array.isArray(recipe.ingredients)) {
      throw new Error('invalid_recipe_response')
    }

    return new Response(
      JSON.stringify({ recipe, source: mode }),
      { headers: jsonHeaders }
    )

  } catch (err) {
    const msg = err instanceof Error ? err.message.slice(0, 200) : String(err).slice(0, 200)
    console.error('generate-custom-recipe error:', msg)
    return new Response(
      JSON.stringify({ error: 'generation_failed', message: msg }),
      { status: 500, headers: jsonHeaders }
    )
  }
})
