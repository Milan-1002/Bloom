import { useRef, useState, useCallback, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AppBar, Card, Chip } from '@/components/ui'
import { type Recipe } from '@/hooks/useRecipes'
import { useLibraryRecipes } from '@/hooks/useLibraryRecipes'
import { useSavedRecipes, type RecipeSource } from '@/hooks/useSavedRecipes'
import { useGenerateCustomRecipe } from '@/hooks/useGenerateCustomRecipe'
import { GeneratingOverlay } from './GeneratingOverlay'
import { FridgeModal } from './FridgeModal'

// ── Filter types ───────────────────────────────────────────────────────────────

type Filter = 'All' | 'Low GL' | 'High protein' | 'High fiber' | 'Anti-inflam' | 'Under 30 min'
const FILTERS: Filter[] = ['All', 'Low GL', 'High protein', 'High fiber', 'Anti-inflam', 'Under 30 min']

const FILTER_TAG: Record<Filter, string | null> = {
  'All':          null,
  'Low GL':       'low-gl',
  'High protein': 'high-protein',
  'High fiber':   'high-fiber',
  'Anti-inflam':  'anti-inflam',
  'Under 30 min': 'quick',
}

function matchesFilter(r: Recipe, f: Filter): boolean {
  const tag = FILTER_TAG[f]
  return tag === null || r.tags.includes(tag)
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function HeartIcon({ filled = false, size = 18 }: { filled?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth="2"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function FilterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="11" y1="18" x2="13" y2="18" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
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

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.4 2.4-7.4L2 9.4h7.6z" />
    </svg>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-b-pill bg-b-ink px-4 py-2.5 shadow-lg">
      <span className="text-white"><CheckIcon /></span>
      <span className="whitespace-nowrap text-[13px] font-semibold text-white">{message}</span>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-b-surface-sunken ${className ?? ''}`} />
}

function RecipesLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <Skeleton className="mb-3 h-5 w-40" />
        <div className="flex gap-3 overflow-hidden">
          {[0, 1].map(i => (
            <div key={i} className="w-60 shrink-0 overflow-hidden rounded-b-md border border-b-hairline bg-b-surface shadow-b-card">
              <Skeleton className="h-36 w-full rounded-none" />
              <div className="p-3.5 flex flex-col gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <Skeleton className="mb-3 h-5 w-32" />
        <div className="grid grid-cols-2 gap-2.5">
          {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-b-md" />)}
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3 rounded-b-md border border-b-hairline bg-b-surface p-3 shadow-b-card">
            <Skeleton className="h-16 w-16 shrink-0 rounded-xl" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Category Tile ─────────────────────────────────────────────────────────────

function CategoryTile({
  emoji, title, count, bg, accentColor, onClick,
}: {
  emoji: string; title: string; count: number; bg: string; accentColor: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start rounded-b-md p-3.5 text-left transition-opacity active:opacity-75"
      style={{ background: bg }}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-b-surface text-lg shadow-b-card">
        {emoji}
      </div>
      <p className="mt-2.5 text-[13px] font-bold text-b-ink">{title}</p>
      <p className="mt-0.5 text-[11px] font-bold" style={{ color: accentColor }}>
        {count} recipes
      </p>
    </button>
  )
}

// ── AI Chef banner ────────────────────────────────────────────────────────────

function AIChefBanner({
  onProfile,
  onFridge,
  isGenerating,
}: {
  onProfile: () => void
  onFridge: () => void
  isGenerating: boolean
}) {
  return (
    <div
      className="mx-0 overflow-hidden rounded-b-md border border-b-hairline shadow-b-card"
      style={{ background: 'linear-gradient(135deg, var(--b-primary-soft) 0%, var(--b-mint-soft) 100%)' }}
    >
      <div className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <span className="text-[15px]">✨</span>
          <p className="text-[14px] font-bold text-b-ink">AI Chef</p>
          <span className="rounded-b-pill bg-b-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-b-primary">
            Powered by Claude
          </span>
        </div>
        <p className="mt-1 text-[12px] text-b-ink-3">Get a personalised recipe generated just for you</p>

        <div className="mt-3 flex gap-2">
          {/* For my PCOS */}
          <button
            onClick={onProfile}
            disabled={isGenerating}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-b-md bg-b-primary py-2.5 text-[13px] font-bold text-white active:opacity-80 disabled:opacity-50 transition-opacity"
          >
            <SparkleIcon />
            For my PCOS
          </button>

          {/* From my fridge */}
          <button
            onClick={onFridge}
            disabled={isGenerating}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-b-md border border-b-primary bg-white py-2.5 text-[13px] font-bold text-b-primary active:opacity-80 disabled:opacity-50 transition-opacity"
          >
            🥦 My fridge
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Generated Recipe Card (prominent, one-off) ────────────────────────────────

function GeneratedRecipeCard({
  recipe,
  isFaved,
  onFave,
  onAdd,
  onTap,
  mode,
}: {
  recipe: Recipe
  isFaved: boolean
  onFave: () => void
  onAdd: () => void
  onTap: () => void
  mode: 'profile' | 'fridge'
}) {
  return (
    <div className="overflow-hidden rounded-b-md border border-b-primary/30 bg-b-surface shadow-b-card">
      <button onClick={onTap} className="relative block w-full text-left active:opacity-90">
        <img src={recipe.image} alt={recipe.name} className="h-44 w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {/* Badge */}
        <div className="absolute left-3 top-3">
          <span className="inline-flex items-center gap-1.5 rounded-b-pill bg-b-primary px-2.5 py-1 text-[11px] font-bold text-white shadow">
            <SparkleIcon />
            {mode === 'profile' ? 'Made for your PCOS' : 'Made from your fridge'}
          </span>
        </div>
        {/* Heart button */}
        <button
          onClick={e => { e.stopPropagation(); onFave() }}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 transition-transform active:scale-90"
          style={{ color: 'var(--b-coral)' }}
          aria-label={isFaved ? 'Remove from saved' : 'Save recipe'}
        >
          <HeartIcon size={14} filled={isFaved} />
        </button>
        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-[15px] font-bold text-white leading-snug drop-shadow">{recipe.name}</p>
          <div className="mt-1 flex items-center gap-2 text-[11px] font-semibold text-white/90">
            <span>⏱ {recipe.timeMin} min</span>
            <span className="h-1 w-1 rounded-full bg-white/60" />
            <span>🔥 {recipe.kcal} kcal</span>
            <span className="h-1 w-1 rounded-full bg-white/60" />
            <span>P {recipe.protein_g}g</span>
          </div>
        </div>
      </button>
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex flex-wrap gap-1">
          {recipe.tags.includes('low-gl') && (
            <Chip size="sm" tone="mint" icon={<LeafIcon />}>Low GL · {recipe.gl}</Chip>
          )}
          {recipe.tags.includes('high-protein') && (
            <Chip size="sm" tone="primary">High protein</Chip>
          )}
          {recipe.tags.includes('high-fiber') && (
            <Chip size="sm" tone="amber">High fiber</Chip>
          )}
        </div>
        <button
          onClick={onAdd}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-b-primary text-white transition-transform active:scale-90"
          aria-label="Add to plan"
        >
          <PlusIcon />
        </button>
      </div>
    </div>
  )
}

// ── Featured Card ─────────────────────────────────────────────────────────────

function FeaturedCard({
  recipe, isFaved, onFave, onAdd, onTap,
}: {
  recipe: Recipe
  isFaved: boolean
  onFave: () => void
  onAdd: () => void
  onTap: () => void
}) {
  return (
    <button
      onClick={onTap}
      className="w-60 shrink-0 overflow-hidden rounded-b-md border border-b-hairline bg-b-surface shadow-b-card text-left active:opacity-90 transition-opacity"
    >
      <div className="relative">
        <img src={recipe.image} alt={recipe.name} className="h-36 w-full object-cover" />
        <div className="absolute left-2.5 top-2.5">
          <span className="inline-flex items-center gap-1 rounded-b-pill bg-white/90 px-2 py-1 text-[11px] font-semibold text-b-ink shadow-sm">
            <span className="text-[color:var(--b-mint)]"><LeafIcon /></span>
            {recipe.tags.includes('low-gl') ? `Low GL · ${recipe.gl}` : `GL · ${recipe.gl}`}
          </span>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onFave() }}
          className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/85 transition-transform active:scale-90"
          style={{ color: 'var(--b-coral)' }}
          aria-label={isFaved ? 'Remove from saved' : 'Save recipe'}
        >
          <HeartIcon size={14} filled={isFaved} />
        </button>
      </div>
      <div className="p-3.5">
        <p className="text-[13.5px] font-bold leading-snug text-b-ink">{recipe.name}</p>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-b-ink-3">
            <span>⏱ {recipe.timeMin} min</span>
            <span className="h-1 w-1 rounded-full bg-b-ink-4" />
            <span>🔥 {recipe.kcal} kcal</span>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onAdd() }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-b-primary text-white transition-transform active:scale-90"
            aria-label="Add to plan"
          >
            <PlusIcon />
          </button>
        </div>
      </div>
    </button>
  )
}

// ── Recipe List Row ───────────────────────────────────────────────────────────

function RecipeListRow({
  recipe, isFaved, onFave, onAdd, onTap,
}: {
  recipe: Recipe
  isFaved: boolean
  onFave: () => void
  onAdd: () => void
  onTap: () => void
}) {
  return (
    <button onClick={onTap} className="block w-full text-left active:opacity-90 transition-opacity">
      <Card pad="sm" className="flex items-center gap-3">
        <div className="relative shrink-0">
          <img src={recipe.image} alt={recipe.name} className="h-16 w-16 rounded-xl object-cover" />
          <button
            onClick={e => { e.stopPropagation(); onFave() }}
            className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-b-card transition-transform active:scale-90"
            style={{ color: 'var(--b-coral)' }}
            aria-label={isFaved ? 'Remove from saved' : 'Save recipe'}
          >
            <HeartIcon size={11} filled={isFaved} />
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold leading-snug text-b-ink">{recipe.name}</p>
          <div className="mt-1.5 flex items-center gap-2 text-[11px] font-semibold text-b-ink-3">
            <span>⏱ {recipe.timeMin}m</span>
            <span className="h-1 w-1 rounded-full bg-b-ink-4" />
            <span>🔥 {recipe.kcal}</span>
            <span className="h-1 w-1 rounded-full bg-b-ink-4" />
            <span>P {recipe.protein_g}g</span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {recipe.tags.includes('low-gl') && (
              <Chip size="sm" tone="mint" icon={<LeafIcon />}>Low GL</Chip>
            )}
            {recipe.tags.includes('high-protein') && (
              <Chip size="sm" tone="primary">High protein</Chip>
            )}
            {recipe.tags.includes('high-fiber') && (
              <Chip size="sm" tone="amber">High fiber</Chip>
            )}
            {recipe.tags.includes('anti-inflam') && (
              <Chip size="sm" tone="accent">Anti-inflam</Chip>
            )}
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onAdd() }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-b-primary text-white transition-transform active:scale-90"
          aria-label="Add to plan"
        >
          <PlusIcon />
        </button>
      </Card>
    </button>
  )
}

// ── Category grid config ──────────────────────────────────────────────────────

const CATEGORIES: Array<{
  emoji: string; title: string; filter: Filter; bg: string; accentColor: string
}> = [
  { emoji: '🌾', title: 'High fiber',   filter: 'High fiber',   bg: 'var(--b-mint-soft)',    accentColor: 'var(--b-fiber)' },
  { emoji: '💪', title: 'High protein', filter: 'High protein', bg: 'var(--b-primary-soft)', accentColor: 'var(--b-protein)' },
  { emoji: '🍓', title: 'Low glycemic', filter: 'Low GL',       bg: 'var(--b-amber-soft)',   accentColor: 'var(--b-amber)' },
  { emoji: '🩷', title: 'Anti-inflam',  filter: 'Anti-inflam',  bg: 'var(--b-berry-soft)',   accentColor: 'var(--b-berry)' },
]

// ── RecipesScreen ─────────────────────────────────────────────────────────────

export function RecipesScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [activeFilter, setActiveFilter] = useState<Filter>('All')
  const [showFavsOnly, setShowFavsOnly] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [fridgeOpen, setFridgeOpen] = useState(false)
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null)
  const [generatedMode, setGeneratedMode] = useState<'profile' | 'fridge'>('profile')
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // ── Data ───────────────────────────────────────────────────────────────────
  const { data: libraryRecipes = [], isLoading } = useLibraryRecipes()
  const { savedIds, save, unsave, data: savedRows = [] } = useSavedRecipes()
  const generateMutation = useGenerateCustomRecipe()

  // Apply ?phase=luteal filter on mount
  useEffect(() => {
    const phase = searchParams.get('phase')
    if (phase === 'luteal') {
      setActiveFilter('Low GL')
      setShowFavsOnly(false)
    }
  }, [])

  // ── Toast helper ───────────────────────────────────────────────────────────
  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(null), 2000)
  }, [])

  // ── Fave toggle (DB-backed) ────────────────────────────────────────────────
  const toggleFave = useCallback((recipe: Recipe) => {
    if (savedIds.has(recipe.id)) {
      unsave.mutate(recipe.id)
      showToast('Removed from saved')
    } else {
      // Determine source for analytics
      const source: RecipeSource = recipe.id.startsWith('custom-')
        ? generatedMode === 'fridge' ? 'generated_fridge' : 'generated_profile'
        : 'library'
      save.mutate({ recipe, source })
      showToast(`Saved "${recipe.name.split(' ').slice(0, 3).join(' ')}…"`)
    }
  }, [savedIds, save, unsave, showToast, generatedMode])

  const handleAdd = useCallback((name: string) => {
    showToast(`"${name.split(' ').slice(0, 3).join(' ')}…" added to plan`)
  }, [showToast])

  const handleSeeAll = useCallback(() => {
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const handleHeaderHeart = useCallback(() => {
    setShowFavsOnly(prev => {
      if (!prev && savedIds.size === 0) {
        showToast('Save recipes with the ♡ button')
        return false
      }
      return !prev
    })
    setActiveFilter('All')
  }, [savedIds.size, showToast])

  // ── AI generation ──────────────────────────────────────────────────────────
  const handleGenerateProfile = useCallback(() => {
    setGeneratedMode('profile')
    generateMutation.mutate(
      { mode: 'profile' },
      {
        onSuccess: recipe => {
          setGeneratedRecipe(recipe)
          // Auto-persist so the recipe survives page refresh and shows in Saved
          save.mutate({ recipe, source: 'generated_profile' })
          showToast('Your custom recipe is ready! 🎉')
        },
        onError: () => {
          showToast('Generation failed — please try again')
        },
      }
    )
  }, [generateMutation, save, showToast])

  const handleGenerateFridge = useCallback((ingredients: string[]) => {
    setGeneratedMode('fridge')
    generateMutation.mutate(
      { mode: 'fridge', ingredients },
      {
        onSuccess: recipe => {
          setGeneratedRecipe(recipe)
          // Auto-persist so the recipe survives page refresh and shows in Saved
          save.mutate({ recipe, source: 'generated_fridge' })
          showToast('Your fridge recipe is ready! 🥦')
        },
        onError: () => {
          showToast('Generation failed — please try again')
        },
      }
    )
  }, [generateMutation, save, showToast])

  const handleCancelGeneration = useCallback(() => {
    // useMutation doesn't support true abort yet — just dismiss the overlay visually
    // The Edge Function will finish in background but result is discarded
    generateMutation.reset()
  }, [generateMutation])

  // ── Navigate to detail, passing recipe via state ───────────────────────────
  const goToDetail = useCallback((recipe: Recipe) => {
    navigate(`/recipes/${recipe.id}`, { state: { recipe } })
  }, [navigate])

  // ── Filter logic ───────────────────────────────────────────────────────────
  // Pull previously-generated recipes back out of the DB so they survive refresh.
  // Any saved_recipe whose recipe_id starts with "custom-" was AI-generated.
  const savedCustomRecipes = savedRows
    .filter(r => r.recipe_id.startsWith('custom-'))
    .map(r => r.recipe)

  // Build the full recipe pool:
  //   [freshly-generated (in-session) → other saved customs from DB → library]
  // De-duplicate: if the freshly-generated recipe is already in savedCustomRecipes
  // (because auto-save ran), don't show it twice.
  const savedCustomOthers = generatedRecipe
    ? savedCustomRecipes.filter(r => r.id !== generatedRecipe.id)
    : savedCustomRecipes

  const allRecipes: Recipe[] = generatedRecipe
    ? [generatedRecipe, ...savedCustomOthers, ...libraryRecipes]
    : [...savedCustomRecipes, ...libraryRecipes]

  // Favourites view uses savedIds to reconstruct recipes from allRecipes
  let filtered = showFavsOnly
    ? allRecipes.filter(r => savedIds.has(r.id))
    : allRecipes.filter(r => matchesFilter(r, activeFilter))

  const featured = filtered.slice(0, 2)
  const list = filtered.slice(2)
  const totalFiltered = filtered.length

  const isGenerating = generateMutation.isPending

  return (
    <div className="flex h-full flex-col bg-b-bg">
      {toast && <Toast message={toast} />}

      {/* Generating overlay — covers whole screen while Claude works */}
      {isGenerating && <GeneratingOverlay onCancel={handleCancelGeneration} />}

      {/* Fridge modal */}
      <FridgeModal
        isOpen={fridgeOpen}
        onClose={() => setFridgeOpen(false)}
        onGenerate={handleGenerateFridge}
      />

      {/* Header */}
      <AppBar
        big
        subtitle="MY LIBRARY"
        title="Recipes"
        trailing={
          <>
            <button
              onClick={handleHeaderHeart}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-b-hairline bg-b-surface transition-transform active:scale-90"
              style={{ color: showFavsOnly ? 'var(--b-coral)' : undefined }}
              aria-label={showFavsOnly ? 'Show all recipes' : 'Show saved recipes'}
            >
              <HeartIcon filled={showFavsOnly} />
            </button>
            <button
              onClick={() => {
                const idx = FILTERS.indexOf(activeFilter)
                setActiveFilter(FILTERS[(idx + 1) % FILTERS.length])
                setShowFavsOnly(false)
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-b-hairline bg-b-surface text-b-ink-2 transition-transform active:scale-90"
              aria-label="Next filter"
            >
              <FilterIcon />
            </button>
          </>
        }
      />

      {/* Search + filters */}
      <div className="shrink-0 px-4 pb-3 pt-1">
        <div className="flex h-11 items-center gap-2.5 rounded-b-pill border border-b-hairline bg-b-surface px-4 text-b-ink-3">
          <SearchIcon />
          <span className="text-[13px]">
            {isLoading
              ? 'Loading recipes…'
              : showFavsOnly
                ? `${savedIds.size} saved recipe${savedIds.size !== 1 ? 's' : ''}`
                : `Search ${allRecipes.length} recipes…`}
          </span>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5">
          {FILTERS.map(f => (
            <Chip
              key={f}
              tone={activeFilter === f && !showFavsOnly ? 'primary' : 'ghost'}
              icon={f === 'Low GL' ? <LeafIcon /> : undefined}
              onClick={() => { setActiveFilter(f); setShowFavsOnly(false) }}
              className="shrink-0"
            >
              {f === 'All' ? (isLoading ? 'All' : `All ${libraryRecipes.length}`) : f}
            </Chip>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {isLoading ? (
          <RecipesLoadingSkeleton />
        ) : totalFiltered === 0 && !showFavsOnly ? (
          <div className="flex flex-col gap-5">
            {/* Even when filter returns 0, show AI chef so user always has something to do */}
            {!showFavsOnly && (
              <AIChefBanner
                onProfile={handleGenerateProfile}
                onFridge={() => setFridgeOpen(true)}
                isGenerating={isGenerating}
              />
            )}
            <div className="flex flex-col items-center py-10 text-center">
              <p className="text-[32px]">🌿</p>
              <p className="mt-3 text-[15px] font-bold text-b-ink">No recipes match this filter</p>
              <p className="mt-1 text-[13px] text-b-ink-3">Try a different filter above.</p>
            </div>
          </div>
        ) : showFavsOnly && totalFiltered === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <p className="text-[32px]">🤍</p>
            <p className="mt-3 text-[15px] font-bold text-b-ink">No saved recipes yet</p>
            <p className="mt-1 text-[13px] text-b-ink-3">Tap the ♡ on any recipe to save it here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">

            {/* ── AI Chef banner (hidden in favs-only mode) ── */}
            {!showFavsOnly && (
              <AIChefBanner
                onProfile={handleGenerateProfile}
                onFridge={() => setFridgeOpen(true)}
                isGenerating={isGenerating}
              />
            )}

            {/* ── Generated recipe spotlight ── */}
            {generatedRecipe && !showFavsOnly && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[15px] font-bold text-b-ink">✨ Generated for you</p>
                  <button
                    onClick={() => setGeneratedRecipe(null)}
                    className="text-[12px] text-b-ink-3 active:opacity-70"
                  >
                    Dismiss
                  </button>
                </div>
                <GeneratedRecipeCard
                  recipe={generatedRecipe}
                  isFaved={savedIds.has(generatedRecipe.id)}
                  onFave={() => toggleFave(generatedRecipe)}
                  onAdd={() => handleAdd(generatedRecipe.name)}
                  onTap={() => goToDetail(generatedRecipe)}
                  mode={generatedMode}
                />
              </div>
            )}

            {/* ── Featured row ── */}
            {featured.length > 0 && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[15px] font-bold text-b-ink">
                    {showFavsOnly ? 'Saved recipes' : activeFilter === 'All' ? "Bloom's picks for you" : activeFilter}
                  </p>
                  {!showFavsOnly && list.length > 0 && (
                    <button
                      onClick={handleSeeAll}
                      className="text-[13px] font-bold text-b-accent active:opacity-70"
                    >
                      See all {totalFiltered}
                    </button>
                  )}
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {featured.map(r => (
                    <FeaturedCard
                      key={r.id}
                      recipe={r}
                      isFaved={savedIds.has(r.id)}
                      onFave={() => toggleFave(r)}
                      onAdd={() => handleAdd(r.name)}
                      onTap={() => goToDetail(r)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── Browse by need (All filter, not fav-only) ── */}
            {activeFilter === 'All' && !showFavsOnly && (
              <div>
                <p className="mb-3 text-[15px] font-bold text-b-ink">Browse by need</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {CATEGORIES.map(cat => (
                    <CategoryTile
                      key={cat.filter}
                      emoji={cat.emoji}
                      title={cat.title}
                      count={libraryRecipes.filter(r => matchesFilter(r, cat.filter)).length}
                      bg={cat.bg}
                      accentColor={cat.accentColor}
                      onClick={() => { setActiveFilter(cat.filter); setShowFavsOnly(false) }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── Recipe list ── */}
            {list.length > 0 && (
              <div ref={listRef}>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[15px] font-bold text-b-ink">
                    {showFavsOnly ? 'More saved' : activeFilter === 'All' ? 'More recipes' : 'All results'}
                  </p>
                  <span className="text-[12px] text-b-ink-3">{list.length} recipes</span>
                </div>
                <div className="flex flex-col gap-2.5">
                  {list.map(r => (
                    <RecipeListRow
                      key={r.id}
                      recipe={r}
                      isFaved={savedIds.has(r.id)}
                      onFave={() => toggleFave(r)}
                      onAdd={() => handleAdd(r.name)}
                      onTap={() => goToDetail(r)}
                    />
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}
