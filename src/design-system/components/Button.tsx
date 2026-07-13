import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../utils/cn'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'glass'
  size?: 'icon-sm' | 'icon' | 'sm' | 'md' | 'lg'
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    leftIcon,
    rightIcon,
    loading,
    className,
    disabled,
    children,
    ...props
  }, ref) => {
    const baseStyles = 
      'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 ease-standard' +
      ' focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-haze-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary' +
      ' disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
      primary: 'bg-haze-500 text-bg-primary hover:bg-haze-400 active:bg-haze-600 shadow-glow',
      secondary: 'bg-violet-500/20 text-violet-400 border border-violet-500/30 hover:bg-violet-500/30 hover:border-violet-500/50',
      ghost: 'bg-transparent text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
      danger: 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 hover:border-rose-500/50',
      outline: 'bg-transparent text-text-primary border border-border-secondary hover:bg-bg-tertiary hover:border-haze-500 hover:text-haze-400',
      glass: 'bg-bg-glass text-text-primary border border-border-primary backdrop-blur-md hover:bg-bg-glass-hover',
    }

    const sizes = {
      'icon-sm': 'w-8 h-8 rounded-xl',
      'icon': 'w-10 h-10 rounded-xl',
      sm: 'h-8 px-3 text-xs rounded-lg',
      md: 'h-10 px-4 text-sm rounded-xl',
      lg: 'h-12 px-6 text-base rounded-2xl',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="31.4 31.4" strokeLinecap="round" />
          </svg>
        )}
        {!loading && leftIcon && <span className="flex-shrink-0" aria-hidden="true">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="flex-shrink-0" aria-hidden="true">{rightIcon}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'
