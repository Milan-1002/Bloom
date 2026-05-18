import { clsx } from 'clsx'
import type { ReactNode } from 'react'

interface AppBarProps {
  title?: string
  leading?: ReactNode
  trailing?: ReactNode
  subtitle?: string
  big?: boolean
  bg?: string
  className?: string
}

export function AppBar({ title, leading, trailing, subtitle, big, bg, className }: AppBarProps) {
  return (
    <header
      className={clsx(
        'flex items-center gap-2.5 shrink-0',
        big ? 'px-5 pt-1.5 pb-1' : 'px-4.5 pt-1.5 pb-2',
        className,
      )}
      style={bg ? { background: bg } : undefined}
    >
      {leading}
      <div className="flex-1 min-w-0">
        {subtitle && (
          <div className="text-xs font-semibold text-b-ink-3">{subtitle}</div>
        )}
        <div
          className={clsx(
            'leading-tight tracking-tight truncate',
            big
              ? 'text-2xl font-bold text-b-ink font-display'
              : 'text-[17px] font-semibold text-b-ink',
          )}
        >
          {title}
        </div>
      </div>
      {trailing && (
        <div className="flex items-center gap-2">{trailing}</div>
      )}
    </header>
  )
}
