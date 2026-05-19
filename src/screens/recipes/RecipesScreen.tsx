import { useState } from 'react'
import { AppBar, Card, Chip } from '@/components/ui'

// ── Types ─────────────────────────────────────────────────────────────────────

type Recipe = {
  id: string
  name: string
  image: string
  timeMin: number
  kcal: number
  protein_g: number
  fiber_g: number
  gl: number
}

type Filter = 'All' | 'Low GL' | 'High protein' | 'Anti-inflam' | 'Under 30 min'

// ── Mock Data ─────────────────────────────────────────────────────────────────

const FEATURED: Recipe[] = [
  {
    id: 'f1',
    name: 'Wild salmon, quinoa + greens bowl',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=480&q=80&auto=format&fit=crop',
    timeMin: 25,
    kcal: 540,
    protein_g: 38,
    fiber_g: 8,
    gl: 13,
  },
  {
    id: 'f2',
    name: 'Shakshuka with feta + herbs',
    image: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=480&q=80&auto=format&fit=crop',
    timeMin: 20,
    kcal: 380,
    protein_g: 22,
    fiber_g: 5,
    gl: 5,
  },
]

const ALL_RECIPES: Recipe[] = [
  {
    id: 'r1',
    name: 'Rainbow buddha bowl',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=160&q=80&auto=format&fit=crop',
    timeMin: 35,
    kcal: 490,
    protein_g: 18,
    fiber_g: 14,
    gl: 18,
  },
  {
    id: 'r2',
    name: 'Zucchini noodle stir-fry',
    image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=160&q=80&auto=format&fit=crop',
    timeMin: 30,
    kcal: 310,
    protein_g: 14,
    fiber_g: 9,
    gl: 6,
  },
  {
    id: 'r3',
    name: 'Sesame tofu + bok choy',
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=160&q=80&auto=format&fit=crop',
    timeMin: 25,
    kcal: 350,
    protein_g: 26,
    fiber_g: 7,
    gl: 9,
  },
  {
    id: 'r4',
    name: 'Hummus plate + veggie sticks',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=160&q=80&auto=format&fit=crop',
    timeMin: 8,
    kcal: 280,
    protein_g: 12,
    fiber_g: 11,
    gl: 7,
  },
  {
    id: 'r5',
    name: 'Avocado + poached egg toast',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=160&q=80&auto=format&fit=crop',
    timeMin: 10,
    kcal: 420,
    protein_g: 18,
    fiber_g: 7,
    gl: 14,
  },
]

const TOTAL = FEATURED.length + ALL_RECIPES.length
const FILTERS: Filter[] = ['All', 'Low GL', 'High protein', 'Anti-inflam', 'Under 30 min']

function matchesFilter(r: Recipe, f: Filter): boolean {
  if (f === 'All') return true
  if (f === 'Low GL') return r.gl < 10
  if (f === 'High protein') return r.protein_g >= 20
  if (f === 'Anti-inflam') return r.gl < 15 && r.fiber_g >= 7
  if (f === 'Under 30 min') return r.timeMin <= 30
  return true
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

// ── Category Tile ─────────────────────────────────────────────────────────────

function CategoryTile({
  emoji, title, count, bg, accentColor,
}: {
  emoji: string; title: string; count: string; bg: string; accentColor: string
}) {
  return (
    <button
      className="flex flex-col items-start rounded-b-md p-3.5 text-left active:opacity-75 transition-opacity"
      style={{ background: bg }}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-b-surface text-lg shadow-b-card">
        {emoji}
      </div>
      <p className="mt-2.5 text-[13px] font-bold text-b-ink">{title}</p>
      <p className="mt-0.5 text-[11px] font-bold" style={{ color: accentColor }}>{count}</p>
    </button>
  )
}

// ── Featured Card ─────────────────────────────────────────────────────────────

function FeaturedCard({ recipe }: { recipe: Recipe }) {
  return (
    <div className="w-60 shrink-0 overflow-hidden rounded-b-md border border-b-hairline bg-b-surface shadow-b-card">
      <div className="relative">
        <img
          src={recipe.image}
          alt={recipe.name}
          className="h-36 w-full object-cover"
        />
        <div className="absolute left-2.5 top-2.5">
          <span className="inline-flex items-center gap-1 rounded-b-pill bg-white/90 px-2 py-1 text-[11px] font-semibold text-b-ink shadow-sm">
            <span className="text-[color:var(--b-mint)]"><LeafIcon /></span>
            Low GL · {recipe.gl}
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
        <div className="mt-1.5 flex gap-1">
          {recipe.gl < 10 && (
            <Chip size="sm" tone="mint" icon={<LeafIcon />}>Low GL</Chip>
          )}
          {recipe.protein_g >= 20 && (
            <Chip size="sm" tone="primary">High protein</Chip>
          )}
          {recipe.fiber_g >= 10 && (
            <Chip size="sm" tone="amber">High fiber</Chip>
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

export function RecipesScreen() {
  const [activeFilter, setActiveFilter] = useState<Filter>('All')

  const visibleFeatured = FEATURED.filter(r => matchesFilter(r, activeFilter))
  const visibleList = ALL_RECIPES.filter(r => matchesFilter(r, activeFilter))

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
          <span className="text-[13px]">Search {TOTAL} recipes…</span>
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
              {f === 'All' ? `All ${TOTAL}` : f}
            </Chip>
          ))}
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="flex flex-col gap-5">

          {/* Featured horizontal scroll */}
          {visibleFeatured.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[15px] font-bold text-b-ink">Bloom's picks for you</p>
                <button className="text-[13px] font-bold text-b-accent active:opacity-70">See all</button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {visibleFeatured.map(r => (
                  <FeaturedCard key={r.id} recipe={r} />
                ))}
              </div>
            </div>
          )}

          {/* Browse by need (only shown on "All" filter) */}
          {activeFilter === 'All' && (
            <div>
              <p className="mb-3 text-[15px] font-bold text-b-ink">Browse by need</p>
              <div className="grid grid-cols-2 gap-2.5">
                <CategoryTile
                  emoji="🌾" title="High fiber" count="32 recipes"
                  bg="var(--b-mint-soft)" accentColor="var(--b-fiber)"
                />
                <CategoryTile
                  emoji="💪" title="High protein" count="28 recipes"
                  bg="var(--b-primary-soft)" accentColor="var(--b-protein)"
                />
                <CategoryTile
                  emoji="🍓" title="Low glycemic" count="24 recipes"
                  bg="var(--b-amber-soft)" accentColor="var(--b-amber)"
                />
                <CategoryTile
                  emoji="🩷" title="Cycle-aware" count="18 recipes"
                  bg="var(--b-berry-soft)" accentColor="var(--b-berry)"
                />
              </div>
            </div>
          )}

          {/* Recipe list */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[15px] font-bold text-b-ink">
                {activeFilter === 'All' ? 'More from your plan' : activeFilter}
              </p>
              <span className="text-[12px] text-b-ink-3">{visibleList.length} recipes</span>
            </div>
            {visibleList.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {visibleList.map(r => (
                  <RecipeListRow key={r.id} recipe={r} />
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-[13px] text-b-ink-3">No recipes match this filter.</p>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
