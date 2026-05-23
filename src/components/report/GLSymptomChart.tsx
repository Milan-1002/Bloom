import {
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ResponsiveContainer,
} from 'recharts'
import { clsx } from 'clsx'
import type { ChartDatum, RedFlagStreak, ReportWindow } from '@/lib/report-stats'

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface GLSymptomChartProps {
  data: ChartDatum[]
  redFlagStreaks: RedFlagStreak[]
  windowDays: ReportWindow
  className?: string
}

// ─── X-axis helpers ────────────────────────────────────────────────────────────

function computeXTicks(data: ChartDatum[], windowDays: number): string[] {
  // Always aim for ~4–6 ticks regardless of window length
  const interval =
    windowDays <= 14  ? 3  :
    windowDays <= 30  ? 7  :
    windowDays <= 60  ? 14 :
    windowDays <= 90  ? 21 :
    windowDays <= 180 ? 30 : 60
  const ticks: string[] = []
  data.forEach((d, i) => {
    if (i === 0 || i === data.length - 1 || i % interval === 0) {
      ticks.push(d.date)
    }
  })
  return ticks
}

function formatXTick(dateStr: string): string {
  // e.g. 'Apr 23'
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// ─── Custom scatter dot ────────────────────────────────────────────────────────

const SymptomDot = (props: any) => {
  const score = props.payload?.symptomScore as number | null
  if (score == null || props.cx == null || props.cy == null) return null
  const fill = score < 3 ? 'var(--b-coral)' : 'var(--b-mint)'
  return (
    <circle
      cx={props.cx}
      cy={props.cy}
      r={5}
      fill={fill}
      fillOpacity={0.85}
      stroke="var(--b-surface)"
      strokeWidth={1.5}
    />
  )
}

// ─── Custom tooltip ────────────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const d = new Date(label + 'T12:00:00')
  const dateLabel = d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
  const gl = payload.find((p: any) => p.dataKey === 'gl')?.value as number | null
  const score = payload.find((p: any) => p.dataKey === 'symptomScore')?.value as number | null
  return (
    <div className="rounded-b-md bg-b-surface px-3 py-2 shadow-b-card text-[12px]">
      <p className="font-semibold text-b-ink">{dateLabel}</p>
      {gl != null && (
        <p className="text-b-ink-2">
          GL: <span className="font-bold text-b-fiber">{Math.round(gl)}</span>
        </p>
      )}
      {score != null && (
        <p className="text-b-ink-2">
          Symptoms: <span className="font-bold">{score.toFixed(1)}/5</span>
        </p>
      )}
    </div>
  )
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function GLSymptomChart({
  data,
  redFlagStreaks,
  windowDays,
  className,
}: GLSymptomChartProps) {
  const ticks = computeXTicks(data, windowDays)

  return (
    <div className={clsx('w-full', className)}>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--b-hairline)"
            vertical={false}
          />

          <XAxis
            dataKey="date"
            ticks={ticks}
            tickFormatter={formatXTick}
            tick={{ fontSize: 10, fill: 'var(--b-ink-3)' }}
            axisLine={false}
            tickLine={false}
          />

          {/* Left Y axis — GL values */}
          <YAxis
            yAxisId="gl"
            orientation="left"
            tick={{ fontSize: 10, fill: 'var(--b-ink-3)' }}
            axisLine={false}
            tickLine={false}
            width={28}
          />

          {/* Right Y axis — symptom score 1–5 */}
          <YAxis
            yAxisId="symptom"
            orientation="right"
            domain={[1, 5]}
            ticks={[1, 2, 3, 4, 5]}
            tick={{ fontSize: 10, fill: 'var(--b-ink-3)' }}
            axisLine={false}
            tickLine={false}
            width={16}
          />

          <Tooltip content={<ChartTooltip />} />

          {/* Red-flag streak shading */}
          {redFlagStreaks.map((streak) => (
            <ReferenceArea
              key={streak.startDate}
              yAxisId="gl"
              x1={streak.startDate}
              x2={streak.endDate}
              fill="var(--b-coral)"
              fillOpacity={0.15}
            />
          ))}

          {/* GL line */}
          <Line
            yAxisId="gl"
            dataKey="gl"
            stroke="var(--b-fiber)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: 'var(--b-fiber)' }}
            connectNulls={false}
          />

          {/* Symptom score scatter dots */}
          <Scatter
            yAxisId="symptom"
            dataKey="symptomScore"
            shape={<SymptomDot />}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend — inline below chart */}
      <div className="mt-2 flex items-center gap-4 px-1">
        <div className="flex items-center gap-1.5">
          <div className="h-0.5 w-4 rounded bg-b-fiber" />
          <span className="text-[10px] text-b-ink-3">Daily GL</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-b-mint" />
          <span className="text-[10px] text-b-ink-3">Symptoms (good)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-b-coral" />
          <span className="text-[10px] text-b-ink-3">Symptoms (low)</span>
        </div>
      </div>
    </div>
  )
}
