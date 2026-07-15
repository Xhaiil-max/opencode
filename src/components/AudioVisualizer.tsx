import { useEffect, useState } from 'react'

interface AudioVisualizerProps {
  level: number
  className?: string
  bars?: number
  type?: 'bars' | 'waveform' | 'dots'
  color?: string
}

export default function AudioVisualizer({
  level,
  className = '',
  bars = 12,
  type = 'bars',
  color
}: AudioVisualizerProps) {
  // Smooth the level for better visual experience - faster response
  const [smoothedLevel, setSmoothedLevel] = useState(0)

  useEffect(() => {
    // Smooth the audio level to reduce jitter - faster attack, slower decay
    const frame = requestAnimationFrame(() => {
      if (level > smoothedLevel) {
        // Fast attack - immediately follow the level
        setSmoothedLevel(level)
      } else {
        // Slower decay - 15% per frame
        setSmoothedLevel(prev => prev * 0.85 + level * 0.15)
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [level])

  if (type === 'waveform') {
    return (
      <div className={`h-4 w-full rounded overflow-hidden bg-zinc-800/20 ${className}`}>
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-400"
          style={{ width: `${Math.min(smoothedLevel, 100)}%` }}
        />
      </div>
    )
  }

  if (type === 'dots') {
    const base = color || '#818cf8'
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {Array.from({ length: 5 }).map((_, i) => {
          const height = Math.min(20, (smoothedLevel / 100) * 20 * (0.5 + i * 0.1))
          const opacity = 0.3 + (Math.min(smoothedLevel, 100) / 100) * 0.7
          return (
            <div
              key={i}
              className="w-1.5 rounded-full transition-all duration-75 ease-out"
              style={{
                height: `${height}px`,
                backgroundColor: base,
                opacity,
              }}
            />
          )
        })}
      </div>
    )
  }

  // Default bars type
  return (
    <div className={`flex items-end gap-0.5 h-4 ${className}`}>
      {Array.from({ length: bars }).map((_, i) => {
        const threshold = ((i + 1) / bars) * 100
        const active = smoothedLevel >= threshold - 8
        const height = active ? Math.min(100, 30 + (smoothedLevel / 100) * 70 * ((i + 1) / bars)) : 15
        return (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-50 ${
              active ? 'bg-gradient-to-t from-indigo-500 to-violet-400' : 'bg-zinc-600'
            }`}
            style={{ height: `${height}%` }}
          />
        )
      })}
    </div>
  )
}

export function WaveformDots({ level, isSpeaking, color, className = '' }: { level: number; isSpeaking?: boolean; color?: string; className?: string }) {
  const [smoothedLevel, setSmoothedLevel] = useState(0)

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      // Fast attack, quick decay for accurate, low-latency response
      if (level > smoothedLevel) {
        setSmoothedLevel(level)
      } else {
        setSmoothedLevel(prev => prev * 0.7 + level * 0.3)
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [level])

  const base = color || '#818cf8'
  const active = isSpeaking || smoothedLevel > 4

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const t = i / 4
        // Smooth waveform shape across the 5 dots
        const wave = 0.45 + 0.55 * Math.sin(t * Math.PI * 2 + 0.6)
        const height = active
          ? Math.max(3, (smoothedLevel / 100) * 18 * wave + 3)
          : 3
        const opacity = active
          ? 0.45 + (Math.min(smoothedLevel, 100) / 100) * 0.55
          : 0.25
        return (
          <div
            key={i}
            className="w-1 rounded-full transition-all duration-75 ease-out"
            style={{
              height: `${height}px`,
              backgroundColor: base,
              opacity,
            }}
          />
        )
      })}
    </div>
  )
}