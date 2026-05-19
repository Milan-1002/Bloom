import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk'

const CACHE_HOURS = 24

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `You are a PCOS nutrition specialist. Generate realistic, home-cookable recipe suggestions for a woman with PCOS.

STRICT PROHIBITIONS:
- Never recommend specific supplements, vitamins, or herbs with dosages
- Never suggest anything requiring a healthcare provider
- Frame all recipes as supportive nutrition, not medical treatment

OUTPUT FORMAT — return ONLY a valid JSON object, no prose, no markdown:
{
  "recipes": [
    {
      "name": "<recipe name, max 55 chars>",
      "category": "<one of: bowl, salmon, eggs, soup, salad, stir_fry, toast, legumes, chicken, pasta_alt>",
      "timeMin": <integer 5–60>,
      "kcal": <integer 200–750>,
      "protein_g": <integer 5–55>,
      "fiber_g": <integer 1–22>,
      "carbs_g": <integer 5–75>,
      "gl": <integer 1–50>,
      "tags": [<zero or more of: "low-gl", "high-protein", "high-fiber", "anti-inflam", "quick">]
    }
  ]
}

TAGGING RULES — apply strictly based on the values you set:
- "low-gl": gl <= 10
- "high-protein": protein_g >= 25
- "high-fiber": fiber_g >= 8
- "anti-inflam": recipe features salmon, sardines, turmeric, ginger, berries, dark leafy greens, or olive oil as primary ingredients
- "quick": timeMin <= 30

CATEGORY GUIDE (pick the most fitting):
- bowl: grain bowls, buddha bowls, quinoa bowls
- salmon: any salmon dish
- eggs: shakshuka, omelette, frittata, egg-based
- soup: soups, stews, broths
- salad: leafy salads, grain salads
- stir_fry: stir-fries, sautéed dishes, pan dishes
- toast: avocado toast, open-faced sandwiches
- legumes: lentils, chickpeas, beans as hero ingredient
- chicken: chicken-based dishes
- pasta_alt: courgetti, shirataki, hearts of palm pasta`

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

    // Fetch profile + check cache in parallel
    const cacheThreshold = new Date(Date.now() - CACHE_HOURS * 60 * 60 * 1000).toISOString()
    const [profileRes, cacheRes] = await Promise.all([
      supabaseUser
        .from('profiles')
        .select('pcos_type, goals')
        .eq('id', user.id)
        .single(),
      supabaseUser
        .from('recipe_suggestions')
        .select('recipes, generated_at')
        .eq('user_id', user.id)
        .gte('generated_at', cacheThreshold)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    // Return cached if fresh
    if (cacheRes.data?.recipes) {
      return new Response(
        JSON.stringify({ recipes: cacheRes.data.recipes, source: 'cache' }),
        { headers: jsonHeaders }
      )
    }

    const profile = profileRes.data

    // Generate with Claude
    const userPrompt = [
      `PCOS type: ${profile?.pcos_type ?? 'not specified'}`,
      `Goals: ${profile?.goals?.length ? (profile.goals as string[]).join(', ') : 'general hormonal health'}`,
      '',
      'Generate exactly 12 PCOS-friendly recipes that support insulin balance and hormonal health.',
      'Include a variety of meal types: at least 2 bowls, 2 egg-based, 2 salads, 2 soups or stews, 2 stir-fries or pan dishes, and 2 others.',
      'Ensure tags correctly reflect the nutritional values you set — do not add a tag if the value does not meet the threshold.',
    ].join('\n')

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      temperature: 0.7,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    if (!text) throw new Error('empty_response')

    // Strip markdown code fences if present
    let jsonText = text.trim()
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\r?\n?/, '').replace(/\r?\n?```$/, '').trim()
    }

    const parsed = JSON.parse(jsonText) as { recipes: RawRecipe[] }
    if (!Array.isArray(parsed.recipes) || parsed.recipes.length === 0) {
      throw new Error('invalid_recipes_response')
    }

    const recipes = parsed.recipes.slice(0, 12)
    const generated_at = new Date().toISOString()

    // Store — fire and forget, don't block response
    supabaseUser.from('recipe_suggestions').insert({ user_id: user.id, recipes, generated_at })

    return new Response(
      JSON.stringify({ recipes, source: 'generated' }),
      { headers: jsonHeaders }
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message.slice(0, 200) : String(err).slice(0, 200)
    console.error('generate-recipes error:', msg)
    return new Response(
      JSON.stringify({ error: 'generation_failed', message: msg }),
      { status: 500, headers: jsonHeaders }
    )
  }
})
