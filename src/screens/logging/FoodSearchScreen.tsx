import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AppBar, Card, Chip } from '@/components/ui'
import { useFoodSearch } from '@/hooks/useFoodSearch'
import { useRecentFoods } from '@/hooks/useRecentFoods'
import { useLogFood } from '@/hooks/useLogFood'
import { calculateGL, formatGL } from '@/lib/gl'
import {
  getLogSession,
  startLogSession,
  clearLogSession,
} from '@/lib/logSession'
import type { LogSession, MealSlot } from '@/lib/logSession'
import type { USDAFood } from '@/lib/usda'
import type { Tables } from '@/lib/database.types'

type FoodLog = Tables<'food_logs'>

const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

const SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack']

// ── Icons ────────────────────────────────────────────────────────────────────

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

function ChevronUpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function BackIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  )
}

// ── Meal picker ──────────────────────────────────────────────────────────────

const SLOT_META: Record<MealSlot, { icon: JSX.Element; desc: string; bgClass: string; iconClass: string }> = {
  breakfast: {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    ),
    desc: 'Morning meal',
    bgClass: 'bg-b-amber-soft',
    iconClass: 'text-b-amber',
  },
  lunch: {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
        <path d="M7 2v20" />
        <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h1v5" />
      </svg>
    ),
    desc: 'Midday meal',
    bgClass: 'bg-b-mint-soft',
    iconClass: 'text-b-mint',
  },
  dinner: {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    ),
    desc: 'Evening meal',
    bgClass: 'bg-b-berry-soft',
    iconClass: 'text-b-berry',
  },
  snack: {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </svg>
    ),
    desc: 'Between meals',
    bgClass: 'bg-b-primary-soft',
    iconClass: 'text-b-primary',
  },
}

function MealPicker({ onSelect }: { onSelect: (slot: MealSlot) => void }) {
  return (
    <div className="flex flex-1 flex-col px-5 pt-4">
      <h2 className="mb-1 text-[22px] font-bold tracking-tight text-b-ink">What meal is this?</h2>
      <p className="mb-6 text-[13px] text-b-ink-3">Pick a meal, then add foods one by one</p>
      <div className="grid grid-cols-2 gap-3">
        {SLOTS.map((slot) => {
          const meta = SLOT_META[slot]
          return (
            <button
              key={slot}
              onClick={() => onSelect(slot)}
              className="flex flex-col items-start gap-2.5 rounded-b-lg border border-b-hairline bg-b-surface p-4 shadow-b-card active:scale-[0.97] active:opacity-80 transition-all"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${meta.bgClass} ${meta.iconClass}`}>
                {meta.icon}
              </div>
              <div>
                <p className="text-[15px] font-bold text-b-ink">{SLOT_LABELS[slot]}</p>
                <p className="mt-0.5 text-[11px] text-b-ink-3">{meta.desc}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Session tray ─────────────────────────────────────────────────────────────

function SessionTray({ session, onDone }: { session: LogSession; onDone: () => void }) {
  const [expanded, setExpanded] = useState(false)

  const totalKcal = Math.round(session.items.reduce((s, i) => s + (i.kcal ?? 0), 0))
  const totalProtein = Math.round(session.items.reduce((s, i) => s + (i.protein_g ?? 0), 0))
  const totalCarbs = Math.round(session.items.reduce((s, i) => s + (i.carbs_g ?? 0), 0))
  const totalFat = Math.round(session.items.reduce((s, i) => s + (i.fat_g ?? 0), 0))
  const totalFiber = Math.round(session.items.reduce((s, i) => s + (i.fiber_g ?? 0), 0))
  const glItems = session.items.filter((i) => i.gl != null)
  const totalGL = glItems.length > 0 ? glItems.reduce((s, i) => s + i.gl!, 0) : null

  const count = session.items.length
  if (count === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-b-hairline bg-b-surface shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
      {/* Collapsed bar — always visible */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex flex-1 items-center gap-2.5 active:opacity-70"
          aria-label={expanded ? 'Collapse meal summary' : 'Expand meal summary'}
        >
          <span className="text-b-ink-3">{expanded ? <ChevronDownIcon /> : <ChevronUpIcon />}</span>
          <div className="text-left">
            <p className="text-[13px] font-bold text-b-ink">
              {SLOT_LABELS[session.slot]} · {count} item{count !== 1 ? 's' : ''}
            </p>
            <p className="text-[11px] text-b-ink-3">
              {totalKcal} kcal · {totalProtein}g protein
            </p>
          </div>
        </button>
        <button
          onClick={onDone}
          className="shrink-0 rounded-b-pill bg-b-primary px-4 py-2 text-[13px] font-bold text-white active:opacity-70"
        >
          Done
        </button>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-b-hairline px-4 pb-5 pt-3">
          {/* Food list */}
          <div className="mb-3 max-h-40 overflow-y-auto">
            {session.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <p className="flex-1 truncate text-[13px] font-medium text-b-ink">{item.food_name}</p>
                <p className="ml-3 shrink-0 text-[11.5px] tabular-nums text-b-ink-3">
                  {item.serving_g}g · {item.kcal != null ? `${Math.round(item.kcal)} kcal` : '—'}
                </p>
              </div>
            ))}
          </div>

          {/* Totals card */}
          <div className="rounded-b-md bg-b-surface-2 px-3 py-3">
            <p className="mb-2 text-[9.5px] font-bold uppercase tracking-widest text-b-ink-3">
              Meal totals
            </p>
            <div className="grid grid-cols-3 gap-x-3 gap-y-2">
              {[
                { label: 'Kcal', value: String(totalKcal) },
                { label: 'Protein', value: `${totalProtein}g` },
                { label: 'Carbs', value: `${totalCarbs}g` },
                { label: 'Fat', value: `${totalFat}g` },
                { label: 'Fiber', value: `${totalFiber}g` },
                { label: 'GL', value: formatGL(totalGL) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] text-b-ink-3">{label}</p>
                  <p className="text-[14px] font-bold tabular-nums text-b-ink">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onDone}
            className="mt-3 w-full rounded-b-pill bg-b-primary py-3.5 text-[15px] font-bold text-white active:opacity-70"
          >
            Done — go to Diary
          </button>
        </div>
      )}
    </div>
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
  const displayName =
    food.food_name.length > 18 ? food.food_name.slice(0, 17) + '…' : food.food_name

  return (
    <div
      className="flex shrink-0 flex-col items-start gap-1.5 rounded-b-md border border-b-hairline bg-b-surface p-2.5 shadow-b-card"
      style={{ width: 120 }}
    >
      <p
        className="w-full truncate text-[12.5px] font-bold leading-snug text-b-ink"
        title={food.food_name}
      >
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

function FoodRow({
  food,
  onSelect,
}: {
  food: USDAFood
  onSelect: (food: USDAFood) => void
}) {
  const carbs = food.carbs_g_per_100g ?? 0
  const gl = calculateGL(food.description, carbs)
  const kcal = food.kcal_per_100g != null ? Math.round(food.kcal_per_100g) : null

  return (
    <Card className="flex items-center gap-3 p-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-semibold text-b-ink">{food.description}</p>
        <p className="mt-0.5 text-[11px] text-b-ink-3">
          100 g · {kcal != null ? `${kcal} kcal` : '—'}
          {food.brand_owner ? ` · ${food.brand_owner}` : ''}
        </p>
        <div className="mt-1.5 flex gap-1.5">
          <Chip size="sm" tone="amber">
            GL {formatGL(gl)}
          </Chip>
          {food.protein_g_per_100g != null && (
            <Chip size="sm" tone="neutral">
              {food.protein_g_per_100g}g protein
            </Chip>
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
  const slot = (searchParams.get('slot') ?? '') as MealSlot | ''

  const [rawQuery, setRawQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [justAdded, setJustAdded] = useState<Set<string>>(new Set())
  const [session, setSession] = useState<LogSession | null>(() => getLogSession())
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Session lifecycle ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!slot) {
      setSession(null)
      return
    }
    const existing = getLogSession()
    if (existing && existing.slot === slot) {
      // Returning from FoodDetailScreen — refresh from storage
      setSession({ ...existing })
    } else {
      // New slot chosen — start a fresh session
      const fresh = startLogSession(slot)
      setSession(fresh)
    }
  }, [slot])

  // ── Search debounce ────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(rawQuery), 400)
    return () => clearTimeout(id)
  }, [rawQuery])

  // Auto-focus search when slot is known
  useEffect(() => {
    if (slot) inputRef.current?.focus()
  }, [slot])

  const { data: results = [], isFetching, isError } = useFoodSearch(debouncedQuery)
  const { data: recentFoods = [] } = useRecentFoods()
  const logFood = useLogFood()

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSlotSelect = (chosen: MealSlot) => {
    // Replace current history entry so pressing Back exits the whole logging flow
    navigate(`/log?slot=${chosen}`, { replace: true })
  }

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
      meal_slot: slot || food.meal_slot,
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
    // Append to session
    const updated = getLogSession()
    if (updated) setSession({ ...updated })

    setJustAdded((prev) => new Set(prev).add(food.id))
    setTimeout(() => {
      setJustAdded((prev) => {
        const next = new Set(prev)
        next.delete(food.id)
        return next
      })
    }, 1500)
  }

  const handleDone = () => {
    clearLogSession()
    navigate('/diary', { replace: true })
  }

  const slotLabel = slot ? SLOT_LABELS[slot] : ''
  const showRecent = debouncedQuery.length < 2 && recentFoods.length > 0
  const hasSessionItems = (session?.items.length ?? 0) > 0

  // ── Meal picker (no slot selected yet) ────────────────────────────────────
  if (!slot) {
    return (
      <div className="flex h-dvh flex-col bg-b-bg">
        <AppBar
          title="Log food"
          leading={
            <button
              className="text-b-ink-2 active:opacity-70"
              onClick={() => navigate(-1)}
              aria-label="Back"
            >
              <BackIcon />
            </button>
          }
        />
        <MealPicker onSelect={handleSlotSelect} />
      </div>
    )
  }

  // ── Search screen (slot selected) ─────────────────────────────────────────
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
            <BackIcon />
          </button>
        }
        trailing={
          hasSessionItems ? (
            <button
              onClick={handleDone}
              className="text-[13px] font-bold text-b-primary active:opacity-70"
            >
              Done
            </button>
          ) : undefined
        }
      />

      {/* Search bar */}
      <div className="shrink-0 px-4 pb-3 pt-1">
        <div className="flex items-center gap-2.5 rounded-b-pill border border-b-hairline bg-b-surface px-4 py-3 shadow-b-card">
          <span className="text-b-ink-3">
            <SearchIcon />
          </span>
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
          <button
            onClick={handleScan}
            className="text-b-primary active:opacity-70"
            aria-label="Scan barcode"
          >
            <ScanIcon />
          </button>
        </div>
      </div>

      {/* Results / empty state */}
      <div
        className="flex-1 overflow-y-auto px-4 pb-6"
        style={{ paddingBottom: hasSessionItems ? '72px' : undefined }}
      >
        {isError && (
          <p className="mt-4 text-center text-sm text-red-500">
            Search failed — check your connection.
          </p>
        )}

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
          <p className="mt-6 text-center text-sm text-b-ink-3">
            No results for "{debouncedQuery}"
          </p>
        )}

        {results.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-b-ink-3">
              {results.length} result{results.length !== 1 ? 's' : ''}
            </p>
            {results.map((food) => (
              <FoodRow key={food.fdc_id} food={food} onSelect={handleSelect} />
            ))}
          </div>
        )}
      </div>

      {/* Session tray — appears after first food is added */}
      {session && <SessionTray session={session} onDone={handleDone} />}
    </div>
  )
}
