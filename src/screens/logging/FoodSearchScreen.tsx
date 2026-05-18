import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AppBar, Card, Chip } from '@/components/ui'
import { useFoodSearch } from '@/hooks/useFoodSearch'
import { useRecentFoods } from '@/hooks/useRecentFoods'
import { useLogFood } from '@/hooks/useLogFood'
import { calculateGL, formatGL } from '@/lib/gl'
import type { USDAFood } from '@/lib/usda'
import type { Tables } from '@/lib/database.types'

type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack'
type FoodLog = Tables<'food_logs'>

const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
    </svg>
  )
}

function ScanIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

// ── Recent food chip (one-tap re-add) ────────────────────────────────────────

function RecentFoodChip({
  food,
  onAdd,
  added,
}: {
  food: FoodLog
  onAdd: (food: FoodLog) => void
  added: boolean
}) {
  const displayName = food.food_name.length > 18
    ? food.food_name.slice(0, 17) + '…'
    : food.food_name

  return (
    <div className="flex shrink-0 flex-col items-start gap-1.5 rounded-b-md border border-b-hairline bg-b-surface p-2.5 shadow-b-card"
      style={{ width: 120 }}>
      <p className="w-full truncate text-[12.5px] font-bold leading-snug text-b-ink" title={food.food_name}>
        {displayName}
      </p>
      <p className="text-[10.5px] text-b-ink-3">
        {food.serving_g}g · {food.kcal != null ? `${food.kcal} kcal` : '—'}
      </p>
      <div className="flex w-full items-center justify-between">
        <Chip size="sm" tone="ghost" className="text-[10px]">
          {SLOT_LABELS[food.meal_slot as MealSlot] ?? food.meal_slot}
        </Chip>
        <button
          onClick={() => onAdd(food)}
          disabled={added}
          aria-label={added ? 'Added' : `Re-add ${food.food_name}`}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-b-primary text-white transition-colors disabled:bg-b-mint active:opacity-70"
        >
          {added ? <CheckIcon /> : <PlusIcon />}
        </button>
      </div>
    </div>
  )
}

// ── Search result row ────────────────────────────────────────────────────────

function FoodRow({ food, slot, onSelect }: { food: USDAFood; slot: MealSlot; onSelect: (food: USDAFood) => void }) {
  const carbs = food.carbs_g_per_100g ?? 0
  const gl = calculateGL(food.description, carbs)
  const kcal = food.kcal_per_100g != null ? Math.round(food.kcal_per_100g) : null

  return (
    <Card className="flex items-center gap-3 p-2.5">
      <div className="flex-1 min-w-0">
        <p className="truncate text-[13.5px] font-semibold text-b-ink">{food.description}</p>
        <p className="mt-0.5 text-[11px] text-b-ink-3">
          100 g · {kcal != null ? `${kcal} kcal` : '—'}
          {food.brand_owner ? ` · ${food.brand_owner}` : ''}
        </p>
        <div className="mt-1.5 flex gap-1.5">
          <Chip size="sm" tone="amber">GL {formatGL(gl)}</Chip>
          {food.protein_g_per_100g != null && (
            <Chip size="sm" tone="neutral">{food.protein_g_per_100g}g protein</Chip>
          )}
        </div>
      </div>
      <button
        onClick={() => onSelect(food)}
        aria-label={`Add ${food.description}`}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-b-primary text-white active:opacity-70"
      >
        <PlusIcon />
      </button>
    </Card>
  )
}

// ── Main screen ──────────────────────────────────────────────────────────────

export function FoodSearchScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const slot = (searchParams.get('slot') ?? 'lunch') as MealSlot

  const [rawQuery, setRawQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  // Set of food log ids that were just re-added (shows checkmark briefly)
  const [justAdded, setJustAdded] = useState<Set<string>>(new Set())
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(rawQuery), 400)
    return () => clearTimeout(id)
  }, [rawQuery])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const { data: results = [], isFetching, isError } = useFoodSearch(debouncedQuery)
  const { data: recentFoods = [] } = useRecentFoods()
  const logFood = useLogFood()

  const handleSelect = (food: USDAFood) => {
    navigate(`/log/detail/${food.fdc_id}?slot=${slot}`)
  }

  const handleScan = () => {
    navigate(`/log/scan?slot=${slot}`)
  }

  const handleReAdd = async (food: FoodLog) => {
    if (justAdded.has(food.id) || logFood.isPending) return
    await logFood.mutateAsync({
      fdc_id: food.fdc_id!,
      food_name: food.food_name,
      meal_slot: food.meal_slot,
      serving_g: food.serving_g,
      kcal: food.kcal,
      protein_g: food.protein_g,
      carbs_g: food.carbs_g,
      fat_g: food.fat_g,
      fiber_g: food.fiber_g,
      sugar_g: food.sugar_g,
      gi: food.gi,
      gl: food.gl,
    })
    setJustAdded((prev) => new Set(prev).add(food.id))
    setTimeout(() => {
      setJustAdded((prev) => {
        const next = new Set(prev)
        next.delete(food.id)
        return next
      })
    }, 1500)
  }

  const slotLabel = SLOT_LABELS[slot] ?? 'Meal'
  const showRecent = debouncedQuery.length < 2 && recentFoods.length > 0

  return (
    <div className="flex h-dvh flex-col bg-b-bg">
      <AppBar
        title={`Add to ${slotLabel}`}
        leading={
          <button
            className="text-b-ink-2 active:opacity-70"
            onClick={() => navigate(-1)}
            aria-label="Back"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
        }
      />

      {/* Search bar */}
      <div className="shrink-0 px-4 pb-3 pt-1">
        <div className="flex items-center gap-2.5 rounded-b-pill border border-b-hairline bg-b-surface px-4 py-3 shadow-b-card">
          <span className="text-b-ink-3"><SearchIcon /></span>
          <input
            ref={inputRef}
            type="search"
            value={rawQuery}
            onChange={(e) => setRawQuery(e.target.value)}
            placeholder="Search foods…"
            className="flex-1 bg-transparent text-[14px] font-medium text-b-ink outline-none placeholder:text-b-ink-4"
          />
          {isFetching && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-b-primary border-t-transparent" />
          )}
          <button onClick={handleScan} className="text-b-primary active:opacity-70" aria-label="Scan barcode">
            <ScanIcon />
          </button>
        </div>
      </div>

      {/* Results / empty state */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {isError && (
          <p className="mt-4 text-center text-sm text-red-500">Search failed — check your connection.</p>
        )}

        {/* Empty state: recent foods quick-add + scan CTA */}
        {debouncedQuery.length < 2 && !isError && (
          <div className="mt-2">
            {showRecent && (
              <div className="mb-4">
                <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-b-ink-3">
                  Quick add · Recently logged
                </p>
                <div className="flex gap-2.5 overflow-x-auto pb-1">
                  {recentFoods.map((food) => (
                    <RecentFoodChip
                      key={food.id}
                      food={food}
                      onAdd={handleReAdd}
                      added={justAdded.has(food.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {!showRecent && (
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-b-ink-3">
                Start typing to search 1M+ USDA foods
              </p>
            )}

            {/* Scan CTA */}
            <div
              className="mt-2 flex cursor-pointer items-center gap-3 rounded-b-md bg-b-primary-soft p-3.5"
              onClick={handleScan}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-b-primary text-white">
                <ScanIcon />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-bold text-b-ink">Can't find it? Scan the barcode</p>
                <p className="mt-0.5 text-[11px] text-b-ink-3">Auto-fills macros + glycemic load</p>
              </div>
            </div>
          </div>
        )}

        {debouncedQuery.length >= 2 && results.length === 0 && !isFetching && !isError && (
          <p className="mt-6 text-center text-sm text-b-ink-3">No results for "{debouncedQuery}"</p>
        )}

        {results.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-b-ink-3">
              {results.length} result{results.length !== 1 ? 's' : ''}
            </p>
            {results.map((food) => (
              <FoodRow key={food.fdc_id} food={food} slot={slot} onSelect={handleSelect} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
