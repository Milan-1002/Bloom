import { clsx } from 'clsx'

interface ProgressProps {
  value: number
  max: number
  color?: string
  track?: string
  height?: number
  className?: string
}

export function Progress({
  value,
  max,
  color = 'var(--b-primary)',
  track,
  height = 6,
  className,
}: ProgressProps) {
  const pct = Math.min((value / max) * 100, 100)

  return (
    <div
      className={clsx('rounded-b-pill overflow-hidden bg-b-surface-sunken', className)}
      style={{
        height,
        // Allow caller to override track color
        background: track ?? undefined,
      }}
    >
      <div
        className="h-full rounded-b-pill transition-[width] duration-300"
        style={{
          width: `${pct}%`,
          // Dynamic computed color value — allowed inline style for flexibility
          backgroundColor: color,
        }}
      />
    </div>
  )
}
