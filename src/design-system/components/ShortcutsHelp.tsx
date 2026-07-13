import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Keyboard } from 'lucide-react'
import { useFocusTrap } from '../hooks'

const shortcuts = [
  { section: 'Media', items: [
    { key: '⌘M', desc: 'Toggle Microphone' },
    { key: '⌘C', desc: 'Toggle Camera' },
    { key: '⌘D', desc: 'Toggle Deafen' },
    { key: '⌘S', desc: 'Toggle Screen Share' },
  ] },
  { section: 'Interaction', items: [
    { key: '⌘H', desc: 'Raise / Lower Hand' },
    { key: '⌘W', desc: 'Toggle Whiteboard' },
    { key: '⌘B', desc: 'Toggle Sidebar' },
  ] },
  { section: 'General', items: [
    { key: '⌘,', desc: 'Open Settings' },
    { key: '⌘K', desc: 'Command Palette' },
    { key: '⌘/', desc: 'Show Shortcuts' },
    { key: 'Esc', desc: 'Leave Meeting' },
  ] },
]

export function ShortcutsHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  useFocusTrap(containerRef, { enabled: open, onEscape: onClose })

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="shortcuts-title">      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden="true" />      <div
        ref={containerRef}
        className="relative w-full max-w-md max-h-[80vh] glass-strong rounded-2xl shadow-elevation-5 overflow-hidden animate-scale-in">        <div className="flex items-center justify-between p-4 border-b border-border-primary">          <h2 id="shortcuts-title" className="text-lg font-semibold text-text-primary flex items-center gap-2">            <Keyboard size={20} className="text-haze-400" aria-hidden="true" />            Keyboard Shortcuts          </h2>          <button
            onClick={onClose}
            className="btn-ghost btn-icon p-2 rounded-xl">            <X size={20} />          </button>        </div>        <div className="p-4 max-h-[calc(80vh-60px)] overflow-y-auto">          {shortcuts.map((group) => (
            <div key={group.section} className="mb-6">              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">{group.section}</h3>              <div className="space-y-2">                {group.items.map((shortcut) => (
                  <div key={shortcut.desc} className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-bg-tertiary/50 transition-colors">                    <span className="text-sm text-text-secondary">{shortcut.desc}</span>                    <kbd className="flex items-center gap-1.5 px-3 py-1 bg-bg-tertiary rounded-lg text-xs font-mono text-text-primary">                      {shortcut.key}
                    </kbd>                  </div>                ))}
              </div>            </div>          ))}
        </div>      </div>    </div>,
    document.body
  )
}
