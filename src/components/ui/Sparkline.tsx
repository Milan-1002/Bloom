import { clsx } from 'clsx'

interface SparklineProps {
  data: number[]
  w?: number
  h?: number
  color?: string
  fill?: boolean
  dots?: boolean
  dotColor?: string
  className?: string
}

export function Sparkline({
  data,
  w = 80,
  h = 32,
  color = 'var(--b-accent)',
  fill,
  dots,
  dotColor,
  className,
}: SparklineProps) {
  if (!data || data.length === 0) return null

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const pts = data.map((v, i) => {
    const x = data.length === 1 ? w / 2 : (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 8) - 4
    return [x, y] as [number, number]
  })

  const linePath = pts
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ')

  const areaPath = `M0 ${h} L${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L')} L${w} ${h} Z`

  return (
    <svg
      width={w}
      height={h}
      className={clsx('block overflow-visible', className)}
    >
      {fill && (
        <path d={areaPath} fill={color} opacity={0.15} />
      )}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {dots &&
        pts.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={i === pts.length - 1 ? 4 : 2.5}
            fill={dotColor ?? color}
            stroke="var(--b-surface)"
            strokeWidth="2"
          />
        ))}
    </svg>
  )
}
