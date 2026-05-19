import { useState } from 'react'
import { AppBar, Card, Progress, Ring } from '@/components/ui'
import { DateStrip } from '@/components/food/DateStrip'
import { MealSlotsSection } from '@/components/food/MealSlotsSection'
import { useFoodLogs } from '@/hooks/useFoodLogs'
import { sumMacros } from '@/lib/macros'
import { STATIC_TARGETS } from '@/lib/targets'
import { toLocalDateStr, formatDateLabel } from '@/lib/dates'
import { formatGL } from '@/lib/gl'

// ── DayTotalsCard ────────────────────────────────────────────────────────────

function MetricRow({
  label,
  value,
  target,
  unit,
  color,
}: {
  label: string
  value: number
  target: number
  unit: string
  color: string
}) {
  const pct = Math.min((value / target) * 100, 100)
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[11.5px] font-semibold text-b-ink-2">{label}</span>
        <span className="text-[12px] font-bold tabular-nums text-b-ink">
          {value}
          <span className="font-normal text-b-ink-4"> / {target}{unit}</span>
        </span>
      </div>
      <Progress value={pct} max={100} color={color} height={5} />
    </div>
  )
}

function DayTotalsCard({
  totals,
  isLoading,
}: {
  totals: ReturnType<typeof sumMacros>
  isLoading: boolean
}) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-4">
        <Ring
          value={totals.kcal}
          max={STATIC_TARGETS.kcal}
          size={60}
          stroke={6}
          color="var(--b-primary)"
        >
          <p className="text-[13px] font-bold tabular-nums text-b-ink">
            {isLoading ? '…' : Math.round((totals.kcal / STATIC_TARGETS.kcal) * 100)}
          </p>
          <p className="text-[8px] font-bold uppercase text-b-ink-3">%</p>
        </Ring>
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.4px] text-b-ink-3">DAY TOTAL</p>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-[26px] font-bold tabular-nums leading-none text-b-ink">
              {totals.kcal}
            </span>
            <span className="text-[13px] text-b-ink-3">/ {STATIC_TARGETS.kcal} kcal</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <MetricRow
          label="Protein"
          value={Math.round(totals.protein_g)}
          target={STATIC_TARGETS.protein_g}
          unit="g"
          color="var(--b-protein)"
        />
        <MetricRow
          label="Fiber"
          value={Math.round(totals.fiber_g * 10) / 10}
          target={STATIC_TARGETS.fiber_g}
          unit="g"
          color="var(--b-fiber)"
        />
        <MetricRow
          label="Glyc. load"
          value={Math.round(totals.gl * 10) / 10}
          target={STATIC_TARGETS.gl}
          unit=""
          color="var(--b-amber)"
        />
      </div>

      <div className="mt-3 flex gap-4 border-t border-dashed border-b-hairline pt-3">
        <div>
          <p className="text-[9.5px] font-bold uppercase tracking-[0.3px] text-b-ink-3">Added sugar</p>
          <p className="mt-0.5 text-[14px] font-bold tabular-nums text-b-ink">
            {Math.round(totals.sugar_g * 10) / 10}g
            <span className="text-[11px] font-normal text-b-ink-3"> / {STATIC_TARGETS.sugar_g}g</span>
          </p>
        </div>
        <div>
          <p className="text-[9.5px] font-bold uppercase tracking-[0.3px] text-b-ink-3">Carbs</p>
          <p className="mt-0.5 text-[14px] font-bold tabular-nums text-b-ink">
            {Math.round(totals.carbs_g * 10) / 10}g
          </p>
        </div>
        <div>
          <p className="text-[9.5px] font-bold uppercase tracking-[0.3px] text-b-ink-3">Fat</p>
          <p className="mt-0.5 text-[14px] font-bold tabular-nums text-b-ink">
            {Math.round(totals.fat_g * 10) / 10}g
          </p>
        </div>
      </div>

      {totals.gl > 0 && (
        <p className="mt-2 text-[11px] text-b-ink-3">
          Glyc. load: {formatGL(totals.gl)} of {STATIC_TARGETS.gl} daily ceiling
        </p>
      )}
    </Card>
  )
}

// ── DiaryScreen ──────────────────────────────────────────────────────────────

export function DiaryScreen() {
  const [selectedDate, setSelectedDate] = useState(toLocalDateStr())
  const { data: entries = [], isFetching } = useFoodLogs(selectedDate)
  const totals = sumMacros(entries)
  const dayLabel = formatDateLabel(selectedDate).toUpperCase()

  return (
    <div className="flex h-full flex-col bg-b-bg">
      <AppBar big title="Diary" subtitle={dayLabel} />

      <div className="shrink-0 px-4 pb-3">
        <DateStrip selectedDate={selectedDate} onSelect={setSelectedDate} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="flex flex-col gap-4">
          {isFetching && (
            <div className="flex justify-center py-1">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-b-primary border-t-transparent" />
            </div>
          )}

          <DayTotalsCard totals={totals} isLoading={isFetching} />

          <MealSlotsSection entries={entries} selectedDate={selectedDate} />
        </div>
      </div>
    </div>
  )
}
