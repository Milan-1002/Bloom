import { useState } from 'react'
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

function HeartIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-b-surface-sunken ${className ?? ''}`} />
}

function RecipesLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      {/* Featured skeleton */}
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
      {/* Grid skeleton */}
      <div>
        <Skeleton className="mb-3 h-5 w-32" />
        <div className="grid grid-cols-2 gap-2.5">
          {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-b-md" />)}
        </div>
      </div>
      {/* List skeleton */}
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

function FeaturedCard({ recipe }: { recipe: Recipe }) {
  return (
    <div className="w-60 shrink-0 overflow-hidden rounded-b-md border border-b-hairline bg-b-surface shadow-b-card">
      <div className="relative">
        <img src={recipe.image} alt={recipe.name} className="h-36 w-full object-cover" />
        <div className="absolute left-2.5 top-2.5">
          <span className="inline-flex items-center gap-1 rounded-b-pill bg-white/90 px-2 py-1 text-[11px] font-semibold text-b-ink shadow-sm">
            <span className="text-[color:var(--b-mint)]"><LeafIcon /></span>
            {recipe.tags.includes('low-gl') ? `Low GL · ${recipe.gl}` : `GL · ${recipe.gl}`}
          </span>
        </div>
        <button className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/85 text-[color:var(--b-coral)] active:opacity-70">
          <HeartIcon size={14} />
        </button>
      </div>
      <div className="p-3.5">
        <p className="text-[13.5px] font-bold leading-snug text-b-ink">{recipe.name}</p>
        <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-b-ink-3">
          <span>⏱ {recipe.timeMin} min</span>
          <span className="h-1 w-1 rounded-full bg-b-ink-4" />
          <span>🔥 {recipe.kcal} kcal</span>
          <span className="h-1 w-1 rounded-full bg-b-ink-4" />
          <span>P {recipe.protein_g}g</span>
        </div>
      </div>
    </div>
  )
}

// ── Recipe List Row ───────────────────────────────────────────────────────────

function RecipeListRow({ recipe }: { recipe: Recipe }) {
  return (
    <Card pad="sm" className="flex items-center gap-3">
      <img
        src={recipe.image}
        alt={recipe.name}
        className="h-16 w-16 shrink-0 rounded-xl object-cover"
      />
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
      <button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-b-primary text-white active:opacity-70">
        <PlusIcon />
      </button>
    </Card>
  )
}

// ── RecipesScreen ─────────────────────────────────────────────────────────────

const CATEGORIES: Array<{
  emoji: string; title: string; filter: Filter; bg: string; accentColor: string
}> = [
  { emoji: '🌾', title: 'High fiber',    filter: 'High fiber',   bg: 'var(--b-mint-soft)',    accentColor: 'var(--b-fiber)' },
  { emoji: '💪', title: 'High protein',  filter: 'High protein', bg: 'var(--b-primary-soft)', accentColor: 'var(--b-protein)' },
  { emoji: '🍓', title: 'Low glycemic',  filter: 'Low GL',       bg: 'var(--b-amber-soft)',   accentColor: 'var(--b-amber)' },
  { emoji: '🩷', title: 'Anti-inflam',   filter: 'Anti-inflam',  bg: 'var(--b-berry-soft)',   accentColor: 'var(--b-berry)' },
]

export function RecipesScreen() {
  const [activeFilter, setActiveFilter] = useState<Filter>('All')
  const { data: allRecipes = [], isLoading } = useRecipes()

  const filtered = allRecipes.filter(r => matchesFilter(r, activeFilter))
  const featured = filtered.slice(0, 2)
  const list = filtered.slice(2)

  return (
    <div className="flex h-full flex-col bg-b-bg">
      {/* Header */}
      <AppBar
        big
        subtitle="MY LIBRARY"
        title="Recipes"
        trailing={
          <>
            <button className="flex h-9 w-9 items-center justify-center rounded-full border border-b-hairline bg-b-surface text-b-ink-2 active:opacity-70">
              <HeartIcon />
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-full border border-b-hairline bg-b-surface text-b-ink-2 active:opacity-70">
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
            {isLoading ? 'Loading recipes…' : `Search ${allRecipes.length} recipes…`}
          </span>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5">
          {FILTERS.map(f => (
            <Chip
              key={f}
              tone={activeFilter === f ? 'primary' : 'ghost'}
              icon={f === 'Low GL' ? <LeafIcon /> : undefined}
              onClick={() => setActiveFilter(f)}
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
        ) : allRecipes.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <p className="text-[32px]">🌿</p>
            <p className="mt-3 text-[15px] font-bold text-b-ink">Generating your recipes</p>
            <p className="mt-1 text-[13px] text-b-ink-3">
              Claude is personalising recipes for your PCOS profile.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">

            {/* Featured horizontal scroll */}
            {featured.length > 0 && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[15px] font-bold text-b-ink">
                    {activeFilter === 'All' ? "Bloom's picks for you" : activeFilter}
                  </p>
                  <button className="text-[13px] font-bold text-b-accent active:opacity-70">
                    See all
                  </button>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {featured.map(r => <FeaturedCard key={r.id} recipe={r} />)}
                </div>
              </div>
            )}

            {/* Browse by need (All filter only) */}
            {activeFilter === 'All' && (
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
                      onClick={() => setActiveFilter(cat.filter)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Recipe list */}
            {list.length > 0 && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[15px] font-bold text-b-ink">
                    {activeFilter === 'All' ? 'More from your plan' : 'All results'}
                  </p>
                  <span className="text-[12px] text-b-ink-3">{list.length} recipes</span>
                </div>
                <div className="flex flex-col gap-2.5">
                  {list.map(r => <RecipeListRow key={r.id} recipe={r} />)}
                </div>
              </div>
            )}

            {filtered.length === 0 && (
              <p className="py-8 text-center text-[13px] text-b-ink-3">
                No recipes match this filter.
              </p>
            )}

          </div>
        )}
      </div>
    </div>
  )
}
