import { clsx } from 'clsx'
import type { ReactNode } from 'react'

type CardPad = 'sm' | 'md' | 'lg'

interface CardProps {
  children: ReactNode
  pad?: CardPad
  className?: string
}

const padClasses: Record<CardPad, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
}

export function Card({ children, pad = 'md', className }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-b-surface rounded-b-md shadow-b-card border border-b-hairline',
        padClasses[pad],
        className,
      )}
    >
      {children}
    </div>
  )
}
