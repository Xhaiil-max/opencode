import { useState, useRef, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../utils/cn'

export interface DropdownItem {
  id: string
  label: string
  description?: string
  icon?: ReactNode
  disabled?: boolean
  danger?: boolean
}

export interface DropdownProps {
  trigger: ReactNode | ((props: { onClick: () => void; ref: React.RefObject<HTMLElement | null> }) => ReactNode)
  items: DropdownItem[]
  onSelect: (id: string) => void
  position?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
  className?: string
}

export function Dropdown({ trigger, items, onSelect, position = 'bottom', align = 'start', className }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node) || menuRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!open || !triggerRef.current || !menuRef.current) return
    const triggerRect = triggerRef.current.getBoundingClientRect()
    const menuRect = menuRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let top = triggerRect.bottom + 4
    let left = triggerRect.left

    if (position === 'top') top = triggerRect.top - menuRect.height - 4
    if (position === 'left') left = triggerRect.left - menuRect.width - 4
    if (position === 'right') left = triggerRect.right + 4

    if (align === 'center') left = triggerRect.left + (triggerRect.width - menuRect.width) / 2
    if (align === 'end') left = triggerRect.right - menuRect.width

    if (left < 8) left = 8
    if (left + menuRect.width > viewportWidth - 8) left = viewportWidth - menuRect.width - 8
    if (top < 8) top = 8
    if (top + menuRect.height > viewportHeight - 8) top = viewportHeight - menuRect.height - 8

    menuRef.current.style.top = `${top}px`
    menuRef.current.style.left = `${left}px`
  }, [open, position, align])

  const triggerElement = typeof trigger === 'function'
    ? trigger({ onClick: () => setOpen(true), ref: triggerRef })
    : (<span ref={triggerRef}>{trigger}</span>)

  if (!open) return <>{triggerElement}</>

  return (
    <>
      {triggerElement}
      {createPortal(
        <div
          ref={menuRef}
          className={cn(
            'fixed z-[100] glass-strong rounded-xl p-1.5 shadow-elevation-4 min-w-[180px] max-w-[280px] animate-scale-in',
            className
          )}
          role="menu"
          aria-orientation="vertical">          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => { onSelect(item.id); setOpen(false) }}
              disabled={item.disabled}
              role="menuitem"
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm',
                'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-haze-500',
                item.danger
                  ? 'text-rose-400 hover:bg-rose-500/10'
                  : 'text-text-primary hover:bg-bg-tertiary',
                item.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {item.icon && <span className="flex-shrink-0 w-4 h-4" aria-hidden="true">{item.icon}</span>}
              <span className="flex-1 text-left">{item.label}</span>            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  )
}
