import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Btn, Card, Chip, Ring, Sparkline } from '@/components/ui'
import { DateStrip } from '@/components/food/DateStrip'
import { MealSlotsSection } from '@/components/food/MealSlotsSection'
import { WeightEntrySheet } from '@/components/health/WeightEntrySheet'
import { CyclePhaseChip } from '@/components/home/CyclePhaseChip'
import { LutealTipCard } from '@/components/home/LutealTipCard'
import { useFoodLogs } from '@/hooks/useFoodLogs'
import { useProfile } from '@/hooks/useProfile'
import { useSymptomLog } from '@/hooks/useSymptomLog'
import { useWeightLogs } from '@/hooks/useWeightLogs'
import { useAITargets } from '@/hooks/useAITargets'
import type { AITargets } from '@/hooks/useAITargets'
import { getCyclePhase } from '@/lib/cycle'
import { sumMacros } from '@/lib/macros'
import { toLocalDateStr, formatDateLabel } from '@/lib/dates'
import { formatGL } from '@/lib/gl'
import { rollingAverage } from '@/lib/rolling-average'
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
  targets,
}: {
  kcal: number
  protein_g: number
  fiber_g: number
  gl: number
  targets: AITargets
}) {
  const kcalLabel =
    targets.source === 'ai'
      ? `${targets.calorie_min}–${targets.calorie_max} kcal`
      : `${targets.calorie_max} kcal`

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.4px] text-b-ink-3">PCOS BALANCE</p>
          <p className="mt-0.5 text-[15px] font-bold text-b-ink">Today's macros</p>
        </div>
        <div className="text-right">
          <p className="text-[22px] font-bold tabular-nums leading-none text-b-ink">{kcal}</p>
          <p className="text-[10px] text-b-ink-3">/ {kcalLabel}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <MacroRing
          label="Protein"
          value={Math.round(protein_g)}
          target={targets.protein_g}
          unit="g"
          color="var(--b-protein)"
        />
        <MacroRing
          label="Fiber"
          value={Math.round(fiber_g * 10) / 10}
          target={targets.fiber_g}
          unit="g"
          color="var(--b-fiber)"
        />
        <MacroRing
          label="Glyc. load"
          value={Math.round(gl * 10) / 10}
          target={targets.gl_target}
          unit="GL"
          color="var(--b-amber)"
          lowerBetter
        />
      </div>

      <p className="mt-3 text-[11px] text-b-ink-3">
        GL: {formatGL(gl > 0 ? gl : null)} of {targets.gl_target} daily ceiling
      </p>
    </Card>
  )
}

// ── InsulBalanceCard ─────────────────────────────────────────────────────────

function scoreBand(score: number): { label: string; color: string } {
  if (score <= 40) return { label: 'High risk', color: 'var(--b-coral)' }
  if (score <= 70) return { label: 'Moderate', color: 'var(--b-amber)' }
  return { label: 'Optimised', color: 'var(--b-mint)' }
}

function InsulBalanceCard({ targets }: { targets: AITargets }) {
  if (targets.source === 'static' || targets.insulin_score == null) {
    return (
      <Card className="p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.4px] text-b-ink-3">INSULIN BALANCE</p>
        <p className="mt-1 text-[13px] text-b-ink-3">Personalising your targets…</p>
      </Card>
    )
  }

  const { label, color } = scoreBand(targets.insulin_score)

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.4px] text-b-ink-3">INSULIN BALANCE</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span
              className="text-[28px] font-bold tabular-nums leading-none"
              style={{ color }}
            >
              {targets.insulin_score}
            </span>
            <span className="text-[12px] font-semibold" style={{ color }}>
              {label}
            </span>
          </div>
          {targets.narrative && (
            <p className="mt-2 text-[12px] leading-relaxed text-b-ink-2">{targets.narrative}</p>
          )}
        </div>

        {/* Score bar */}
        <div className="flex h-14 w-2 shrink-0 overflow-hidden rounded-full bg-b-surface-sunken">
          <div
            className="mt-auto w-full rounded-full transition-all duration-500"
            style={{ height: `${targets.insulin_score}%`, background: color }}
          />
        </div>
      </div>
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
  dateStr: _dateStr,
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

// ── WeightCard ───────────────────────────────────────────────────────────────

function WeightCard() {
  const [showEntry, setShowEntry] = useState(false)
  const today = toLocalDateStr()
  const { data: logs = [] } = useWeightLogs()

  const weights = logs.map((l) => l.weight_kg)
  const avgSeries = rollingAverage(weights, 7)
  const currentAvg = avgSeries.at(-1) ?? null
  const prevAvg = avgSeries.length >= 8 ? avgSeries[avgSeries.length - 8] : null
  const delta =
    currentAvg != null && prevAvg != null
      ? Math.round((currentAvg - prevAvg) * 10) / 10
      : null

  const todayLog = logs.find((l) => l.log_date === today)

  return (
    <>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.4px] text-b-ink-3">
              WEIGHT · 7-DAY AVG
            </p>
            {currentAvg != null ? (
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-[26px] font-bold tabular-nums leading-none text-b-ink">
                  {currentAvg}
                </span>
                <span className="text-[13px] text-b-ink-3">kg</span>
                {delta !== null && delta !== 0 && (
                  <Chip tone={delta < 0 ? 'mint' : 'neutral'} size="sm">
                    {delta > 0 ? '+' : ''}{delta} kg
                  </Chip>
                )}
              </div>
            ) : (
              <p className="mt-1 text-[14px] text-b-ink-3">No entries yet</p>
            )}
          </div>

          {avgSeries.length > 0 && (
            <Sparkline
              data={avgSeries}
              w={100}
              h={44}
              color="var(--b-mint)"
              fill
              dots
              dotColor="var(--b-mint)"
            />
          )}
        </div>

        <button
          onClick={() => setShowEntry(true)}
          className="mt-3 w-full rounded-b-pill border border-b-hairline bg-b-surface-2 py-2 text-[13px] font-bold text-b-ink active:opacity-70"
        >
          {todayLog
            ? `Today: ${todayLog.weight_kg} kg — Update`
            : "Log today's weight"}
        </button>
      </Card>

      <WeightEntrySheet
        open={showEntry}
        onClose={() => setShowEntry(false)}
        todayDate={today}
        existingWeight={todayLog?.weight_kg}
      />
    </>
  )
}

// ── ReportCTACard ────────────────────────────────────────────────────────────

function ReportCTACard() {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate('/report')}
      className="w-full rounded-b-lg border border-b-hairline bg-b-surface-2 px-4 py-3.5 text-left active:opacity-70"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] font-semibold text-b-ink">View Health Report</p>
          <p className="mt-0.5 text-[11px] text-b-ink-3">30/60/90-day GL, symptoms &amp; patterns</p>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="shrink-0 text-b-ink-3"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </button>
  )
}

// ── HomeScreen ───────────────────────────────────────────────────────────────

export function HomeScreen() {
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState(toLocalDateStr())
  const { data: profile } = useProfile()
  const { data: entries = [], isFetching } = useFoodLogs(selectedDate)
  const { data: symptomLog } = useSymptomLog(selectedDate)
  const { data: aiTargets, isLoading: targetsLoading } = useAITargets()

  const totals = sumMacros(entries)
  const name = profile?.display_name ?? ''
  const dateLabel = formatDateLabel(selectedDate)
  const cycleResult = getCyclePhase(
    profile?.last_period_date ? new Date(profile.last_period_date) : null,
    profile?.cycle_length_days ?? 28,
  )

  return (
    <div className="flex h-full flex-col bg-b-bg">
      {/* Header */}
      <div className="shrink-0 px-5 pb-3 pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-b-ink-3">{dateLabel}</p>
        {cycleResult && <CyclePhaseChip result={cycleResult} className="mt-1.5" />}
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
          {aiTargets && (
            <MacroProgressCard
              kcal={totals.kcal}
              protein_g={totals.protein_g}
              fiber_g={totals.fiber_g}
              gl={totals.gl}
              targets={aiTargets}
            />
          )}
          {!aiTargets && targetsLoading && (
            <Card className="p-4">
              <div className="flex justify-center py-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-b-primary border-t-transparent" />
              </div>
            </Card>
          )}

          {/* Luteal phase tip card */}
          {cycleResult?.phase === 'luteal' && <LutealTipCard />}

          {/* Meals by slot */}
          <MealSlotsSection entries={entries} selectedDate={selectedDate} />

          {/* Insulin Balance score */}
          {aiTargets && <InsulBalanceCard targets={aiTargets} />}

          {/* Symptom summary */}
          <SymptomSummaryCard dateStr={selectedDate} log={symptomLog} />

          {/* Weight sparkline card */}
          <WeightCard />

          {/* Health report CTA */}
          <ReportCTACard />
        </div>
      </div>
    </div>
  )
}
