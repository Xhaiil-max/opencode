import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../utils/cn'
import { MessageSquare } from 'lucide-react'

const REACTIONS = [
  { id: 'like', emoji: '👍', label: 'Like' },
  { id: 'love', emoji: '❤️', label: 'Love' },
  { id: 'laugh', emoji: '😂', label: 'Laugh' },
  { id: 'celebrate', emoji: '🎉', label: 'Celebrate' },
  { id: 'fire', emoji: '🔥', label: 'Fire' },
  { id: 'zap', emoji: '⚡', label: 'Zap' },
] as const

export interface Reaction {
  id: string
  emoji: string
  count: number
  userReacted: boolean
  label?: string
}

export interface ReactionsBarProps {
  reactions: Reaction[]
  onReact: (reactionId: string) => void
  position?: 'bottom-right' | 'bottom-left' | 'top-right'
  className?: string
}

export function ReactionsBar({ reactions, onReact, position = 'bottom-right', className }: ReactionsBarProps) {
  const [showPicker, setShowPicker] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setShowPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const positionStyles = {
    'bottom-right': 'bottom-full right-0 mb-2',
    'bottom-left': 'bottom-full left-0 mb-2',
    'top-right': 'top-full right-0 mt-2',
  }

  return (
    <div className={cn('relative inline-flex', className)}>      <div className="flex items-end gap-1" role="group" aria-label="Reactions">        {reactions.map((reaction, index) => (
          <button
            key={reaction.id}
            onClick={() => onReact(reaction.id)}
            className={cn(
              'relative flex items-center justify-center gap-1 px-2 py-1 rounded-full',
              'transition-all duration-200 ease-spring',
              'hover:scale-110 active:scale-95',
              reaction.userReacted
                ? 'bg-haze-500/20 ring-2 ring-haze-500/50 shadow-glow'
                : 'bg-bg-tertiary hover:bg-bg-elevated',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-haze-500',
              'animate-bounce-in'
            )}
            style={{ animationDelay: `${index * 50}ms` } as React.CSSProperties}
            aria-label={`${reaction.emoji} ${reaction.label || reaction.id} (${reaction.count})${reaction.userReacted ? ', pressed' : ''}`}
            aria-pressed={reaction.userReacted}
          >            <span className="text-lg" aria-hidden="true">{reaction.emoji}</span>            {reaction.count > 0 && (
              <span className={cn(
                'text-xs font-medium whitespace-nowrap',
                reaction.userReacted ? 'text-haze-400' : 'text-text-secondary'
              )}>{reaction.count}</span>            )}
          </button>        ))}

        <button
          ref={triggerRef}
          onClick={() => setShowPicker(!showPicker)}
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-full',
            'bg-bg-tertiary hover:bg-bg-elevated',
            'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-haze-500'
          )}
          aria-label="Add reaction"
          aria-expanded={showPicker}
          aria-haspopup="true"
        >          <MessageSquare className="h-4 w-4 text-text-secondary" aria-hidden="true" />        </button>      </div>

      {showPicker && createPortal(
        <div
          ref={pickerRef}
          className={cn(
            'fixed z-[100] glass-strong rounded-xl p-2 shadow-elevation-5',
            'animate-scale-in',
            positionStyles[position]
          )}
          role="menu"
          aria-label="Choose reaction">          <div className="flex items-center gap-1" role="none">            {REACTIONS.map((reaction, index) => (
              <button
                key={reaction.id}
                role="menuitem"
                onClick={() => { onReact(reaction.id); setShowPicker(false); }}
                className={cn(
                  'relative flex items-center justify-center w-10 h-10 rounded-xl',
                  'bg-bg-tertiary hover:bg-bg-elevated',
                  'transition-all duration-150 ease-out',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-haze-500',
                  'animate-bounce-in'
                )}
                style={{ animationDelay: `${index * 30}ms` } as React.CSSProperties}
                aria-label={reaction.label}
              >                <span className="text-2xl" aria-hidden="true">{reaction.emoji}</span>              </button>            ))}
          </div>        </div>,
        document.body
      )}
    </div>  )
}

export interface FloatingReactionProps {
  emoji: string
  x: number
  y: number
  onComplete: () => void
}

export function FloatingReaction({ emoji, x, y, onComplete }: FloatingReactionProps) {
  useEffect(() => {
    const timer = setTimeout(() => onComplete(), 2000)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div
      className="fixed pointer-events-none z-[200] animate-float-up"
      style={{
        left: x,
        top: y,
        fontSize: '2rem',
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))',
      } as React.CSSProperties}
      aria-hidden="true">      {emoji}
    </div>  )
}
