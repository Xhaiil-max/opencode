import { useRef, useState, useCallback, useEffect, type ReactNode } from 'react'

interface DraggablePanelProps {
  children: ReactNode
  className?: string
  defaultX?: number
  defaultY?: number
  style?: React.CSSProperties
}

export default function DraggablePanel({
  children,
  className = '',
  defaultX = -208,
  defaultY = -120,
  style,
}: DraggablePanelProps) {
  const [pos, setPos] = useState({ x: defaultX, y: defaultY })
  const dragging = useRef(false)
  const start = useRef({ mx: 0, my: 0, x: 0, y: 0 })

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-no-drag]')) return
    dragging.current = true
    start.current = { mx: e.clientX, my: e.clientY, x: pos.x, y: pos.y }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    e.preventDefault()
  }, [pos])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return
      setPos({
        x: start.current.x + (e.clientX - start.current.mx),
        y: start.current.y + (e.clientY - start.current.my),
      })
    }
    const onUp = () => { dragging.current = false }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [])

  return (
    <div
      className={`fixed z-40 cursor-grab active:cursor-grabbing ${className}`}
      style={{
        right: 16,
        bottom: 96,
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        ...style,
      }}
      onPointerDown={onPointerDown}
    >
      {children}
    </div>
  )
}
