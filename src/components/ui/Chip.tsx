import { clsx } from 'clsx'
import type { ReactNode } from 'react'

type ChipTone = 'neutral' | 'primary' | 'accent' | 'mint' | 'coral' | 'berry' | 'amber' | 'ghost'
type ChipSize = 'sm' | 'md'

interface ChipProps {
  children: ReactNode
  tone?: ChipTone
  size?: ChipSize
  icon?: ReactNode
  className?: string
  onClick?: () => void
}

const toneClasses: Record<ChipTone, string> = {
  neutral: 'bg-b-surface-sunken text-b-ink-2',
  primary: 'bg-b-primary-soft text-b-primary',
  accent: 'bg-b-accent-soft text-b-accent',
  mint: 'bg-b-mint-soft text-b-mint',
  coral: 'bg-b-coral-soft text-b-coral',
  berry: 'bg-b-berry-soft text-b-berry',
  amber: 'bg-b-amber-soft text-b-amber',
  ghost: 'bg-transparent text-b-ink-3 border border-b-hairline',
}

const sizeClasses: Record<ChipSize, string> = {
  sm: 'px-2 py-1 text-[11px]',
  md: 'px-2.5 py-1.5 text-xs',
}

export function Chip({ children, tone = 'neutral', size = 'md', icon, className, onClick }: ChipProps) {
  const Tag = onClick ? 'button' : 'span'
  return (
    <Tag
      onClick={onClick}
      className={clsx(
        'inline-flex items-center gap-1 rounded-b-pill font-semibold tracking-tight',
        toneClasses[tone],
        sizeClasses[size],
        className,
      )}
    >
      {icon}
      {children}
    </Tag>
  )
}
