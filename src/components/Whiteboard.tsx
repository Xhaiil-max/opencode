import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  Pen, Eraser, Trash2, Download, X, Minimize2, Maximize2, MoreHorizontal
} from 'lucide-react'
import DraggablePanel from './DraggablePanel'
import { useLocalIdentity, useRoom } from '../context/LiveKitContext'
import { useLiveKit } from '../hooks/useLiveKit'
import { WHITEBOARD_COLORS, WHITEBOARD_WIDTHS, type WhiteboardStroke } from '../utils/whiteboard'

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
}

interface CursorPosition {
  x: number
  y: number
  userId: string
  timestamp: number
}

export default function Whiteboard({ isOpen: _isOpen, onClose, disableWhiteboardDrawing, isLocalHost }: WhiteboardProps) {
  const localIdentity = useLocalIdentity()
  const room = useRoom()
  const { publishData } = useLiveKit({ username: localIdentity, roomName: '' })
  const canvasRef = useRef<HTMLCanvasElement>(null)
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
      if (Date.now() - (window.lastCursorSend || 0) > 100) {
        publishData({ type: 'cursorMove', cursor: pos })
        window.lastCursorSend = Date.now()
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
      if (Date.now() - (window.lastCursorSend || 0) > 100) {
        publishData({ type: 'cursorMove', cursor: pos })
        window.lastCursorSend = Date.now()
      }
    }

    canvasRef.current.addEventListener('mousemove', handleMouseMove)
    canvasRef.current.addEventListener('touchmove', handleTouchMove)

    return () => {
      canvasRef.current?.removeEventListener('mousemove', handleMouseMove)
      canvasRef.current?.removeEventListener('touchmove', handleTouchMove)
    }
  }, [room, localIdentity, publishData])

  const broadcastStroke = useCallback((stroke: WhiteboardStroke) => {
    publishData({ type: 'whiteboardStroke', stroke })
  }, [publishData])

  const getCanvasPoint = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
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
      timestamp: Date.now()
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

    ctx.strokeStyle = updatedStroke.color
    ctx.lineWidth = updatedStroke.width
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(currentStroke.points[currentStroke.points.length - 1].x, currentStroke.points[currentStroke.points.length - 1].y)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
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
    publishData({ type: 'whiteboardClear' })
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
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
      redrawAll()
    }

    const redrawAll = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#0f0f0f'
      ctx.fillRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio)
      strokes.forEach(stroke => {
        if (stroke.points.length < 2) return
        ctx.strokeStyle = stroke.color
        ctx.lineWidth = stroke.width
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
        for (let i = 1; i < stroke.points.length; i++) {
          // Convert percentage coordinates back to pixel coordinates
          const px = (stroke.points[i].x / 100) * canvas.width
          const py = (stroke.points[i].y / 100) * canvas.height
          ctx.lineTo(px, py)
        }
        ctx.stroke()
      })

      // Draw cursors for other users
      cursors.forEach(cursor => {
        // Skip drawing our own cursor
        if (cursor.userId === localIdentity) return

        // Convert percentage coordinates to pixel coordinates
        const cx = (cursor.x / 100) * canvas.width
        const cy = (cursor.y / 100) * canvas.height

        // Draw cursor dot
        ctx.fillStyle = '#00bfff'
        ctx.beginPath()
        ctx.arc(cx, cy, 4, 0, Math.PI * 2)
        ctx.fill()

        // Draw cursor label
        ctx.fillStyle = '#ffffff'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'center'
        // Show abbreviated user ID for privacy
        const userId = cursor.userId.length > 8 ? cursor.userId.substring(0, 8) + '...' : cursor.userId
        ctx.fillText(userId, cx, cy - 10)
      })
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [strokes])

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
      if (Date.now() - (window.lastCursorSend || 0) > 100) {
        publishData({ type: 'cursorMove', cursor: pos })
        window.lastCursorSend = Date.now()
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
      if (Date.now() - (window.lastCursorSend || 0) > 100) {
        publishData({ type: 'cursorMove', cursor: pos })
        window.lastCursorSend = Date.now()
      }
    }

    canvasRef.current.addEventListener('mousemove', handleMouseMove)
    canvasRef.current.addEventListener('touchmove', handleTouchMove)

    return () => {
      canvasRef.current?.removeEventListener('mousemove', handleMouseMove)
      canvasRef.current?.removeEventListener('touchmove', handleTouchMove)
    }
  }, [room, localIdentity, publishData])

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
