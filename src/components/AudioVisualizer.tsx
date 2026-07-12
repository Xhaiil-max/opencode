interface AudioVisualizerProps {
  level: number
  className?: string
  bars?: number
}

export default function AudioVisualizer({ level, className = '', bars = 12 }: AudioVisualizerProps) {
  return (
    <div className={`flex items-end gap-0.5 h-4 ${className}`}>
      {Array.from({ length: bars }).map((_, i) => {
        const threshold = ((i + 1) / bars) * 100
        const active = level >= threshold - 8
        const height = active ? Math.min(100, 30 + (level / 100) * 70 * ((i + 1) / bars)) : 15
        return (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-75 ${
              active ? 'bg-gradient-to-t from-indigo-500 to-violet-400' : 'bg-zinc-600'
            }`}
            style={{ height: `${height}%` }}
          />
        )
      })}
    </div>
  )
}

interface AudioLevelBarProps {
  level: number
  isSpeaking?: boolean
  className?: string
}

export function AudioLevelBar({ level, isSpeaking, className = '' }: AudioLevelBarProps) {
  const display = isSpeaking ? Math.max(level, 35) : level
  return (
    <div className={`h-1.5 bg-zinc-700 rounded-full overflow-hidden flex-1 min-w-[48px] ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-100 ${
          isSpeaking ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-indigo-500'
        }`}
        style={{ width: `${display}%` }}
      />
    </div>
  )
}
