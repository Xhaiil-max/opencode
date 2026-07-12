// Whiteboard tool for collaborative drawing
export interface WhiteboardStroke {
  id: string
  points: { x: number; y: number }[]
  color: string
  width: number
  userId: string
  timestamp: number
}

export interface WhiteboardState {
  strokes: WhiteboardStroke[]
  currentStroke: WhiteboardStroke | null
}

export const WHITEBOARD_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#ffffff', // white
  '#000000', // black
]

export const WHITEBOARD_WIDTHS = [1, 2, 4, 8, 16]