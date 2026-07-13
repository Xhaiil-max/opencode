import { type ReactNode } from 'react'
import { cn } from '../utils/cn'

export interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline' | 'dot'
  dot?: boolean
  color?: string
  className?: string
  children: ReactNode
}

export function Badge({ variant = 'default', dot, color, className, children }: BadgeProps) {
  const variants = {
    default: 'bg-bg-tertiary text-text-secondary border border-border-primary',
    success: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    danger: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
    outline: 'bg-transparent text-text-primary border border-border-secondary',
    dot: 'bg-transparent text-text-secondary border-0 px-2',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold',
        variants[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            color ||
              (variant === 'success' ? 'bg-emerald-400' :
               variant === 'warning' ? 'bg-amber-400' :
               variant === 'danger' ? 'bg-rose-400' :
               'bg-haze-400')
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  )
}
