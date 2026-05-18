import { useState } from 'react'
import { Btn, Card, Chip } from '@/components/ui'
import { useEditFoodLog } from '@/hooks/useEditFoodLog'
import type { Tables } from '@/lib/database.types'

type FoodLog = Tables<'food_logs'>
type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack'

const SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack']
const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

interface EditLogEntrySheetProps {
  entry: FoodLog
  open: boolean
  onClose: () => void
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

export function EditLogEntrySheet({ entry, open, onClose }: EditLogEntrySheetProps) {
  const [servingG, setServingG] = useState(entry.serving_g)
  const [slot, setSlot] = useState<MealSlot>((entry.meal_slot as MealSlot) ?? 'lunch')
  const editLog = useEditFoodLog()

  if (!open) return null

  const handleSave = async () => {
    await editLog.mutateAsync({
      id: entry.id,
      entry: {
        serving_g: entry.serving_g,
        kcal: entry.kcal,
        protein_g: entry.protein_g,
        carbs_g: entry.carbs_g,
        fat_g: entry.fat_g,
        fiber_g: entry.fiber_g,
        sugar_g: entry.sugar_g,
        food_name: entry.food_name,
      },
      newServingG: servingG,
      newSlot: slot,
    })
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-b-surface pb-safe">
        {/* Drag handle */}
        <div className="flex justify-center pb-1 pt-3">
          <div className="h-1 w-10 rounded-full bg-b-hairline" />
        </div>

        <div className="px-4 pb-5 pt-2">
          <h3 className="mb-4 truncate text-[15px] font-bold text-b-ink">{entry.food_name}</h3>

          {/* Serving stepper */}
          <Card className="mb-4 p-3.5">
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

          {/* Slot picker */}
          <div className="mb-5">
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

          <Btn
            tone="primary"
            size="lg"
            full
            disabled={editLog.isPending}
            onClick={handleSave}
          >
            {editLog.isPending ? 'Saving…' : 'Save changes'}
          </Btn>
        </div>
      </div>
    </>
  )
}
