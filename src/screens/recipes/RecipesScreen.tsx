import { useRef, useState, useCallback, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AppBar, Card, Chip } from '@/components/ui'
import { useRecipes, type Recipe } from '@/hooks/useRecipes'

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

// ── RecipesScreen ─────────────────────────────────────────────────────────────

const CATEGORIES: Array<{
  emoji: string; title: string; filter: Filter; bg: string; accentColor: string
}> = [
  { emoji: '🌾', title: 'High fiber',   filter: 'High fiber',   bg: 'var(--b-mint-soft)',    accentColor: 'var(--b-fiber)' },
  { emoji: '💪', title: 'High protein', filter: 'High protein', bg: 'var(--b-primary-soft)', accentColor: 'var(--b-protein)' },
  { emoji: '🍓', title: 'Low glycemic', filter: 'Low GL',       bg: 'var(--b-amber-soft)',   accentColor: 'var(--b-amber)' },
  { emoji: '🩷', title: 'Anti-inflam',  filter: 'Anti-inflam',  bg: 'var(--b-berry-soft)',   accentColor: 'var(--b-berry)' },
]

export function RecipesScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [activeFilter, setActiveFilter] = useState<Filter>('All')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [showFavsOnly, setShowFavsOnly] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const { data: allRecipes = [], isLoading } = useRecipes()

  // Apply ?phase=luteal filter on mount
  useEffect(() => {
    const phase = searchParams.get('phase')
    if (phase === 'luteal') {
      setActiveFilter('Low GL')
      setShowFavsOnly(false)
    }
  }, [])

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(null), 2000)
  }, [])

  const toggleFave = useCallback((id: string, name: string) => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        showToast('Removed from saved')
      } else {
        next.add(id)
        showToast(`Saved "${name.split(' ').slice(0, 3).join(' ')}…"`)
      }
      return next
    })
  }, [showToast])

  const handleAdd = useCallback((name: string) => {
    showToast(`"${name.split(' ').slice(0, 3).join(' ')}…" added to plan`)
  }, [showToast])

  const handleSeeAll = useCallback(() => {
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const handleHeaderHeart = useCallback(() => {
    setShowFavsOnly(prev => {
      if (!prev && favorites.size === 0) {
        showToast('Save recipes with the ♡ button')
        return false
      }
      return !prev
    })
    setActiveFilter('All')
  }, [favorites.size, showToast])

  // Apply filters
  let filtered = allRecipes.filter(r => matchesFilter(r, activeFilter))
  if (showFavsOnly) filtered = filtered.filter(r => favorites.has(r.id))

  const featured = filtered.slice(0, 2)
  const list = filtered.slice(2)
  const totalFiltered = filtered.length

  return (
    <div className="flex h-full flex-col bg-b-bg">
      {toast && <Toast message={toast} />}

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
                // Cycle through filters as a quick-access shortcut
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
                ? `${favorites.size} saved recipe${favorites.size !== 1 ? 's' : ''}`
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
              {f === 'All' ? (isLoading ? 'All' : `All ${allRecipes.length}`) : f}
            </Chip>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {isLoading ? (
          <RecipesLoadingSkeleton />
        ) : totalFiltered === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <p className="text-[32px]">{showFavsOnly ? '🤍' : '🌿'}</p>
            <p className="mt-3 text-[15px] font-bold text-b-ink">
              {showFavsOnly ? 'No saved recipes yet' : 'No recipes match this filter'}
            </p>
            <p className="mt-1 text-[13px] text-b-ink-3">
              {showFavsOnly
                ? 'Tap the ♡ on any recipe to save it here.'
                : 'Try a different filter above.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">

            {/* Featured row */}
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
                      isFaved={favorites.has(r.id)}
                      onFave={() => toggleFave(r.id, r.name)}
                      onAdd={() => handleAdd(r.name)}
                      onTap={() => navigate(`/recipes/${r.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Browse by need (All filter, not fav-only) */}
            {activeFilter === 'All' && !showFavsOnly && (
              <div>
                <p className="mb-3 text-[15px] font-bold text-b-ink">Browse by need</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {CATEGORIES.map(cat => (
                    <CategoryTile
                      key={cat.filter}
                      emoji={cat.emoji}
                      title={cat.title}
                      count={allRecipes.filter(r => matchesFilter(r, cat.filter)).length}
                      bg={cat.bg}
                      accentColor={cat.accentColor}
                      onClick={() => { setActiveFilter(cat.filter); setShowFavsOnly(false) }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Recipe list */}
            {list.length > 0 && (
              <div ref={listRef}>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[15px] font-bold text-b-ink">
                    {showFavsOnly ? 'More saved' : activeFilter === 'All' ? 'More from your plan' : 'All results'}
                  </p>
                  <span className="text-[12px] text-b-ink-3">{list.length} recipes</span>
                </div>
                <div className="flex flex-col gap-2.5">
                  {list.map(r => (
                    <RecipeListRow
                      key={r.id}
                      recipe={r}
                      isFaved={favorites.has(r.id)}
                      onFave={() => toggleFave(r.id, r.name)}
                      onAdd={() => handleAdd(r.name)}
                      onTap={() => navigate(`/recipes/${r.id}`)}
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
