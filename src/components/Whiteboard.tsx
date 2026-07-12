import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  Pen, Eraser, Trash2, Download, X, Minimize2, Maximize2, MoreHorizontal
} from 'lucide-react'
import DraggablePanel from './DraggablePanel'
import { useLocalIdentity } from '../context/LiveKitContext'
import { WHITEBOARD_COLORS, WHITEBOARD_WIDTHS, type WhiteboardStroke } from '../utils/whiteboard'

interface WhiteboardProps {
  isOpen: boolean
  onClose: () => void
}

export default function Whiteboard({ isOpen, onClose }: WhiteboardProps) {
  const localIdentity = useLocalIdentity()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [strokes, setStrokes] = useState<WhiteboardStroke[]>([])
  const [currentStroke, setCurrentStroke] = useState<WhiteboardStroke | null>(null)
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen')
  const [color, setColor] = useState('#ef4444')
  const [width, setWidth] = useState(2)
  const [isDrawing, setIsDrawing] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [floating, setFloating] = useState(false)

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
  }, [tool, color, width, localIdentity, getCanvasPoint])

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !currentStroke) return
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
  }, [isDrawing, currentStroke, getCanvasPoint])

  const stopDrawing = useCallback(() => {
    if (!currentStroke) return
    setStrokes(prev => [...prev, currentStroke])
    setCurrentStroke(null)
    setIsDrawing(false)
  }, [currentStroke])

  const clearCanvas = () => {
    setStrokes([])
    setCurrentStroke(null)
  }

  const downloadCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `whiteboard-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const handleResize = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const container = canvas.parentElement
    if (!container) return
    canvas.width = container.clientWidth
    canvas.height = container.clientHeight
  }

  useEffect(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Redraw all strokes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#1e1e1e'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= canvas.width; i += 20) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, canvas.height)
      ctx.stroke()
    }
    for (let i = 0; i <= canvas.height; i += 20) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(canvas.width, i)
      ctx.stroke()
    }

    // Draw all strokes
    strokes.forEach(stroke => {
      if (stroke.points.length < 2) return
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.width
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
      }
      ctx.stroke()
    })

    // Draw current stroke
    if (currentStroke && currentStroke.points.length > 1) {
      ctx.strokeStyle = currentStroke.color
      ctx.lineWidth = currentStroke.width
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(currentStroke.points[0].x, currentStroke.points[0].y)
      for (let i = 1; i < currentStroke.points.length; i++) {
        ctx.lineTo(currentStroke.points[i].x, currentStroke.points[i].y)
      }
      ctx.stroke()
    }
  }, [strokes, currentStroke])

  if (!isOpen) return null

  const toolbar = (
    <div className="flex items-center justify-between p-2 border-b border-zinc-700 bg-zinc-800/50">
      <h3 className="text-sm font-medium">Whiteboard</h3>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setMinimized(!minimized)}
          className="p-1 rounded hover:bg-zinc-700"
          title={minimized ? 'Expand' : 'Minimize'}
        >
          {minimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
        </button>
        <button
          onClick={() => setFloating(!floating)}
          className="p-1 rounded hover:bg-zinc-700"
          title={floating ? 'Dock' : 'Float'}
        >
          <MoreHorizontal size={14} />
        </button>
        <button onClick={onClose} className="p-1 rounded hover:bg-zinc-700" title="Close">
          <X size={14} />
        </button>
      </div>
    </div>
  )

  const canvasArea = (
    <div className="flex-1 relative" style={{ touchAction: 'none' }}>\n            <canvas
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
    <div className="flex items-center gap-2 p-2 border-b border-zinc-700 bg-zinc-800/50 flex-wrap">
      <div className="flex items-center gap-1 bg-zinc-800 rounded-lg p-1">
        <button
          onClick={() => setTool('pen')}
          className={`p-1.5 rounded ${tool === 'pen' ? 'bg-indigo-600' : 'hover:bg-zinc-700'}`}
          title="Pen"
        >
          <Pen size={14} className={tool === 'pen' ? 'text-white' : 'text-zinc-400'} />
        </button>
        <button
          onClick={() => setTool('eraser')}
          className={`p-1.5 rounded ${tool === 'eraser' ? 'bg-indigo-600' : 'hover:bg-zinc-700'}`}
          title="Eraser"
        >
          <Eraser size={14} className={tool === 'eraser' ? 'text-white' : 'text-zinc-400'} />
        </button>
      </div>

      <div className="w-px h-6 bg-zinc-700 mx-1" />

      <div className="flex items-center gap-1">
        {WHITEBOARD_COLORS.map(c => (
          <button
            key={c}
            onClick={() => { setColor(c); setTool('pen'); }}
            className={`w-6 h-6 rounded border-2 transition-colors ${color === c ? 'border-white scale-110' : 'border-transparent hover:border-zinc-600'}`}
            style={{ backgroundColor: c }}
            title={c === '#000000' ? 'Black' : c === '#ffffff' ? 'White' : 'Color'}
          />
        ))}
      </div>

      <div className="w-px h-6 bg-zinc-700 mx-1" />

      <div className="flex items-center gap-1">
        <span className="text-xs text-zinc-500">Size:</span>
        {WHITEBOARD_WIDTHS.map(w => (
          <button
            key={w}
            onClick={() => setWidth(w)}
            className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${width === w ? 'bg-indigo-600' : 'hover:bg-zinc-700'}`}
            title={`${w}px`}
          >
            <div className="w-full h-0.5 bg-white rounded" style={{ width: `${Math.max(4, w * 2)}px` }} />
          </button>
        ))}
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        <button onClick={clearCanvas} className="p-1.5 rounded hover:bg-zinc-700 text-red-400" title="Clear">
          <Trash2 size={14} />
        </button>
        <button onClick={downloadCanvas} className="p-1.5 rounded hover:bg-zinc-700 text-green-400" title="Download">
          <Download size={14} />
        </button>
      </div>
    </div>
  )

  const content = (
    <div className="flex flex-col h-full bg-zinc-900">
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
      <DraggablePanel className="w-96" style={{ height: '500px' }}>
        {content}
      </DraggablePanel>,
      document.body
    )
  }

  return (
    <div className="w-full h-full" style={{ display: 'flex', flexDirection: 'column' }}>
      {content}
    </div>
  )
}
