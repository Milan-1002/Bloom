import { clsx } from 'clsx'
import type { ReactNode } from 'react'

type IconBtnTone = 'neutral' | 'primary'
type IconBtnSize = 'sm' | 'md'

interface IconBtnProps {
  icon: ReactNode
  tone?: IconBtnTone
  size?: IconBtnSize
  badge?: number
  onClick?: () => void
  ariaLabel: string
  className?: string
}

const toneClasses: Record<IconBtnTone, string> = {
  neutral: 'bg-b-surface-sunken text-b-ink-2',
  primary: 'bg-b-primary text-b-primary-ink',
}

const sizeClasses: Record<IconBtnSize, string> = {
  sm: 'w-8 h-8',
  md: 'w-9 h-9',
}

export function IconBtn({
  icon,
  tone = 'neutral',
  size = 'md',
  badge,
  onClick,
  ariaLabel,
  className,
}: IconBtnProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={clsx(
        'relative flex items-center justify-center rounded-full shrink-0 transition-opacity',
        toneClasses[tone],
        sizeClasses[size],
        className,
      )}
    >
      {icon}
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-1 right-1 min-w-[14px] h-[14px] rounded-full bg-b-coral text-white text-[9px] font-bold flex items-center justify-center px-1 border-2 border-b-surface">
          {badge}
        </span>
      )}
    </button>
  )
}
