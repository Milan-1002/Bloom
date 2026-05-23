import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import { AppBar, Card, IconBtn } from '@/components/ui'
import { GLSymptomChart } from '@/components/report/GLSymptomChart'
import { useReportData } from '@/hooks/useReportData'
import { computeReportStats } from '@/lib/report-stats'
import { toLocalDateStr } from '@/lib/dates'
import type {
  ReportWindow,
  RedFlagStreak,
  MealTimingStats,
  MealSlotDistribution,
} from '@/lib/report-stats'

// ─── Icon helpers ──────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <div className="h-4 w-4 animate-spin rounded-full border-2 border-b-primary border-t-transparent" />
  )
}

// ─── Formatting helpers ────────────────────────────────────────────────────────

function formatHour(decimalHour: number): string {
  // Convert decimal hour to 'h:mmam/pm' format, e.g. 8.25 → '8:15am'
  const h = Math.floor(decimalHour)
  const m = Math.round((decimalHour - h) * 60)
  const ampm = h < 12 ? 'am' : 'pm'
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${display}:${String(m).padStart(2, '0')}${ampm}`
}

function formatHours(hours: number): string {
  // Convert decimal hours to 'Xh Ym' e.g. 14.5 → '14h 30m'
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function trendIcon(trend: '▲' | '▼' | '→'): string {
  return trend
}

function trendColor(
  trend: '▲' | '▼' | '→',
  higherIsBetter: boolean,
): string {
  if (trend === '→') return 'text-b-ink-3'
  const isGood = (trend === '▲') === higherIsBetter
  return isGood ? 'text-b-mint' : 'text-b-coral'
}

// ─── Sub-components ────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string
  unit?: string
  trend?: '▲' | '▼' | '→'
  trendHigherIsBetter?: boolean
}

function StatCard({
  label,
  value,
  unit,
  trend,
  trendHigherIsBetter = false,
}: StatCardProps) {
  return (
    <Card className="p-3 flex-1">
      <p className="text-[9px] font-bold uppercase tracking-[0.4px] text-b-ink-3">{label}</p>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-[22px] font-bold tabular-nums leading-none text-b-ink">
          {value}
        </span>
        {unit && <span className="text-[11px] text-b-ink-3">{unit}</span>}
      </div>
      {trend && (
        <p
          className={clsx(
            'mt-0.5 text-[11px] font-semibold',
            trendColor(trend, trendHigherIsBetter ?? false),
          )}
        >
          {trendIcon(trend)} vs earlier
        </p>
      )}
    </Card>
  )
}

function RedFlagCard({ streaks }: { streaks: RedFlagStreak[] }) {
  if (streaks.length === 0) return null
  return (
    <Card className="bg-b-coral-soft p-4">
      <div className="flex items-start gap-2">
        <span className="text-[18px]">⚠️</span>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-b-ink">High GL Periods</p>
          <p className="mt-0.5 text-[11px] text-b-ink-2">
            {streaks.length} period{streaks.length > 1 ? 's' : ''} where daily GL exceeded
            target by ≥20% for 5+ days
          </p>
          <div className="mt-2 flex flex-col gap-1.5">
            {streaks.map((s) => {
              const start = new Date(s.startDate + 'T12:00:00').toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })
              const end = new Date(s.endDate + 'T12:00:00').toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })
              return (
                <p key={s.startDate} className="text-[12px] text-b-ink-2">
                  <span className="font-semibold">
                    {start}–{end}
                  </span>{' '}
                  ({s.days} days) — GL averaged{' '}
                  <span className="font-semibold text-b-coral">
                    {Math.round(s.avgOveragePct)}% above target
                  </span>
                </p>
              )
            })}
          </div>
        </div>
      </div>
    </Card>
  )
}

function MealPatternsCard({
  mealTiming,
  mealSlotDistribution,
}: {
  mealTiming: MealTimingStats | null
  mealSlotDistribution: MealSlotDistribution
}) {
  const slots: Array<{ key: keyof MealSlotDistribution; label: string }> = [
    { key: 'breakfast', label: 'Breakfast' },
    { key: 'lunch', label: 'Lunch' },
    { key: 'dinner', label: 'Dinner' },
    { key: 'snack', label: 'Snack' },
  ]
  return (
    <Card className="p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.4px] text-b-ink-3">
        MEAL PATTERNS
      </p>
      {mealTiming ? (
        <div className="mt-2 space-y-1">
          <p className="text-[13px] text-b-ink">
            Avg eating window:{' '}
            <span className="font-semibold">
              {formatHours(24 - mealTiming.avgFastingWindowHours)}
            </span>
          </p>
          <p className="text-[12px] text-b-ink-2">
            First meal:{' '}
            <span className="font-semibold">{formatHour(mealTiming.avgFirstMealHour)}</span>
            {' · '}
            Last meal:{' '}
            <span className="font-semibold">{formatHour(mealTiming.avgLastMealHour)}</span>
          </p>
          <p className="text-[12px] text-b-ink-2">
            Avg fasting window:{' '}
            <span className="font-semibold">
              {formatHours(mealTiming.avgFastingWindowHours)}
            </span>
          </p>
        </div>
      ) : (
        <p className="mt-2 text-[12px] text-b-ink-3">
          Not enough data to calculate meal timing.
        </p>
      )}

      {/* Slot distribution bar */}
      <div className="mt-3">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.3px] text-b-ink-3">
          Meal distribution
        </p>
        <div className="flex h-2 w-full overflow-hidden rounded-full">
          <div className="bg-b-accent" style={{ width: `${mealSlotDistribution.breakfast}%` }} />
          <div className="bg-b-primary" style={{ width: `${mealSlotDistribution.lunch}%` }} />
          <div className="bg-b-mint" style={{ width: `${mealSlotDistribution.dinner}%` }} />
          <div className="bg-b-amber" style={{ width: `${mealSlotDistribution.snack}%` }} />
        </div>
        <div className="mt-1.5 flex gap-3 flex-wrap">
          {slots.map(({ key, label }) => (
            <p key={key} className="text-[10px] text-b-ink-3">
              {label}{' '}
              <span className="font-semibold text-b-ink-2">{mealSlotDistribution[key]}%</span>
            </p>
          ))}
        </div>
      </div>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-4 pb-6 pt-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-b-lg bg-b-surface-sunken" />
      ))}
    </div>
  )
}

function EmptyState({ windowDays }: { windowDays: ReportWindow }) {
  return (
    <div className="flex flex-col gap-4 px-4 pb-6 pt-3">
      <Card className="p-6 flex flex-col items-center gap-3 text-center">
        <p className="text-[32px]">📊</p>
        <p className="text-[15px] font-bold text-b-ink">Not enough data yet</p>
        <p className="text-[13px] text-b-ink-2">
          Keep logging for at least 7 days to generate a {windowDays}-day report. You're on
          your way!
        </p>
      </Card>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export function ReportScreen() {
  const navigate = useNavigate()
  const [windowDays, setWindowDays] = useState<ReportWindow>(30)
  const [isExporting, setIsExporting] = useState(false)
  // chartRef is used by html2canvas capture for PDF export
  const chartRef = useRef<HTMLDivElement>(null)

  const { data: rawData, isLoading, error } = useReportData(windowDays)

  // Compute stats from raw data
  const stats = rawData ? computeReportStats(rawData) : null

  const windows: ReportWindow[] = [30, 60, 90]

  const handleExport = async () => {
    if (!stats || !chartRef.current || isExporting) return
    setIsExporting(true)
    try {
      // Step 1: Capture chart as PNG
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(chartRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      })
      const chartImageUrl = canvas.toDataURL('image/png')

      // Step 2: Generate PDF blob using dynamic import (avoids bundling react-pdf eagerly)
      const { pdf } = await import('@react-pdf/renderer')
      const { ReportDocument } = await import('@/lib/report-pdf')
      const blob = await pdf(
        <ReportDocument
          chartImageUrl={chartImageUrl}
          stats={stats}
          windowDays={windowDays}
          generatedAt={toLocalDateStr()}
        />
      ).toBlob()

      // Step 3: Download or share
      const filename = `bloom-report-${windowDays}d-${toLocalDateStr()}.pdf`

      if (
        typeof navigator.share === 'function' &&
        navigator.canShare({ files: [new File([blob], filename, { type: 'application/pdf' })] })
      ) {
        // iOS / Android native share sheet
        await navigator.share({
          title: 'Bloom Health Report',
          files: [new File([blob], filename, { type: 'application/pdf' })],
        })
      } else {
        // Desktop / unsupported: programmatic download
        const blobUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000)
      }
    } catch (err) {
      console.error('[ReportScreen] PDF export failed:', err)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex h-full flex-col bg-b-bg">
      {/* AppBar */}
      <AppBar
        title="Health Report"
        leading={
          <IconBtn
            icon={<BackIcon />}
            ariaLabel="Go back"
            onClick={() => navigate(-1)}
          />
        }
        trailing={
          <div className={clsx(isExporting && 'pointer-events-none opacity-50')}>
            <IconBtn
              icon={isExporting ? <SpinnerIcon /> : <ShareIcon />}
              ariaLabel={isExporting ? 'Generating PDF…' : 'Export PDF'}
              onClick={handleExport}
            />
          </div>
        }
      />

      {/* Window picker — sticky below AppBar */}
      <div className="shrink-0 flex gap-1.5 px-4 pb-3 pt-1">
        {windows.map((w) => (
          <button
            key={w}
            onClick={() => setWindowDays(w)}
            className={clsx(
              'flex-1 rounded-b-pill py-1.5 text-[13px] font-semibold transition-colors',
              windowDays === w
                ? 'bg-b-primary text-b-primary-ink'
                : 'bg-b-surface-sunken text-b-ink-2',
            )}
          >
            {w}d
          </button>
        ))}
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && <LoadingSkeleton />}

        {error && !isLoading && (
          <div className="px-4 py-6">
            <Card className="p-4">
              <p className="text-[13px] text-b-coral">
                Failed to load report data. Please try again.
              </p>
            </Card>
          </div>
        )}

        {stats && !stats.hasEnoughData && !isLoading && (
          <EmptyState windowDays={windowDays} />
        )}

        {stats && stats.hasEnoughData && !isLoading && (
          <div className="flex flex-col gap-4 px-4 pb-8 pt-1">
            {/* Executive summary — 2×2 grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Avg Daily GL"
                value={stats.avgGL.toFixed(1)}
                unit="GL"
                trend={stats.glTrend}
                trendHigherIsBetter={false}
              />
              <StatCard
                label="Avg Fiber"
                value={stats.avgFiber.toFixed(1)}
                unit="g/day"
                trend={stats.fiberTrend}
                trendHigherIsBetter={true}
              />
              <StatCard
                label="Weight Change"
                value={
                  stats.weightChange != null
                    ? `${stats.weightChange > 0 ? '+' : ''}${stats.weightChange}`
                    : '—'
                }
                unit={stats.weightChange != null ? 'kg' : undefined}
                trend={stats.weightChange != null ? stats.weightTrend : undefined}
                trendHigherIsBetter={false}
              />
              {stats.cycleLengthDays != null ? (
                <StatCard
                  label="Cycle Length"
                  value={String(stats.cycleLengthDays)}
                  unit="days"
                />
              ) : (
                <StatCard label="Cycle Length" value="—" />
              )}
            </div>

            {/* GL + Symptom chart */}
            <Card className="p-4">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.4px] text-b-ink-3">
                GL &amp; SYMPTOM TIMELINE
              </p>
              <p className="mb-3 text-[12px] text-b-ink-2">
                Daily glycemic load (line) vs symptom score (dots)
              </p>
              {/* chartRef wraps the chart for Plan 03 html2canvas capture */}
              <div ref={chartRef}>
                <GLSymptomChart
                  data={stats.chartData}
                  redFlagStreaks={stats.redFlagStreaks}
                  windowDays={windowDays}
                />
              </div>
            </Card>

            {/* Red-flag streaks */}
            <RedFlagCard streaks={stats.redFlagStreaks} />

            {/* Meal patterns */}
            <MealPatternsCard
              mealTiming={stats.mealTiming}
              mealSlotDistribution={stats.mealSlotDistribution}
            />

            {/* Data coverage note */}
            <p className="text-center text-[11px] text-b-ink-3">
              Based on {stats.daysWithData} day
              {stats.daysWithData !== 1 ? 's' : ''} with logged data in the last {windowDays}{' '}
              days
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
