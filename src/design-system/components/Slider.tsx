import { useRef, useState } from 'react'
import { cn } from '../utils/cn'

export interface SliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
  showValue?: boolean
  className?: string
  disabled?: boolean
  "aria-label"?: string
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  showValue = false,
  className,
  disabled,
  "aria-label": ariaLabel,
}: SliderProps) {
  const [focused, setFocused] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)
  const id = `slider-${Math.random().toString(36).slice(2)}`

  const percentage = ((value - min) / (max - min)) * 100
  const clampedPercentage = Math.max(0, Math.min(100, percentage))

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return
    e.preventDefault()
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleTouchStart = (_e: React.TouchEvent) => {
    if (disabled) return
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const newPercentage = ((e.clientX - rect.left) / rect.width) * 100
    updateValue(newPercentage)
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!trackRef.current) return
    e.preventDefault()
    const rect = trackRef.current.getBoundingClientRect()
    const newPercentage = ((e.touches[0].clientX - rect.left) / rect.width) * 100
    updateValue(newPercentage)
  }

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  const handleTouchEnd = () => {
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleTouchEnd)
  }

  const updateValue = (newPercentage: number) => {
    const clamped = Math.max(0, Math.min(100, newPercentage))
    const newValue = min + (clamped / 100) * (max - min)
    const stepped = Math.round(newValue / step) * step
    const finalValue = Math.max(min, Math.min(max, stepped))
    onChange(finalValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    let newValue = value
    const stepValue = step
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        e.preventDefault()
        newValue = Math.min(max, value + stepValue)
        break
      case 'ArrowLeft':
      case 'ArrowDown':
        e.preventDefault()
        newValue = Math.max(min, value - stepValue)
        break
      case 'Home':
        e.preventDefault()
        newValue = min
        break
      case 'End':
        e.preventDefault()
        newValue = max
        break
      case 'PageUp':
        e.preventDefault()
        newValue = Math.min(max, value + stepValue * 10)
        break
      case 'PageDown':
        e.preventDefault()
        newValue = Math.max(min, value - stepValue * 10)
        break
      default:
        return
    }
    onChange(newValue)
  }

  return (
    <div className={cn('w-full', className)}>      {label && (
        <div className="flex items-center justify-between mb-2">          <label htmlFor={id} className="text-sm font-medium text-text-primary">{label}</label>          {showValue && (
            <span id={`${id}-value`} className="text-sm font-mono text-text-secondary">              {step < 1 ? value.toFixed(1) : Math.round(value)}</span>          )}
        </div>      )}
      <div
        ref={trackRef}
        role="slider"
        id={id}
        aria-label={ariaLabel}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={showValue ? `${value}${step < 1 ? '' : ''}` : undefined}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        className={cn(
          'relative h-2 rounded-full bg-bg-tertiary cursor-pointer touch-none',
          disabled && 'opacity-50 cursor-not-allowed',
          focused && 'ring-4 ring-haze-500/30'
        )}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >        <div
          className="absolute top-1/2 left-0 h-2 -translate-y-1/2 rounded-full bg-gradient-to-r from-haze-500 to-violet-500 transition-all duration-75 ease-out"
          style={{ width: `${clampedPercentage}%` }}
          aria-hidden="true"
        />        <div
          ref={thumbRef}
          className={cn(
            'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-haze-500 shadow-lg',
            'transition-transform duration-75 ease-out',
            focused && 'scale-125 ring-4 ring-haze-500/30',
            disabled && 'opacity-50'
          )}
          style={{ left: `${clampedPercentage}%` }}
          aria-hidden="true"
        />      </div>    </div>
  )
}
