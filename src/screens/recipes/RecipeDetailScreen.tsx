import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useState, useCallback, useRef } from 'react'
import { Chip } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { recipeImage, type Recipe } from '@/hooks/useRecipes'

// ── Icons ─────────────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function HeartIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth="2"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function LeafIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-b-pill bg-b-ink px-4 py-2.5 shadow-lg">
      <span className="text-white"><CheckIcon /></span>
      <span className="whitespace-nowrap text-[13px] font-semibold text-white">{message}</span>
    </div>
  )
}

// ── RecipeDetailScreen ────────────────────────────────────────────────────────

export function RecipeDetailScreen() {
  const { recipeId } = useParams<{ recipeId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [isFaved, setIsFaved] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(null), 2000)
  }, [])

  // Read from TanStack Query cache — no extra fetch needed
  const allRecipes = queryClient.getQueryData<Recipe[]>(['recipes', user?.id])
  const recipe = allRecipes?.find(r => r.id === recipeId)

  if (!recipe) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-b-bg px-6 text-center">
        <p className="text-[32px]">🌿</p>
        <p className="text-[15px] font-bold text-b-ink">Recipe not found</p>
        <button
          onClick={() => navigate('/recipes')}
          className="mt-2 text-[13px] font-bold text-b-accent active:opacity-70"
        >
          ← Back to Recipes
        </button>
      </div>
    )
  }

  const heroUrl = recipeImage(
    recipe.image.includes('photo-') ? recipe.image.split('photo-')[1].split('?')[0].replace(/^/, 'x') : 'bowl',
    800
  ).replace(/w=\d+/, 'w=800')

  return (
    <div className="flex h-full flex-col bg-b-bg">
      {toast && <Toast message={toast} />}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">

        {/* Hero image with back button overlay */}
        <div className="relative h-64 w-full shrink-0">
          <img
            src={recipe.image.replace(/w=\d+/, 'w=800')}
            alt={recipe.name}
            className="h-full w-full object-cover"
          />
          {/* Gradient scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute left-4 top-safe-top mt-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-b-ink shadow-b-card active:opacity-70"
            aria-label="Go back"
          >
            <BackIcon />
          </button>

          {/* Save button */}
          <button
            onClick={() => {
              setIsFaved(v => !v)
              showToast(isFaved ? 'Removed from saved' : 'Recipe saved!')
            }}
            className="absolute right-4 top-safe-top mt-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 shadow-b-card transition-transform active:scale-90"
            style={{ color: 'var(--b-coral)' }}
            aria-label={isFaved ? 'Remove from saved' : 'Save recipe'}
          >
            <HeartIcon filled={isFaved} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 pb-32 pt-5">

          {/* Title & quick stats */}
          <h1 className="font-display text-[22px] font-bold leading-tight text-b-ink">
            {recipe.name}
          </h1>

          <div className="mt-3 flex items-center gap-4 text-[13px] font-semibold text-b-ink-2">
            <span className="flex items-center gap-1.5">
              <span className="text-b-ink-3"><ClockIcon /></span>
              {recipe.timeMin} min
            </span>
            <span className="h-1 w-1 rounded-full bg-b-ink-4" />
            <span>🔥 {recipe.kcal} kcal</span>
            <span className="h-1 w-1 rounded-full bg-b-ink-4" />
            <span>P {recipe.protein_g}g</span>
          </div>

          {/* Macro chips */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {recipe.tags.includes('low-gl') && (
              <Chip size="sm" tone="mint" icon={<LeafIcon />}>Low GL · {recipe.gl}</Chip>
            )}
            {recipe.tags.includes('high-protein') && (
              <Chip size="sm" tone="primary">High protein</Chip>
            )}
            {recipe.tags.includes('high-fiber') && (
              <Chip size="sm" tone="amber">High fiber · {recipe.fiber_g}g</Chip>
            )}
            {recipe.tags.includes('anti-inflam') && (
              <Chip size="sm" tone="accent">Anti-inflam</Chip>
            )}
            {recipe.tags.includes('quick') && (
              <Chip size="sm" tone="neutral">Quick</Chip>
            )}
          </div>

          {/* Nutrition bar */}
          <div className="mt-4 flex overflow-hidden rounded-xl bg-b-surface border border-b-hairline">
            {[
              { label: 'Calories', value: `${recipe.kcal}`, unit: 'kcal', color: 'var(--b-amber)' },
              { label: 'Protein',  value: `${recipe.protein_g}`, unit: 'g', color: 'var(--b-protein)' },
              { label: 'Fiber',    value: `${recipe.fiber_g}`,   unit: 'g', color: 'var(--b-fiber)' },
              { label: 'GL',       value: `${recipe.gl}`,        unit: '',  color: 'var(--b-mint)' },
            ].map((m, i) => (
              <div
                key={m.label}
                className={`flex flex-1 flex-col items-center py-3 ${i > 0 ? 'border-l border-b-hairline' : ''}`}
              >
                <span className="text-[18px] font-bold tabular-nums" style={{ color: m.color }}>
                  {m.value}<span className="text-[11px] font-semibold">{m.unit}</span>
                </span>
                <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-b-ink-3">
                  {m.label}
                </span>
              </div>
            ))}
          </div>

          {/* Ingredients */}
          {recipe.ingredients.length > 0 && (
            <div className="mt-6">
              <h2 className="text-[17px] font-bold text-b-ink">Ingredients</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ background: 'var(--b-primary)' }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-[14px] leading-snug text-b-ink-2">{ing}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Instructions */}
          {recipe.instructions.length > 0 && (
            <div className="mt-6">
              <h2 className="text-[17px] font-bold text-b-ink">Instructions</h2>
              <ol className="mt-3 flex flex-col gap-4">
                {recipe.instructions.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
                      style={{ background: 'var(--b-primary)' }}
                    >
                      {i + 1}
                    </span>
                    <p className="flex-1 pt-0.5 text-[14px] leading-relaxed text-b-ink-2">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

        </div>
      </div>

      {/* Sticky bottom CTA */}
      <div className="shrink-0 border-t border-b-hairline bg-b-surface px-5 pb-safe pt-3">
        <button
          onClick={() => showToast('Recipe added to your plan!')}
          className="w-full rounded-b-pill bg-b-primary py-3.5 text-[15px] font-bold text-white transition-opacity active:opacity-80"
        >
          + Add to today's plan
        </button>
      </div>
    </div>
  )
}
