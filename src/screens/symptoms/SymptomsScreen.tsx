import { useEffect, useState, type ReactElement } from 'react'
import clsx from 'clsx'
import { AppBar, Btn, Card } from '@/components/ui'
import { DateStrip } from '@/components/food/DateStrip'
import { useSymptomLog } from '@/hooks/useSymptomLog'
import { useUpsertSymptomLog } from '@/hooks/useUpsertSymptomLog'
import { toLocalDateStr, formatDateLabel } from '@/lib/dates'

// ── Symptom definitions ──────────────────────────────────────────────────────

const ENERGY_OPTIONS = [
  { v: 1, emoji: '😴', label: 'Drained' },
  { v: 2, emoji: '😪', label: 'Low' },
  { v: 3, emoji: '😐', label: 'Meh' },
  { v: 4, emoji: '🙂', label: 'Good' },
  { v: 5, emoji: '✨', label: 'Bright' },
]

const VALUE_LABELS: Record<string, Record<number, string>> = {
  mood:     { 0: '—', 1: 'Down', 2: 'Low', 3: 'OK', 4: 'Good', 5: 'Great' },
  sleep:    { 0: '—', 1: 'Awful', 2: 'Poor', 3: 'OK', 4: 'Good', 5: 'Great' },
  bloating: { 0: '—', 1: 'None', 2: 'Mild', 3: 'Moderate', 4: 'Bad', 5: 'Severe' },
  skin:     { 0: '—', 1: 'Clear', 2: 'Slight', 3: 'Mild', 4: 'Noticeable', 5: 'Flared' },
  cravings: { 0: '—', 1: 'None', 2: 'Mild', 3: 'Moderate', 4: 'Strong', 5: 'Intense' },
}

interface SymDef {
  key: 'mood' | 'sleep' | 'bloating' | 'skin' | 'cravings'
  label: string
  color: string
  Icon: () => ReactElement
}

const SYMPTOMS: SymDef[] = [
  {
    key: 'mood', label: 'Mood', color: 'var(--b-accent)',
    Icon: () => (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    key: 'sleep', label: 'Sleep quality', color: 'var(--b-primary)',
    Icon: () => (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    ),
  },
  {
    key: 'bloating', label: 'Bloating', color: 'var(--b-coral)',
    Icon: () => (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </svg>
    ),
  },
  {
    key: 'skin', label: 'Skin · acne', color: 'var(--b-amber)',
    Icon: () => (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    key: 'cravings', label: 'Cravings', color: 'var(--b-berry)',
    Icon: () => (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" strokeLinecap="round" />
        <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
  },
]

// ── Sub-components ───────────────────────────────────────────────────────────

function SymptomDotBar({
  sym,
  value,
  onChange,
}: {
  sym: SymDef
  value: number
  onChange: (v: number) => void
}) {
  const caption = VALUE_LABELS[sym.key]?.[value] ?? '—'

  return (
    <div className="flex items-center gap-3 border-b border-b-hairline py-3.5 last:border-0">
      <div
        className="flex h-8 w-8 items-center justify-center rounded-[9px]"
        style={{ background: sym.color + '1F', color: sym.color }}
      >
        <sym.Icon />
      </div>
      <div className="flex-1">
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="text-[12.5px] font-bold text-b-ink">{sym.label}</span>
          <span className="text-[11px] font-semibold text-b-ink-3">{caption}</span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              onClick={() => onChange(v)}
              aria-label={`${sym.label} ${v}`}
              className="flex-1 rounded-full transition-opacity"
              style={{
                height: 7,
                background: sym.color,
                opacity: v <= value ? 1 : 0.15,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── SymptomsScreen ───────────────────────────────────────────────────────────

type SymValues = { energy: number; mood: number; sleep: number; bloating: number; skin: number; cravings: number }

const EMPTY: SymValues = { energy: 0, mood: 0, sleep: 0, bloating: 0, skin: 0, cravings: 0 }

export function SymptomsScreen() {
  const [selectedDate, setSelectedDate] = useState(toLocalDateStr())
  const [values, setValues] = useState<SymValues>(EMPTY)
  const [showSaved, setShowSaved] = useState(false)

  const { data: savedLog, isFetching } = useSymptomLog(selectedDate)
  const upsert = useUpsertSymptomLog()

  // Sync form with saved entry when date or saved data changes
  useEffect(() => {
    if (!isFetching) {
      setValues({
        energy: savedLog?.energy ?? 0,
        mood: savedLog?.mood ?? 0,
        sleep: savedLog?.sleep ?? 0,
        bloating: savedLog?.bloating ?? 0,
        skin: savedLog?.skin ?? 0,
        cravings: savedLog?.cravings ?? 0,
      })
    }
  }, [savedLog, isFetching])

  const set = (key: keyof SymValues) => (v: number) =>
    setValues((prev) => ({ ...prev, [key]: v }))

  const hasAnyValue = Object.values(values).some((v) => v > 0)

  const hasChanges = savedLog
    ? (Object.keys(values) as (keyof SymValues)[]).some(
        (k) => values[k] !== (savedLog[k] ?? 0),
      )
    : hasAnyValue

  const handleSave = async () => {
    if (!hasAnyValue) return
    await upsert.mutateAsync({ log_date: selectedDate, ...values })
    setShowSaved(true)
    setTimeout(() => setShowSaved(false), 2000)
  }

  const dayLabel = formatDateLabel(selectedDate).toUpperCase()

  return (
    <div className="flex h-full flex-col bg-b-bg">
      <AppBar big title="How are you?" subtitle={dayLabel} />

      <div className="shrink-0 px-4 pb-3">
        <DateStrip selectedDate={selectedDate} onSelect={setSelectedDate} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="flex flex-col gap-4">

          {/* Loading shimmer while fetching past-day data */}
          {isFetching && (
            <div className="flex justify-center py-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-b-primary border-t-transparent" />
            </div>
          )}

          {/* Energy — big emoji tiles */}
          <Card className="p-4">
            <p className="mb-3 text-[13px] font-bold text-b-ink">How is your energy today?</p>
            <div className="flex gap-1.5">
              {ENERGY_OPTIONS.map((opt) => {
                const active = values.energy === opt.v
                return (
                  <button
                    key={opt.v}
                    onClick={() => set('energy')(opt.v)}
                    aria-pressed={active}
                    aria-label={`Energy: ${opt.label}`}
                    className={clsx(
                      'flex flex-1 flex-col items-center justify-center gap-1 rounded-b-md border py-3 transition-colors',
                      active
                        ? 'border-transparent bg-b-primary text-b-primary-ink'
                        : 'border-b-hairline bg-b-surface-2 text-b-ink',
                    )}
                  >
                    <span className="text-2xl leading-none">{opt.emoji}</span>
                    <span
                      className={clsx(
                        'text-[9.5px] font-bold uppercase tracking-[0.3px]',
                        active ? 'opacity-90' : 'opacity-60',
                      )}
                    >
                      {opt.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </Card>

          {/* Other symptoms — dot-bar rows */}
          <Card className="px-4 py-1">
            <p className="py-3 text-[13px] font-bold text-b-ink">Other symptoms</p>
            {SYMPTOMS.map((sym) => (
              <SymptomDotBar
                key={sym.key}
                sym={sym}
                value={values[sym.key]}
                onChange={set(sym.key)}
              />
            ))}
          </Card>

          {/* Saved banner */}
          {showSaved && (
            <div className="rounded-b-md bg-b-mint-soft px-4 py-3 text-center text-[13px] font-bold text-b-mint">
              Saved ✓
            </div>
          )}

          {/* Save button */}
          <Btn
            tone="primary"
            size="lg"
            full
            disabled={!hasChanges || upsert.isPending}
            onClick={handleSave}
          >
            {upsert.isPending ? 'Saving…' : savedLog ? 'Update check-in' : 'Save check-in'}
          </Btn>
        </div>
      </div>
    </div>
  )
}
