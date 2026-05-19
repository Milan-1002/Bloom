// Requires ANTHROPIC_API_KEY secret: supabase secrets set ANTHROPIC_API_KEY=<key>
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk'

const PROMPT_VERSION = 1

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── System Prompt ──────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a PCOS nutrition specialist AI. Your role is to generate daily macro targets that support insulin balance for a woman with PCOS.

STRICT PROHIBITIONS — you must NEVER:
- Provide a medical diagnosis or suggest the user has any condition beyond what is stated
- Recommend specific supplements, vitamins, or herbs with dosages (e.g., "take 2g inositol/day")
- Give advice about drug interactions or how food interacts with medications
- Suggest anything that requires evaluation by a healthcare provider
- Use deficit or restriction framing ("eat less", "reduce intake", "you are consuming too much")
- Make weight loss promises or claims

FRAMING RULES:
- Frame all targets as adequacy and support ("aim for at least", "supports stable energy")
- The Insulin Balance score reflects how well these targets support insulin sensitivity for this profile
- Targets are nutritional guidance, not medical advice

OUTPUT FORMAT — return ONLY a valid JSON object with exactly these 10 fields, no prose, no markdown:
{
  "protein_g": <integer 40–300>,
  "fiber_g": <integer 15–80>,
  "gl_target": <integer 40–200>,
  "added_sugar_g": <integer 10–60>,
  "calorie_min": <integer 1200–2500>,
  "calorie_max": <integer 1400–3000>,
  "pc_ratio_target": <float 0.15–0.60>,
  "insulin_score": <integer 0–100>,
  "narrative": "<1–2 sentences of plain-language explanation, under 300 characters>",
  "key_factors": ["<factor_1>", "<factor_2>"]
}

EXAMPLE OUTPUT (confirmed PCOS, insulin resistance type, weight loss goal):
{
  "protein_g": 125,
  "fiber_g": 32,
  "gl_target": 90,
  "added_sugar_g": 20,
  "calorie_min": 1550,
  "calorie_max": 1800,
  "pc_ratio_target": 0.35,
  "insulin_score": 74,
  "narrative": "These targets support steady insulin levels through high protein and controlled glycemic load. Prioritising fiber and protein at each meal helps reduce post-meal glucose spikes.",
  "key_factors": ["insulin_resistance_type", "weight_loss_goal", "high_protein_priority"]
}

BIOLOGICAL CONSTRAINTS you must respect:
- protein_g must be >= 90 for any weight loss goal profile
- calorie_min must never be below 1200 under any circumstances
- calorie_max - calorie_min must be at least 200
- fiber_g must be >= 25 for any PCOS profile with insulin resistance
- gl_target for weight management: 80–110; for maintenance: up to 130`

// ── Types ─────────────────────────────────────────────────────────────────
interface AITargetsOutput {
  protein_g: number
  fiber_g: number
  gl_target: number
  added_sugar_g: number
  calorie_min: number
  calorie_max: number
  pc_ratio_target: number
  insulin_score: number
  narrative: string
  key_factors: string[]
}

type ProfileRow = {
  pcos_type: string | null
  goals: string[] | null
  age: number | null
  height_cm: number | null
  current_weight_kg: number | null
  goal_weight_kg: number | null
}

// ── Pure Functions (inlined — Deno cannot import from src/) ───────────────
function assertRange(name: string, val: number, min: number, max: number): void {
  if (typeof val !== 'number' || isNaN(val) || !isFinite(val) || val < min || val > max) {
    throw new Error(`${name} out of range: ${val} (expected ${min}–${max})`)
  }
}

function validateTargets(raw: unknown): AITargetsOutput {
  if (typeof raw !== 'object' || raw === null) throw new Error('not_object')
  const r = raw as Record<string, unknown>

  assertRange('protein_g',       Number(r.protein_g),       40,   300)
  assertRange('fiber_g',         Number(r.fiber_g),         15,   80)
  assertRange('gl_target',       Number(r.gl_target),       40,   200)
  assertRange('added_sugar_g',   Number(r.added_sugar_g),   10,   60)
  assertRange('calorie_min',     Number(r.calorie_min),     1200, 2500)
  assertRange('calorie_max',     Number(r.calorie_max),     1400, 3000)
  assertRange('pc_ratio_target', Number(r.pc_ratio_target), 0.15, 0.60)
  assertRange('insulin_score',   Number(r.insulin_score),   0,    100)

  if (Number(r.calorie_min) >= Number(r.calorie_max)) {
    throw new Error('calorie_min must be less than calorie_max')
  }
  if (Number(r.calorie_max) - Number(r.calorie_min) < 200) {
    throw new Error('calorie range too narrow (must be >= 200)')
  }
  if (typeof r.narrative !== 'string' || r.narrative.trim().length === 0) {
    throw new Error('narrative_empty')
  }
  if (r.narrative.length > 300) throw new Error('narrative_too_long')
  if (!Array.isArray(r.key_factors) || r.key_factors.length === 0) {
    throw new Error('key_factors_empty')
  }

  return r as unknown as AITargetsOutput
}

const FORBIDDEN_PATTERNS = [
  /diagnos/i,
  /mg\/day/i,
  /prescri/i,
  /[Mm]etformin/,
  /dosage/i,
]

function checkForbidden(text: string): void {
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(text)) throw new Error(`forbidden:${pattern.source}`)
  }
}

function buildUserPrompt(profile: ProfileRow): string {
  const lines = [
    `PCOS type: ${profile.pcos_type ?? 'not specified'}`,
    `Age: ${profile.age ?? 'not specified'}`,
    `Height: ${profile.height_cm ? profile.height_cm + ' cm' : 'not specified'}`,
    `Current weight: ${profile.current_weight_kg ? profile.current_weight_kg + ' kg' : 'not specified'}`,
    `Goal weight: ${profile.goal_weight_kg ? profile.goal_weight_kg + ' kg' : 'not specified (maintenance)'}`,
    `Goals: ${profile.goals && profile.goals.length > 0 ? profile.goals.join(', ') : 'not specified'}`,
  ]
  return lines.join('\n') + '\n\nGenerate daily macro targets for this user.'
}

// ── Anthropic Client ──────────────────────────────────────────────────────
const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })

// ── Handler ───────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' }

  try {
    // 1. Verify JWT
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

    // 2. Fetch profile (user_id never enters the Claude prompt — GDPR)
    const { data: profile, error: profileError } = await supabaseUser
      .from('profiles')
      .select('pcos_type, goals, age, height_cm, current_weight_kg, goal_weight_kg')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !profile.pcos_type) {
      return new Response(JSON.stringify({ error: 'profile_required' }), { status: 400, headers: jsonHeaders })
    }

    // 3. Call Claude
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(profile as ProfileRow) }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    if (!text) throw new Error('empty_response')

    // 4. Guardrail (before JSON.parse), then parse, then validate
    checkForbidden(text)
    let parsed: unknown
    try {
      // Strip markdown code fences if model wraps JSON in ```json ... ```
      let jsonText = text.trim()
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```(?:json)?\r?\n?/, '').replace(/\r?\n?```$/, '').trim()
      }
      parsed = JSON.parse(jsonText)
    } catch {
      throw new Error('json_parse_failed')
    }
    const targets = validateTargets(parsed)

    // 5. Insert to DB using user JWT (RLS enforces user_id ownership)
    const generated_at = new Date().toISOString()
    const { error: insertError } = await supabaseUser.from('ai_daily_targets').insert({
      user_id:             user.id,
      protein_g:           Number(targets.protein_g),
      fiber_g:             Number(targets.fiber_g),
      gl_target:           Number(targets.gl_target),
      added_sugar_g:       Number(targets.added_sugar_g),
      calorie_min:         Number(targets.calorie_min),
      calorie_max:         Number(targets.calorie_max),
      pc_ratio_target:     Number(targets.pc_ratio_target),
      insulin_score:       Number(targets.insulin_score),
      insulin_score_basis: { key_factors: targets.key_factors },
      narrative:           String(targets.narrative),
      prompt_version:      PROMPT_VERSION,
      generated_at,
    })
    if (insertError) throw new Error(`insert_failed: ${insertError.message}`)

    // 6. Return response (key_factors excluded; generated_at included)
    return new Response(JSON.stringify({
      protein_g:       Number(targets.protein_g),
      fiber_g:         Number(targets.fiber_g),
      gl_target:       Number(targets.gl_target),
      added_sugar_g:   Number(targets.added_sugar_g),
      calorie_min:     Number(targets.calorie_min),
      calorie_max:     Number(targets.calorie_max),
      pc_ratio_target: Number(targets.pc_ratio_target),
      insulin_score:   Number(targets.insulin_score),
      narrative:       String(targets.narrative),
      generated_at,
    }), { headers: jsonHeaders })

  } catch (err) {
    const msg = err instanceof Error ? err.message.slice(0, 200) : String(err).slice(0, 200)
    console.error('generate-targets error:', msg)
    return new Response(JSON.stringify({ error: 'generation_failed', message: msg }), { status: 500, headers: jsonHeaders })
  }
})
