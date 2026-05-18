import { useState } from 'react'
import { Card, Chip } from '@/components/ui'
import { EditLogEntrySheet } from './EditLogEntrySheet'
import { useDeleteFoodLog } from '@/hooks/useDeleteFoodLog'
import { formatGL } from '@/lib/gl'
import type { Tables } from '@/lib/database.types'
import clsx from 'clsx'

type FoodLog = Tables<'food_logs'>
type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack'

const SLOT_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

const SLOT_TONES: Record<string, 'primary' | 'accent' | 'mint' | 'amber'> = {
  breakfast: 'accent',
  lunch: 'primary',
  dinner: 'mint',
  snack: 'amber',
}

interface LogEntryRowProps {
  entry: FoodLog
  className?: string
}

function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function MacroDot({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <span className="text-[10.5px] font-semibold" style={{ color }}>
      {label} {value}
    </span>
  )
}

export function LogEntryRow({ entry, className }: LogEntryRowProps) {
  const [showEdit, setShowEdit] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deleteLog = useDeleteFoodLog()

  const time = new Date(entry.logged_at).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })

  const slotLabel = SLOT_LABELS[entry.meal_slot] ?? entry.meal_slot
  const slotTone = (SLOT_TONES[entry.meal_slot as MealSlot] ?? 'neutral') as 'primary' | 'accent' | 'mint' | 'amber'

  const handleDelete = async () => {
    await deleteLog.mutateAsync(entry.id)
  }

  return (
    <>
      <Card className={clsx('p-2.5', className)}>
        <div className="flex items-start gap-2.5">
          <div className="flex-1 min-w-0">
            {/* Slot + time */}
            <div className="mb-1 flex items-center gap-1.5">
              <Chip tone={slotTone} size="sm">{slotLabel}</Chip>
              <span className="text-[10.5px] text-b-ink-3">{time}</span>
            </div>

            {/* Food name */}
            <p className="truncate text-[13.5px] font-semibold text-b-ink">{entry.food_name}</p>

            {/* Serving */}
            <p className="mt-0.5 text-[11px] text-b-ink-3">{entry.serving_g} g</p>

            {/* Macro dots */}
            <div className="mt-1.5 flex flex-wrap gap-2">
              {entry.protein_g != null && (
                <MacroDot color="var(--b-protein)" label="P" value={`${entry.protein_g}g`} />
              )}
              {entry.fiber_g != null && (
                <MacroDot color="var(--b-fiber)" label="Fib" value={`${entry.fiber_g}g`} />
              )}
              <MacroDot color="var(--b-amber)" label="GL" value={formatGL(entry.gl)} />
            </div>
          </div>

          {/* Right: kcal + actions */}
          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <p className="text-[15px] font-bold tabular-nums text-b-ink">
                {entry.kcal ?? '—'}
              </p>
              <p className="text-[10px] text-b-ink-3">kcal</p>
            </div>

            {/* Action buttons or delete confirmation */}
            {confirmDelete ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-[11px] font-semibold text-b-ink-3 active:opacity-70"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteLog.isPending}
                  className="rounded-full bg-b-coral px-2 py-0.5 text-[11px] font-bold text-white disabled:opacity-50 active:opacity-70"
                >
                  {deleteLog.isPending ? '…' : 'Delete'}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowEdit(true)}
                  aria-label="Edit entry"
                  className="text-b-ink-3 active:text-b-primary active:opacity-70"
                >
                  <EditIcon />
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  aria-label="Delete entry"
                  className="text-b-ink-3 active:text-b-coral active:opacity-70"
                >
                  <TrashIcon />
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>

      <EditLogEntrySheet
        entry={entry}
        open={showEdit}
        onClose={() => setShowEdit(false)}
      />
    </>
  )
}
