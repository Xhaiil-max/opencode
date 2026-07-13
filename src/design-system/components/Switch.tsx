import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../utils/cn'

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string
  description?: string
  checked?: boolean
  onChange?: (checked: boolean) => void
  className?: string
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, description, checked, onChange, className, disabled, id, ...props }, ref) => {
    const switchId = id || `switch-${Math.random().toString(36).slice(2)}`
    const descId = description ? `${switchId}-desc` : undefined

    return (
      <div className={cn('flex items-start gap-3', className)}>        <div className="relative flex-shrink-0">          <input
            ref={ref}
            type="checkbox"
            role="switch"
            id={switchId}
            checked={checked}
            onChange={(e) => onChange?.(e.target.checked)}
            disabled={disabled}
            aria-describedby={descId}
            className="peer appearance-none w-11 h-6 rounded-full bg-border-primary border border-border-secondary cursor-pointer transition-all duration-200"
            {...props}
          />          <span className="pointer-events-none absolute inset-0 flex items-center">            <span className="ml-0.5 block w-5 h-5 rounded-full bg-white shadow-lg transform transition-transform duration-200 peer-checked:translate-x-5 peer-checked:border-haze-500 peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-haze-500 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-bg-primary peer-disabled:opacity-50 peer-disabled:cursor-not-allowed" aria-hidden="true" />          </span>        </div>        {(label || description) && (
          <div className="pt-0.5">            {label && (
              <label htmlFor={switchId} className="text-sm font-medium text-text-primary cursor-pointer">{label}</label>            )}
            {description && (
              <p id={descId} className="text-xs text-text-muted mt-0.5">{description}</p>            )}
          </div>        )}
      </div>    )
  }
)
Switch.displayName = 'Switch'
