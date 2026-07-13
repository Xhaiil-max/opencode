import { useEffect, useState } from 'react'

interface AudioVisualizerProps {
  level: number
  className?: string
  bars?: number
  type?: 'bars' | 'waveform' | 'dots'
}

export default function AudioVisualizer({
  level,
  className = '',
  bars = 12,
  type = 'bars'
}: AudioVisualizerProps) {
  // Smooth the level for better visual experience
  const [smoothedLevel, setSmoothedLevel] = useState(0)

  useEffect(() => {
    // Smooth the audio level to reduce jitter
    const frame = requestAnimationFrame(() => {
      // Apply smoothing: 70% previous value, 30% new value
      setSmoothedLevel(prev => prev * 0.7 + level * 0.3)
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
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {Array.from({ length: 5 }).map((_, i) => {
          const delay = i * 50
          const height = Math.min(20, (smoothedLevel / 100) * 20 * (0.5 + i * 0.1))
          const opacity = 0.3 + (Math.min(smoothedLevel, 100) / 100) * 0.7
          return (
            <div
              key={i}
              className="w-1.5 rounded-full transition-all duration-100 ease-out"
              style={{
                height: `${height}px`,
                backgroundColor: `hsla(240, 80%, 60%, ${opacity})`,
                animationDelay: `${delay}ms`
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

export function WaveformDots({ level, isSpeaking, className = '' }: { level: number; isSpeaking?: boolean; className?: string }) {
  const [smoothedLevel, setSmoothedLevel] = useState(0)

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      // Apply smoothing for more natural motion
      setSmoothedLevel(prev => prev * 0.6 + level * 0.4)
    })
    return () => cancelAnimationFrame(frame)
  }, [level])

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const delay = i * 50
        const height = isSpeaking
          ? Math.max(2, (smoothedLevel / 100) * 16 * (0.5 + i * 0.2))
          : 1
        const opacity = isSpeaking ? 0.8 : 0.2
        return (
          <div
            key={i}
            className="w-1 rounded-full transition-all duration-100 ease-out"
            style={{
              height: `${height}px`,
              backgroundColor: `hsla(240, 80%, 60%, ${opacity})`,
              animationDelay: `${delay}ms`
            }}
          />
        )
      })}
    </div>
  )
}