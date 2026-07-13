import { useState, useRef, useEffect, type ReactNode, type ReactElement, isValidElement, cloneElement, Children } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../utils/cn'

export interface TooltipProps {
  content: string
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  className?: string
}

export function Tooltip({ content, children, position = 'top', delay = 200, className }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<number | null>(null)

  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return
    const triggerRect = triggerRef.current.getBoundingClientRect()
    const tooltipRect = tooltipRef.current.getBoundingClientRect()

    let top = triggerRect.top - tooltipRect.height - 8
    let left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2

    if (position === 'bottom') {
      top = triggerRect.bottom + 8
    } else if (position === 'left') {
      top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
      left = triggerRect.left - tooltipRect.width - 8
    } else if (position === 'right') {
      top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
      left = triggerRect.right + 8
    }

    setTooltipPosition({ top, left })
  }

  const show = () => {
    timeoutRef.current = window.setTimeout(() => {
      setVisible(true)
      requestAnimationFrame(updatePosition)
    }, delay)
  }

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setVisible(false)
  }

  useEffect(() => {
    if (visible) {
      window.addEventListener('resize', updatePosition)
      window.addEventListener('scroll', updatePosition, true)
      return () => {
        window.removeEventListener('resize', updatePosition)
        window.removeEventListener('scroll', updatePosition, true)
      }
    }
  }, [visible])

  const child = Children.only(children)
  if (!isValidElement(child)) return <>{child}</>

  const childProps = child.props as Record<string, unknown>

  return (
    <div ref={triggerRef as React.Ref<HTMLDivElement>} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide} className="inline-block">
      {cloneElement(child as ReactElement<any>, {
        onMouseEnter: (...args: unknown[]) => { show(); (childProps.onMouseEnter as ((...args: unknown[]) => void) | undefined)?.(...args) },
        onMouseLeave: (...args: unknown[]) => { hide(); (childProps.onMouseLeave as ((...args: unknown[]) => void) | undefined)?.(...args) },
        onFocus: (...args: unknown[]) => { show(); (childProps.onFocus as ((...args: unknown[]) => void) | undefined)?.(...args) },
        onBlur: (...args: unknown[]) => { hide(); (childProps.onBlur as ((...args: unknown[]) => void) | undefined)?.(...args) },
      })}
      {visible && createPortal(
        <div
          ref={tooltipRef}
          style={{ top: tooltipPosition.top, left: tooltipPosition.left }}
          className={cn(
            'fixed z-[100] glass-strong px-3 py-1.5 rounded-lg text-xs font-medium text-text-primary whitespace-nowrap shadow-elevation-4 animate-scale-in',
            className
          )}
          role="tooltip"
        >
          {content}
          <div className={
            'absolute w-0 h-0 border-4 border-transparent' +
            (position === 'top' ? 'bottom-[-8px] left-1/2 -translate-x-1/2 border-t-bg-elevated' :
             position === 'bottom' ? 'top-[-8px] left-1/2 -translate-x-1/2 border-b-bg-elevated' :
             position === 'left' ? 'right-[-8px] top-1/2 -translate-y-1/2 border-l-bg-elevated' :
             'left-[-8px] top-1/2 -translate-y-1/2 border-r-bg-elevated')
          } aria-hidden="true" />
        </div>,
        document.body
      )}
    </div>
  )
}
