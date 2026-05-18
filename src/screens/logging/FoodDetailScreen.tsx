import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AppBar, Btn, Card, Chip, Ring } from '@/components/ui'
import { getFoodByFdcId, scaleMacros } from '@/lib/usda'
import { calculateGL, formatGL, lookupGIForDisplay } from '@/lib/gl'
import { useLogFood } from '@/hooks/useLogFood'

type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack'

const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

const SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack']

function MacroPill({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-b-surface-2 px-2.5 py-2">
      <div className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
      <div>
        <p className="text-[9.5px] font-bold uppercase tracking-[0.3px] text-b-ink-3">{label}</p>
        <p className="mt-0.5 text-[13px] font-bold tabular-nums text-b-ink">{value}</p>
      </div>
    </div>
  )
}

function PcosStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] bg-b-surface-2 p-2.5">
      <p className="text-[9.5px] font-bold uppercase tracking-[0.3px] text-b-ink-3">{label}</p>
      <p className="mt-0.5 text-[17px] font-bold tabular-nums tracking-tight text-b-ink">{value}</p>
    </div>
  )
}

function MinusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function PlusSmIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function LeafIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  )
}

export function FoodDetailScreen() {
  const navigate = useNavigate()
  const { fdcId } = useParams<{ fdcId: string }>()
  const [searchParams] = useSearchParams()

  const initialSlot = (searchParams.get('slot') ?? 'lunch') as MealSlot
  const [slot, setSlot] = useState<MealSlot>(initialSlot)
  const [servingG, setServingG] = useState(100)

  const { data: food, isLoading, isError } = useQuery({
    queryKey: ['usda-food', fdcId],
    queryFn: () => getFoodByFdcId(fdcId!),
    staleTime: 5 * 60 * 1000,
    enabled: !!fdcId,
  })

  const logFood = useLogFood()

  const macros = food ? scaleMacros(food, servingG) : null
  const gl = food && macros?.carbs_g != null ? calculateGL(food.description, macros.carbs_g) : null
  const gi = food ? lookupGIForDisplay(food.description) : null

  const handleLog = async () => {
    if (!food || !macros) return
    await logFood.mutateAsync({
      fdc_id: food.fdc_id,
      food_name: food.description,
      meal_slot: slot,
      serving_g: servingG,
      kcal: macros.kcal,
      protein_g: macros.protein_g,
      carbs_g: macros.carbs_g,
      fat_g: macros.fat_g,
      fiber_g: macros.fiber_g,
      sugar_g: macros.sugar_g,
      gi,
      gl,
    })
    navigate('/home', { replace: true })
  }

  const slotLabel = SLOT_LABELS[slot]

  if (isLoading) {
    return (
      <div className="flex h-dvh flex-col bg-b-bg">
        <AppBar
          title="Loading…"
          leading={
            <button className="text-b-ink-2 active:opacity-70" onClick={() => navigate(-1)} aria-label="Back">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </button>
          }
        />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-b-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  if (isError || !food) {
    return (
      <div className="flex h-dvh flex-col bg-b-bg">
        <AppBar
          title="Error"
          leading={
            <button className="text-b-ink-2 active:opacity-70" onClick={() => navigate(-1)} aria-label="Back">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </button>
          }
        />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-b-ink-2">Could not load food details.</p>
          <Btn tone="ghost" onClick={() => navigate(-1)}>Go back</Btn>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-dvh flex-col bg-b-bg">
      <AppBar
        title={`Add to ${slotLabel}`}
        leading={
          <button className="text-b-ink-2 active:opacity-70" onClick={() => navigate(-1)} aria-label="Back">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 pb-28 pt-3">
        {/* Food name */}
        <div className="mb-3">
          <h2 className="text-[17px] font-bold leading-snug text-b-ink">{food.description}</h2>
          {food.brand_owner && (
            <p className="mt-0.5 text-[12px] text-b-ink-3">{food.brand_owner}</p>
          )}
        </div>

        {/* Serving stepper */}
        <Card className="mb-3 p-3.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.4px] text-b-ink-3">Serving</p>
              <p className="mt-0.5 text-[14px] font-bold text-b-ink">{servingG} g</p>
            </div>
            <div className="flex items-center gap-3 rounded-full border border-b-hairline bg-b-surface-2 px-1 py-1">
              <button
                onClick={() => setServingG((g) => Math.max(1, g - 25))}
                disabled={servingG <= 1}
                aria-label="Decrease serving"
                className="flex h-7 w-7 items-center justify-center rounded-full text-b-ink-2 disabled:opacity-30 active:opacity-60"
              >
                <MinusIcon />
              </button>
              <span className="min-w-[36px] text-center text-[15px] font-bold tabular-nums text-b-ink">
                {servingG}
              </span>
              <button
                onClick={() => setServingG((g) => g + 25)}
                aria-label="Increase serving"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-b-primary text-white active:opacity-70"
              >
                <PlusSmIcon />
              </button>
            </div>
          </div>
        </Card>

        {/* Macros card */}
        <Card className="mb-3 p-3.5">
          <div className="flex items-center gap-3.5">
            <Ring
              value={macros?.kcal ?? 0}
              max={2000}
              size={86}
              stroke={8}
              color="var(--b-primary)"
            >
              <p className="text-[19px] font-bold tabular-nums text-b-ink">
                {macros?.kcal ?? '—'}
              </p>
              <p className="text-[9px] font-bold uppercase tracking-[0.4px] text-b-ink-3">kcal</p>
            </Ring>
            <div className="grid flex-1 grid-cols-2 gap-2">
              <MacroPill
                color="var(--b-protein)"
                label="Protein"
                value={macros?.protein_g != null ? `${macros.protein_g}g` : '—'}
              />
              <MacroPill
                color="var(--b-carbs)"
                label="Carbs"
                value={macros?.carbs_g != null ? `${macros.carbs_g}g` : '—'}
              />
              <MacroPill
                color="var(--b-fat)"
                label="Fat"
                value={macros?.fat_g != null ? `${macros.fat_g}g` : '—'}
              />
              <MacroPill
                color="var(--b-fiber)"
                label="Fiber"
                value={macros?.fiber_g != null ? `${macros.fiber_g}g` : '—'}
              />
            </div>
          </div>
        </Card>

        {/* PCOS panel */}
        <Card className="mb-3 p-3.5">
          <div className="mb-2.5 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-b-mint-soft text-b-mint">
              <LeafIcon />
            </div>
            <p className="text-[13px] font-bold text-b-ink">PCOS profile</p>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <PcosStat label="Glyc. load" value={formatGL(gl)} />
            <PcosStat
              label="Added sugar"
              value={macros?.sugar_g != null ? `${macros.sugar_g}g` : '—'}
            />
            <PcosStat label="GI" value={gi != null ? String(gi) : '—'} />
          </div>
        </Card>

        {/* Meal slot picker */}
        <div className="mb-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.4px] text-b-ink-3">Meal</p>
          <div className="flex flex-wrap gap-2">
            {SLOTS.map((s) => (
              <Chip
                key={s}
                tone={slot === s ? 'primary' : 'ghost'}
                onClick={() => setSlot(s)}
              >
                {SLOT_LABELS[s]}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-b-border bg-b-surface px-4 py-3 pb-safe">
        <Btn
          tone="primary"
          size="lg"
          full
          disabled={logFood.isPending}
          onClick={handleLog}
        >
          {logFood.isPending
            ? 'Logging…'
            : `Add to ${slotLabel} · ${macros?.kcal ?? '—'} kcal`}
        </Btn>
      </div>
    </div>
  )
}
