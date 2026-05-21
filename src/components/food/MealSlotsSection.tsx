import { useNavigate } from 'react-router-dom'
import { LogEntryRow } from '@/components/food/LogEntryRow'
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

function UtensilIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h1v5" />
    </svg>
  )
}

interface MealSlotsSectionProps {
  entries: FoodLog[]
  selectedDate: string
}

function SlotSection({
  slot,
  entries,
  selectedDate,
}: {
  slot: MealSlot
  entries: FoodLog[]
  selectedDate: string
}) {
  const navigate = useNavigate()
  const slotEntries = entries.filter((e) => e.meal_slot === slot)
  const slotKcal = slotEntries.reduce((sum, e) => sum + (e.kcal ?? 0), 0)
  const label = SLOT_LABELS[slot]

  return (
    <div>
      {/* Slot header */}
      <div className="mb-2 flex items-baseline justify-between px-0.5">
        <div className="flex items-baseline gap-2">
          <h3 className="text-[15px] font-bold text-b-ink">{label}</h3>
          {slotEntries.length > 0 && (
            <span className="text-[11px] font-semibold text-b-ink-3">{slotKcal} kcal</span>
          )}
        </div>
        <button
          onClick={() => navigate(`/log?slot=${slot}&date=${selectedDate}`)}
          className="text-[13px] font-bold text-b-accent active:opacity-70"
        >
          + Add
        </button>
      </div>

      {/* Entries or empty state */}
      {slotEntries.length > 0 ? (
        <div className="flex flex-col gap-2">
          {slotEntries.map((entry) => (
            <LogEntryRow key={entry.id} entry={entry} />
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-b-md border border-dashed border-b-hairline bg-b-surface p-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-b-primary-soft text-b-primary">
            <UtensilIcon />
          </div>
          <p className="text-[12.5px] font-medium text-b-ink-3">Nothing logged yet</p>
        </div>
      )}
    </div>
  )
}

export function MealSlotsSection({ entries, selectedDate }: MealSlotsSectionProps) {
  return (
    <div className="flex flex-col gap-4">
      {SLOTS.map((slot) => (
        <SlotSection
          key={slot}
          slot={slot}
          entries={entries}
          selectedDate={selectedDate}
        />
      ))}
    </div>
  )
}
