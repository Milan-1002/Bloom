import { clsx } from 'clsx'

interface AvatarProps {
  src?: string
  name?: string
  size?: number
  ring?: string
  className?: string
}

export function Avatar({ src, name = '', size = 36, ring, className }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const fontSize = Math.round(size * 0.36)

  return (
    <div
      className={clsx(
        'rounded-full bg-b-primary-soft text-b-primary flex items-center justify-center font-bold shrink-0',
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize,
        // Dynamic image URL — allowed inline style exception (design token values not used here)
        backgroundImage: src ? `url(${src})` : undefined,
        backgroundSize: src ? 'cover' : undefined,
        backgroundPosition: src ? 'center' : undefined,
        // Ring renders as box-shadow using caller-provided color
        boxShadow: ring ? `0 0 0 2px var(--b-surface), 0 0 0 4px ${ring}` : undefined,
      }}
      data-bloom-photo-bg={src ? '' : undefined}
    >
      {!src && initials}
    </div>
  )
}
