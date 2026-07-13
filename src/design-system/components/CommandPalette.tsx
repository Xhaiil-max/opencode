import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../utils/cn'
import { Search, Command as CommandIcon } from 'lucide-react'
import { useFocusTrap } from '../hooks'

interface CommandPaletteItem {
  id: string
  label: string
  shortcut?: string
  section?: string
  icon?: React.ReactNode
  action: () => void
  danger?: boolean
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  title?: string
  items: CommandPaletteItem[]
}

interface FilteredItem extends CommandPaletteItem {
  section: string
}

export function CommandPalette({ open, onClose, title = 'Command Palette', items }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  useFocusTrap(containerRef, { enabled: open, onEscape: onClose, initialFocus: inputRef })

  const sections = items.reduce((acc, item) => {
    const section = item.section || 'General'
    if (!acc[section]) acc[section] = []
    acc[section].push(item)
    return acc
  }, {} as Record<string, CommandPaletteItem[]>)

  const filteredItems = Object.entries(sections).flatMap(([section, sectionItems]) =>
    sectionItems
      .filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.shortcut?.toLowerCase().includes(query.toLowerCase()) ||
        item.section?.toLowerCase().includes(query.toLowerCase())
      )
      .map((item) => ({ ...item, section }) as FilteredItem)
  )

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      inputRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) => Math.min(prev + 1, filteredItems.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (filteredItems[selectedIndex]) {
            filteredItems[selectedIndex].action()
            onClose()
          }
          break
        case 'Escape':
          onClose()
          break
      }
    },
    [filteredItems, selectedIndex, onClose]
  )

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center" role="dialog" aria-modal="true" aria-label={title}>      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden="true" />      <div
        ref={containerRef}
        className="relative w-full max-w-2xl max-h-[70vh] glass-strong rounded-2xl shadow-elevation-5 overflow-hidden animate-scale-in">        <div className="flex items-center gap-3 p-4 border-b border-border-primary">          <div className="relative flex-1">            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" aria-hidden="true" />            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a command or search..."
              className="w-full bg-bg-tertiary border border-border-primary rounded-xl px-10 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-haze-500 focus:border-transparent"
              autoComplete="off"
            />          </div>          <kbd className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-bg-tertiary rounded-lg text-xs text-text-muted">            <CommandIcon size={12} aria-hidden="true" />            <span>⌘</span>            <span>K</span>          </kbd>        </div>

        <div className="max-h-[calc(70vh-80px)] overflow-y-auto p-3">          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-text-muted">              <Search size={32} className="mx-auto mb-3 opacity-50" aria-hidden="true" />              <p>No commands found</p>            </div>          ) : (
            Object.entries(
              filteredItems.reduce((acc, item) => {
                const section = item.section || 'General'
                if (!acc[section]) acc[section] = []
                acc[section].push(item)
                return acc
              }, {} as Record<string, FilteredItem[]>)
            ).map(([section, sectionItems]) => (
              <div key={section} className="mb-4">                <h3 className="px-2 py-1 text-xs font-semibold text-text-muted uppercase tracking-wide">{section}</h3>                <div role="listbox" aria-label={section}>                  {sectionItems.map((item) => {
                    const globalIndex = filteredItems.indexOf(item)
                    const isSelected = globalIndex === selectedIndex
                    return (
                      <button
                        key={item.id}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => { item.action(); onClose() }}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors',
                          isSelected
                            ? 'bg-haze-500/15 text-text-primary'
                            : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
                          item.danger && 'text-rose-400 hover:bg-rose-500/10'
                        )}
                      >
                        {item.icon && <span className="flex-shrink-0 w-5 h-5" aria-hidden="true">{item.icon}</span>}
                        <span className="flex-1 font-medium">{item.label}</span>                        {item.shortcut && (
                          <kbd className="flex items-center gap-1 px-2 py-0.5 bg-bg-tertiary rounded text-xs text-text-muted font-mono">                            {item.shortcut}
                          </kbd>                        )}
                      </button>
                    )
                  })}
                </div>              </div>            ))
          )}
        </div>      </div>    </div>,
    document.body
  )
}
