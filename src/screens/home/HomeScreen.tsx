import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Btn, Card, Ring } from '@/components/ui'
import { DateStrip } from '@/components/food/DateStrip'
import { MealSlotsSection } from '@/components/food/MealSlotsSection'
import { useFoodLogs } from '@/hooks/useFoodLogs'
import { useProfile } from '@/hooks/useProfile'
import { useSymptomLog } from '@/hooks/useSymptomLog'
import { sumMacros } from '@/lib/macros'
import { STATIC_TARGETS } from '@/lib/targets'
import { toLocalDateStr, formatDateLabel } from '@/lib/dates'
import { formatGL } from '@/lib/gl'
import type { Tables } from '@/lib/database.types'

type SymptomLog = Tables<'symptom_logs'>

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

// ── MacroRing helper ─────────────────────────────────────────────────────────

function MacroRing({
  label,
  value,
  target,
  unit,
  color,
  lowerBetter,
}: {
  label: string
  value: number
  target: number
  unit: string
  color: string
  lowerBetter?: boolean
}) {
  const displayValue = lowerBetter ? Math.min(value, target) : value
  const pct = Math.round((value / target) * 100)

  return (
    <div className="flex flex-1 flex-col items-center gap-1.5">
      <Ring value={displayValue} max={target} size={68} stroke={7} color={color}>
        <p className="text-[14px] font-bold tabular-nums text-b-ink">{value}</p>
        <p className="text-[8.5px] font-bold uppercase tracking-wide text-b-ink-3">{unit}</p>
      </Ring>
      <p className="text-[10.5px] font-semibold text-b-ink-2">{label}</p>
      <p className="text-[10px] text-b-ink-3">{pct}%</p>
    </div>
  )
}

// ── MacroProgressCard ────────────────────────────────────────────────────────

function MacroProgressCard({
  kcal,
  protein_g,
  fiber_g,
  gl,
}: {
  kcal: number
  protein_g: number
  fiber_g: number
  gl: number
}) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.4px] text-b-ink-3">PCOS BALANCE</p>
          <p className="mt-0.5 text-[15px] font-bold text-b-ink">Today's macros</p>
        </div>
        <div className="text-right">
          <p className="text-[22px] font-bold tabular-nums leading-none text-b-ink">{kcal}</p>
          <p className="text-[10px] text-b-ink-3">/ {STATIC_TARGETS.kcal} kcal</p>
        </div>
      </div>

      <div className="flex gap-2">
        <MacroRing
          label="Protein"
          value={Math.round(protein_g)}
          target={STATIC_TARGETS.protein_g}
          unit="g"
          color="var(--b-protein)"
        />
        <MacroRing
          label="Fiber"
          value={Math.round(fiber_g * 10) / 10}
          target={STATIC_TARGETS.fiber_g}
          unit="g"
          color="var(--b-fiber)"
        />
        <MacroRing
          label="Glyc. load"
          value={Math.round(gl * 10) / 10}
          target={STATIC_TARGETS.gl}
          unit="GL"
          color="var(--b-amber)"
          lowerBetter
        />
      </div>

      <p className="mt-3 text-[11px] text-b-ink-3">
        GL: {formatGL(gl > 0 ? gl : null)} of {STATIC_TARGETS.gl} daily ceiling
      </p>
    </Card>
  )
}

// ── SymptomSummaryCard ───────────────────────────────────────────────────────

const SYMPTOM_COLORS: Record<string, string> = {
  energy: 'var(--b-mint)',
  mood: 'var(--b-accent)',
  sleep: 'var(--b-primary)',
  bloating: 'var(--b-coral)',
  skin: 'var(--b-amber)',
}

function DotBar({ value, color }: { value: number | null; color: string }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((v) => (
        <div
          key={v}
          className="h-[5px] w-[5px] rounded-full"
          style={{
            background: v <= (value ?? 0) ? color : 'var(--b-surface-sunken)',
          }}
        />
      ))}
    </div>
  )
}

function SymptomSummaryCard({
  dateStr,
  log,
}: {
  dateStr: string
  log: SymptomLog | null | undefined
}) {
  const navigate = useNavigate()

  if (!log) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.4px] text-b-ink-3">SYMPTOMS</p>
            <p className="mt-0.5 text-[15px] font-bold text-b-ink">How are you feeling?</p>
          </div>
          <button
            onClick={() => navigate('/symptoms')}
            className="text-[13px] font-bold text-b-accent active:opacity-70"
          >
            Log →
          </button>
        </div>
        <p className="mt-1.5 text-[12px] text-b-ink-3">No check-in logged for this day.</p>
      </Card>
    )
  }

  const symptoms: Array<{ key: keyof SymptomLog; label: string }> = [
    { key: 'energy', label: 'Energy' },
    { key: 'mood', label: 'Mood' },
    { key: 'sleep', label: 'Sleep' },
    { key: 'bloating', label: 'Bloating' },
    { key: 'skin', label: 'Skin' },
  ]

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.4px] text-b-ink-3">SYMPTOMS</p>
          <p className="mt-0.5 text-[15px] font-bold text-b-ink">How you felt</p>
        </div>
        <button
          onClick={() => navigate('/symptoms')}
          className="text-[13px] font-bold text-b-accent active:opacity-70"
        >
          Edit →
        </button>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {symptoms.map(({ key, label }) => (
          <div key={key} className="flex flex-col items-center gap-1.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.3px] text-b-ink-3">{label}</p>
            <DotBar value={log[key] as number | null} color={SYMPTOM_COLORS[key]} />
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── HomeScreen ───────────────────────────────────────────────────────────────

export function HomeScreen() {
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState(toLocalDateStr())
  const { data: profile } = useProfile()
  const { data: entries = [], isFetching } = useFoodLogs(selectedDate)
  const { data: symptomLog } = useSymptomLog(selectedDate)

  const totals = sumMacros(entries)
  const name = profile?.display_name ?? ''
  const dateLabel = formatDateLabel(selectedDate)

  return (
    <div className="flex h-full flex-col bg-b-bg">
      {/* Header */}
      <div className="shrink-0 px-5 pb-3 pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-b-ink-3">{dateLabel}</p>
        <div className="mt-0.5 flex items-center justify-between gap-3">
          <h1 className="font-display text-[22px] leading-tight text-b-ink">
            <span className="italic">{greeting()}</span>
            {name ? `, ${name}` : ''}
          </h1>
          <Btn
            tone="primary"
            size="sm"
            icon={<PlusIcon />}
            onClick={() => navigate(`/log?slot=lunch`)}
          >
            Log food
          </Btn>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="flex flex-col gap-4">
          {/* Date strip */}
          <DateStrip selectedDate={selectedDate} onSelect={setSelectedDate} />

          {/* Loading indicator */}
          {isFetching && (
            <div className="flex justify-center py-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-b-primary border-t-transparent" />
            </div>
          )}

          {/* Macro rings */}
          <MacroProgressCard
            kcal={totals.kcal}
            protein_g={totals.protein_g}
            fiber_g={totals.fiber_g}
            gl={totals.gl}
          />

          {/* Meals by slot */}
          <MealSlotsSection entries={entries} selectedDate={selectedDate} />

          {/* Symptom summary */}
          <SymptomSummaryCard dateStr={selectedDate} log={symptomLog} />
        </div>
      </div>
    </div>
  )
}
