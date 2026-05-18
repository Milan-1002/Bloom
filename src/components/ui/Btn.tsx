import { clsx } from 'clsx'
import type { ReactNode } from 'react'

type BtnTone = 'primary' | 'accent' | 'ghost' | 'danger'
type BtnSize = 'sm' | 'md' | 'lg'

interface BtnProps {
  children: ReactNode
  tone?: BtnTone
  size?: BtnSize
  full?: boolean
  icon?: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  className?: string
}

const toneClasses: Record<BtnTone, string> = {
  primary: 'bg-b-primary text-b-primary-ink',
  accent: 'bg-b-accent text-b-primary-ink',
  ghost: 'bg-transparent text-b-ink border border-b-hairline',
  danger: 'bg-b-coral text-white',
}

const sizeClasses: Record<BtnSize, string> = {
  sm: 'px-3.5 py-2 text-sm',
  md: 'px-4.5 py-3 text-sm',
  lg: 'px-6 py-3.5 text-base',
}

export function Btn({
  children,
  tone = 'primary',
  size = 'md',
  full,
  icon,
  onClick,
  type = 'button',
  disabled,
  className,
}: BtnProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'inline-flex items-center justify-center gap-1.5 rounded-b-pill font-bold tracking-tight transition-opacity',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        toneClasses[tone],
        sizeClasses[size],
        full && 'w-full',
        className,
      )}
    >
      {icon}
      {children}
    </button>
  )
}
