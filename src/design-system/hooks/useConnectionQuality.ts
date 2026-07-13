import { useMemo } from 'react'

interface ConnectionQualityInput {
  score: number
  state: string
}

export interface ConnectionQuality {
  level: 'excellent' | 'good' | 'fair' | 'poor' | 'lost'
  label: string
  color: string
  icon: string
  bars: number
}

export function useConnectionQuality(input: ConnectionQualityInput | null): ConnectionQuality {
  return useMemo(() => {
    const state = input?.state ?? 'disconnected'
    if (!input || input.state !== 'connected') {
      return {
        level: 'lost',
        label: state.charAt(0).toUpperCase() + state.slice(1),
        color: 'text-rose-400',
        icon: 'wifi-off',
        bars: 0,
      }
    }

    const score = input.score
    if (score >= 4.5) {
      return { level: 'excellent', label: 'Excellent', color: 'text-emerald-400', icon: 'wifi-high', bars: 4 }
    }
    if (score >= 3.5) {
      return { level: 'good', label: 'Good', color: 'text-emerald-400', icon: 'wifi', bars: 3 }
    }
    if (score >= 2.5) {
      return { level: 'fair', label: 'Fair', color: 'text-amber-400', icon: 'wifi', bars: 2 }
    }
    if (score >= 1.5) {
      return { level: 'poor', label: 'Poor', color: 'text-rose-400', icon: 'wifi', bars: 1 }
    }
    return { level: 'lost', label: 'Lost', color: 'text-rose-400', icon: 'wifi-off', bars: 0 }
  }, [input])
}
