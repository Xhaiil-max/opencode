import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  Pen, Eraser, Trash2, Download, X, Minimize2, Maximize2, MoreHorizontal
} from 'lucide-react'
import DraggablePanel from './DraggablePanel'
import { useLocalIdentity, useRoom } from '../context/LiveKitContext'
import { WHITEBOARD_COLORS, WHITEBOARD_WIDTHS, type WhiteboardStroke } from '../utils/whiteboard'

// roundRect polyfill for older browsers
function roundRectPolyfill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r)
    return
  }
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

// Extend Window interface for throttle tracking
declare global {
  interface Window {
    lastCursorSend: number
  }
}

interface WhiteboardProps {
  isOpen: boolean
  onClose: () => void
  disableWhiteboardDrawing?: boolean
  isLocalHost?: boolean
  users?: { id: string; name: string }[]
}

interface CursorPosition {
  x: number
  y: number
  userId: string
  timestamp: number
}

export default function Whiteboard({ isOpen: _isOpen, onClose, disableWhiteboardDrawing, isLocalHost, users = [] }: WhiteboardProps) {
  const localIdentity = useLocalIdentity()
  const room = useRoom()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const publish = useCallback((payload: object) => {
    if (!room) return
    const data = new TextEncoder().encode(JSON.stringify(payload))
    room.localParticipant.publishData(data, { reliable: true })
  }, [room])
  const cursorSendRef = useRef<number>(0)
  const [strokes, setStrokes] = useState<WhiteboardStroke[]>([])
  const [currentStroke, setCurrentStroke] = useState<WhiteboardStroke | null>(null)
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen')
  const [color, setColor] = useState('#ef4444')
  const [width, setWidth] = useState(2)
  const [isDrawing, setIsDrawing] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [floating, setFloating] = useState(false)
  const [cursors, setCursors] = useState<CursorPosition[]>([])

  const canDraw = isLocalHost || !disableWhiteboardDrawing

  // Subscribe to whiteboard updates from other participants
  useEffect(() => {
    if (!room) return

    const handleDataReceived = (payload: Uint8Array, _participant?: { identity: string }) => {
      try {
        const data = JSON.parse(new TextDecoder().decode(payload))
        if (data.type === 'whiteboardStroke' && data.stroke) {
          // Only add strokes from other users
          if (data.stroke.userId !== localIdentity) {
            setStrokes(prev => [...prev, data.stroke])
          }
        } else if (data.type === 'whiteboardClear') {
          setStrokes([])
        } else if (data.type === 'cursorMove' && data.cursor) {
          // Update cursor position for other users
          if (data.cursor.userId !== localIdentity) {
            setCursors(prev => {
              // Remove old cursor for this user and add new one
              const filtered = prev.filter(cursor => cursor.userId !== data.cursor!.userId)
              return [...filtered, data.cursor]
            })
          }
        }
      } catch {
        // Ignore non-JSON data
      }
    }

    room.on('dataReceived', handleDataReceived)
    return () => {
      room.off('dataReceived', handleDataReceived)
    }
  }, [room, localIdentity])

  // Broadcast cursor position
  useEffect(() => {
    if (!room || !canvasRef.current) return

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const pos = {
        x: ((e.clientX - rect.left) / rect.width) * 100, // Percentage for responsive positioning
        y: ((e.clientY - rect.top) / rect.height) * 100,
        userId: localIdentity,
        timestamp: Date.now()
      }

      // Broadcast cursor position (throttle to avoid too many messages)
      if (Date.now() - (cursorSendRef.current || 0) > 100) {
        publish({ type: 'cursorMove', cursor: pos })
        cursorSendRef.current = Date.now()
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const pos = {
        x: ((e.touches[0].clientX - rect.left) / rect.width) * 100,
        y: ((e.touches[0].clientY - rect.top) / rect.height) * 100,
        userId: localIdentity,
        timestamp: Date.now()
      }

      // Broadcast cursor position (throttle to avoid too many messages)
      if (Date.now() - (cursorSendRef.current || 0) > 100) {
        publish({ type: 'cursorMove', cursor: pos })
        cursorSendRef.current = Date.now()
      }
    }

    canvasRef.current.addEventListener('mousemove', handleMouseMove)
    canvasRef.current.addEventListener('touchmove', handleTouchMove)

    return () => {
      canvasRef.current?.removeEventListener('mousemove', handleMouseMove)
      canvasRef.current?.removeEventListener('touchmove', handleTouchMove)
    }
  }, [room, localIdentity, publish])

  const broadcastStroke = useCallback((stroke: WhiteboardStroke) => {
    publish({ type: 'whiteboardStroke', stroke })
  }, [publish])

  const getCanvasPoint = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    // Return CSS-pixel coordinates. The context has setTransform(dpr,...) so these
    // will be correctly mapped to device pixels by the canvas API.
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    }
  }, [])

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!canDraw) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const point = getCanvasPoint(e)
    const newStroke: WhiteboardStroke = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      points: [point],
      color: tool === 'eraser' ? '#000000' : color,
      width: tool === 'eraser' ? width * 3 : width,
      userId: localIdentity,
      timestamp: Date.now(),
      isEraser: tool === 'eraser'
    }
    setCurrentStroke(newStroke)
    setIsDrawing(true)
  }, [tool, color, width, localIdentity, getCanvasPoint, canDraw])

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !currentStroke || !canDraw) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const point = getCanvasPoint(e)
    const updatedStroke = { ...currentStroke, points: [...currentStroke.points, point] }
    setCurrentStroke(updatedStroke)

    ctx.globalCompositeOperation = updatedStroke.isEraser ? 'destination-out' : 'source-over'
    ctx.strokeStyle = updatedStroke.color
    ctx.lineWidth = updatedStroke.width
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(currentStroke.points[currentStroke.points.length - 1].x, currentStroke.points[currentStroke.points.length - 1].y)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
    ctx.globalCompositeOperation = 'source-over'
  }, [isDrawing, currentStroke, getCanvasPoint, canDraw])

  const stopDrawing = useCallback(() => {
    if (!currentStroke) return
    setStrokes(prev => [...prev, currentStroke])
    broadcastStroke(currentStroke)
    setCurrentStroke(null)
    setIsDrawing(false)
  }, [currentStroke, broadcastStroke])

  const clearCanvas = () => {
    if (!canDraw) return
    setStrokes([])
    publish({ type: 'whiteboardClear' })
  }

  const downloadCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `whiteboard-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      redrawAll()
    }

    const redrawAll = () => {
      const dpr = window.devicePixelRatio || 1
      const cssWidth = canvas.width / dpr
      const cssHeight = canvas.height / dpr

      ctx.clearRect(0, 0, cssWidth, cssHeight)
      ctx.fillStyle = '#0f0f0f'
      ctx.fillRect(0, 0, cssWidth, cssHeight)
      strokes.forEach(stroke => {
        if (stroke.points.length < 2) return
        ctx.globalCompositeOperation = stroke.isEraser ? 'destination-out' : 'source-over'
        ctx.strokeStyle = stroke.color
        ctx.lineWidth = stroke.width
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        // Points are stored in CSS pixels (matching the ctx transform).
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
        }
        ctx.stroke()
      })
      ctx.globalCompositeOperation = 'source-over'

      // Draw remote cursors — positions are percentage-based (0-100)
      cursors.forEach(cursor => {
        if (cursor.userId === localIdentity) return
        const cx = (cursor.x / 100) * cssWidth
        const cy = (cursor.y / 100) * cssHeight

        // Cursor ring
        ctx.beginPath()
        ctx.arc(cx, cy, 6, 0, Math.PI * 2)
        ctx.fillStyle = '#8b5cf6'
        ctx.fill()
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 1.5
        ctx.stroke()

        // Name label — look up real name from users, fall back to abbreviated identity
        const cursorUser = users.find(u => u.id === cursor.userId)
        const displayName = cursorUser ? cursorUser.name : (cursor.userId.length > 12 ? cursor.userId.substring(0, 12) + '...' : cursor.userId)
        ctx.font = 'bold 11px sans-serif'
        const textMetrics = ctx.measureText(displayName)
        const labelW = textMetrics.width + 10
        const labelH = 18
        const labelX = cx + 8
        const labelY = cy - 18

        ctx.fillStyle = '#8b5cf6'
        ctx.beginPath()
        roundRectPolyfill(ctx, labelX, labelY, labelW, labelH, 4)
        ctx.fill()

        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        ctx.fillText(displayName, labelX + 5, labelY + labelH / 2)
      })
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [strokes, cursors, localIdentity])

  // Clean up old cursors
  useEffect(() => {
    const cleanupOldCursors = () => {
      const now = Date.now()
      setCursors(prev => prev.filter(cursor => now - cursor.timestamp < 3000)) // Remove cursors older than 3 seconds
    }

    const interval = setInterval(cleanupOldCursors, 1000)
    return () => clearInterval(interval)
  }, [])

  const toolbar = (
    <div className="flex items-center justify-between p-2 border-b border-border-primary glass shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#ef4444' }}>  
          <Pen size={16} className="text-white" />  
        </div>
        <span className="text-sm font-medium text-text-primary">Whiteboard</span>
        {!canDraw && (
          <span className="text-xs text-accent-warning px-2 py-0.5 rounded-full bg-accent-warning/20">View Only</span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setMinimized(!minimized)}
          className="p-1.5 rounded-lg hover:bg-bg-tertiary transition-colors text-text-secondary hover:text-text-primary"
          title={minimized ? 'Expand' : 'Minimize'}
        >
          {minimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
        </button>
        <button
          onClick={() => setFloating(!floating)}
          className="p-1.5 rounded-lg hover:bg-bg-tertiary transition-colors text-text-secondary hover:text-text-primary"
          title={floating ? 'Dock' : 'Float'}
        >
          <MoreHorizontal size={14} />
        </button>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-tertiary transition-colors text-text-secondary hover:text-text-primary" title="Close">
          <X size={14} />
        </button>
      </div>
    </div>
  )

  const canvasArea = (
    <div className="flex-1 relative overflow-hidden bg-bg-secondary">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
    </div>
  )

  const toolsPanel = (
    <div className="flex items-center gap-2 p-2 border-b border-border-primary bg-bg-tertiary/50 flex-wrap">
      <div className="flex items-center gap-1 bg-bg-secondary rounded-lg p-1">
        <button
          onClick={() => setTool('pen')}
          className={`p-1.5 rounded ${tool === 'pen' ? 'bg-haze-500 text-white' : 'hover:bg-bg-tertiary text-text-secondary'}`}
          title="Pen"
        >
          <Pen size={14} />
        </button>
        <button
          onClick={() => setTool('eraser')}
          className={`p-1.5 rounded ${tool === 'eraser' ? 'bg-haze-500 text-white' : 'hover:bg-bg-tertiary text-text-secondary'}`}
          title="Eraser"
        >
          <Eraser size={14} />
        </button>
      </div>

      <div className="w-px h-6 bg-border-primary mx-1" />

      <div className="flex items-center gap-1">
        {WHITEBOARD_COLORS.map(c => (
          <button
            key={c}
            onClick={() => { setColor(c); setTool('pen'); }}
            className={`w-6 h-6 rounded border-2 transition-colors ${color === c ? 'border-white scale-110' : 'border-transparent hover:border-border-primary'}`}
            style={{ backgroundColor: c }}
            title={c === '#000000' ? 'Black' : c === '#ffffff' ? 'White' : 'Color'}
          />
        ))}
      </div>

      <div className="w-px h-6 bg-border-primary mx-1" />

      <div className="flex items-center gap-1">
        <span className="text-xs text-text-muted">Size:</span>
        {WHITEBOARD_WIDTHS.map(w => (
          <button
            key={w}
            onClick={() => setWidth(w)}
            className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${width === w ? 'bg-haze-500' : 'hover:bg-bg-tertiary'}`}
            title={`${w}px`}
          >
            <div className="w-full h-0.5 bg-white rounded" style={{ width: `${Math.max(4, w * 2)}px` }} />
          </button>
        ))}
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        <button onClick={clearCanvas} disabled={!canDraw} className="p-1.5 rounded hover:bg-bg-tertiary transition-colors text-accent-error opacity-50" title="Clear">
          <Trash2 size={14} />
        </button>
        <button onClick={downloadCanvas} className="p-1.5 rounded hover:bg-bg-tertiary transition-colors text-accent-success" title="Download">
          <Download size={14} />
        </button>
      </div>
    </div>
  )

  const content = (
    <div className="flex flex-col h-full bg-bg-primary">
      {toolbar}
      {!minimized && (
        <div className="flex-1 flex flex-col relative">
          {toolsPanel}
          {canvasArea}
        </div>
      )}
    </div>
  )

  if (floating) {
    return createPortal(
      <DraggablePanel className="w-96 max-w-[90vw] max-h-[90vh]" style={{ height: 'auto', maxHeight: '500px' }}>
        {content}
      </DraggablePanel>,
      document.body
    )
  }

  return (
    <div className="w-[600px] h-[400px] max-w-full max-h-[80vh] mx-auto my-4" style={{ display: 'flex', flexDirection: 'column' }}>
      {content}
    </div>
  )
}
