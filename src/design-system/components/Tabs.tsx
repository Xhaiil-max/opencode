import { type ReactNode } from 'react'
import { cn } from '../utils/cn'

export interface Tab {
  id: string
  label: string
  icon?: ReactNode
  badge?: string | number
  disabled?: boolean
}

export interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (id: string) => void
  variant?: 'pills' | 'underline' | 'enclosed'
  className?: string
  "aria-label"?: string
}

export function Tabs({ tabs, activeTab, onChange, variant = 'pills', className, "aria-label": ariaLabel }: TabsProps) {
  const variants = {
    pills: 'bg-bg-tertiary p-1 rounded-xl',
    underline: 'border-b border-border-primary pb-1',
    enclosed: 'bg-bg-tertiary rounded-xl p-1',
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn('flex gap-1', variants[variant], className)}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`${tab.id}-panel`}
          id={`${tab.id}-tab`}
          onClick={() => !tab.disabled && onChange(tab.id)}
          disabled={tab.disabled}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-haze-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
            tab.disabled
              ? 'opacity-50 cursor-not-allowed'
              : activeTab === tab.id
              ? variant === 'pills'
                ? 'bg-haze-500/20 text-haze-400 shadow-inner'
                : variant === 'underline'
                ? 'border-b-2 border-haze-500 text-haze-400'
                : 'bg-bg-primary text-text-primary'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary/50'
          )}
        >
          {tab.icon && <span className="flex-shrink-0" aria-hidden="true">{tab.icon}</span>}
          {tab.label}
          {tab.badge !== undefined && (
            <span className="flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-xs font-semibold rounded-full bg-haze-500/20 text-haze-400">
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
