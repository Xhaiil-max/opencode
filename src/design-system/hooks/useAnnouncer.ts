import { useEffect, useRef } from 'react'

interface AnnouncerOptions {
  politeness?: 'polite' | 'assertive'
  timeout?: number
}

export function useAnnouncer(options: AnnouncerOptions = {}) {
  const { politeness = 'polite', timeout = 1000 } = options
  const liveRegionRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    const region = document.createElement('div')
    region.setAttribute('aria-live', politeness)
    region.setAttribute('aria-atomic', 'true')
    region.className = 'sr-only fixed bottom-4 right-4 z-[9999] max-w-md p-4 glass-card rounded-xl shadow-elevation-4'
    region.style.opacity = '0'
    region.style.pointerEvents = 'none'
    document.body.appendChild(region)
    liveRegionRef.current = region

    return () => {
      document.body.removeChild(region)
    }
  }, [politeness])

  const announce = (message: string) => {
    if (!liveRegionRef.current) return

    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    liveRegionRef.current.textContent = ''
    requestAnimationFrame(() => {
      if (!liveRegionRef.current) return
      liveRegionRef.current.textContent = message
      timeoutRef.current = setTimeout(() => {
        if (liveRegionRef.current) liveRegionRef.current.textContent = ''
      }, timeout)
    })
  }

  return { announce }
}
