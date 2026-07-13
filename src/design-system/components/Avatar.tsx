import { type ReactNode } from 'react'
import { cn } from '../utils/cn'

export interface AvatarProps {
  src?: string
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  status?: 'online' | 'offline' | 'busy' | 'away'
  className?: string
  children?: ReactNode
}

export function Avatar({
  src,
  name,
  size = 'md',
  status,
  className,
  children,
}: AvatarProps) {
  const sizes = {
    xs: 'w-5 h-5 text-[0.6rem]',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-24 h-24 text-2xl',
  }

  const statusSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
    '2xl': 'w-5 h-5',
  }

  const statusColors = {
    online: 'bg-emerald-400',
    offline: 'bg-text-muted',
    busy: 'bg-rose-400',
    away: 'bg-amber-400',
  }

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const hue = hash % 360
  const bgColor = `hsl(${hue}, 65%, 45%)`

  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      {children || (
        <>
          {src ? (
            <img
              src={src}
              alt=""
              className={cn('rounded-full object-cover', sizes[size])}
              loading="lazy"
            />
          ) : (
            <div
              className={cn('rounded-full flex items-center justify-center font-medium text-white', sizes[size])}
              style={{ backgroundColor: bgColor }}
              aria-hidden="true"
            >
              {initials}
            </div>
          )}
          {status && (
            <span
              className={cn(
                'absolute bottom-0 right-0 rounded-full border-2 border-bg-primary',
                statusColors[status],
                statusSizes[size]
              )}
              aria-label={`Status: ${status}`}
            />
          )}
        </>
      )}
    </div>
  )
}
