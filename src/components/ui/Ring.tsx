import { clsx } from 'clsx'
import type { ReactNode } from 'react'

interface RingProps {
  value: number
  max: number
  size?: number
  stroke?: number
  color?: string
  track?: string
  children?: ReactNode
  label?: string
  className?: string
}

export function Ring({
  value,
  max,
  size = 64,
  stroke = 6,
  color = 'var(--b-primary)',
  track = 'var(--b-surface-sunken)',
  children,
  label,
  className,
}: RingProps) {
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(1, value / max))
  const offset = circumference * (1 - pct)

  return (
    <div className={clsx('relative', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={track}
          strokeWidth={stroke}
          fill="none"
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {(children || label) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {children}
          {label && (
            <div className="text-[10px] font-semibold text-b-ink-3">{label}</div>
          )}
        </div>
      )}
    </div>
  )
}
