import { useEffect, useRef } from 'react'

interface FocusTrapOptions {
  enabled?: boolean
  onEscape?: () => void
  initialFocus?: React.RefObject<HTMLElement | null>
  returnFocus?: boolean
}

export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  options: FocusTrapOptions = {}
) {
  const { enabled = true, onEscape, initialFocus, returnFocus = true } = options
  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!enabled || !containerRef.current) return

    const container = containerRef.current
    previousActiveElement.current = document.activeElement as HTMLElement

    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement?.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement?.focus()
          }
        }
      } else if (e.key === 'Escape' && onEscape) {
        onEscape()
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    ;(initialFocus?.current || firstElement)?.focus()

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
      if (returnFocus && previousActiveElement.current) {
        previousActiveElement.current.focus()
      }
    }
  }, [containerRef, enabled, onEscape, initialFocus, returnFocus])
}
