import { cn } from '../utils/cn'
import { Wifi, WifiOff, WifiHigh } from 'lucide-react'

interface ConnectionStatusProps {
  quality: {
    score: number
    state: string
  } | null
  showDetails?: boolean
  className?: string
}

export function ConnectionStatus({ quality, showDetails = false, className }: ConnectionStatusProps) {
  const getStatus = () => {
    if (!quality || quality.state !== 'connected') {
      const state = quality?.state ?? 'disconnected'
      return { level: 'lost', label: state.charAt(0).toUpperCase() + state.slice(1), color: 'text-rose-400', icon: WifiOff, bars: 0 }
    }
    const score = quality.score
    if (score >= 4.5) return { level: 'excellent', label: 'Excellent', color: 'text-emerald-400', icon: WifiHigh, bars: 4 }
    if (score >= 3.5) return { level: 'good', label: 'Good', color: 'text-emerald-400', icon: WifiHigh, bars: 3 }
    if (score >= 2.5) return { level: 'fair', label: 'Fair', color: 'text-amber-400', icon: Wifi, bars: 2 }
    if (score >= 1.5) return { level: 'poor', label: 'Poor', color: 'text-rose-400', icon: Wifi, bars: 1 }
    return { level: 'lost', label: 'Lost', color: 'text-rose-400', icon: WifiOff, bars: 0 }
  }

  const status = getStatus()
  const colorBg = status.color.replace('text-', 'bg-')

  return (
    <div className={cn('flex items-center gap-1.5', className)}>      <div className="flex items-center gap-0.5" aria-hidden="true">        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className={cn(
              'w-0.5 rounded transition-colors duration-300',
              ['h-[4px]', 'h-[6px]', 'h-[8px]', 'h-[10px]'][i],
              i < status.bars ? colorBg : 'bg-text-muted/30'
            )}
          />        ))}
      </div>      {showDetails && (
        <span className={cn('text-xs font-medium', status.color)}>{status.label}</span>      )}
    </div>  )
}
