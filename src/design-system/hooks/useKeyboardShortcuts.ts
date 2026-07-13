import { useEffect, useCallback } from 'react'

export interface KeyboardShortcut {
  key: string
  meta?: boolean
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  action: () => void
  preventDefault?: boolean
  stopPropagation?: boolean
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const isInput = 
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target as HTMLElement)?.isContentEditable

      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()
        const metaMatch = !!shortcut.meta === (event.metaKey || event.ctrlKey)
        const ctrlMatch = !!shortcut.ctrl === event.ctrlKey
        const shiftMatch = !!shortcut.shift === event.shiftKey
        const altMatch = !!shortcut.alt === event.altKey

        if (keyMatch && metaMatch && ctrlMatch && shiftMatch && altMatch) {
          if (!isInput || shortcut.key === 'Escape') {
            if (shortcut.preventDefault !== false) event.preventDefault()
            if (shortcut.stopPropagation) event.stopPropagation()
            shortcut.action()
            return
          }
        }
      }
    },
    [shortcuts]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
