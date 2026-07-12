export interface ScreenShareSettings {
  includeAudio: boolean
  resolution: string
  frameRate: number
}

export const DEFAULT_SCREENSHARE_SETTINGS: ScreenShareSettings = {
  includeAudio: true,
  resolution: '1920x1080',
  frameRate: 30,
}

export function parseResolution(res: string): { width: number; height: number } {
  const [w, h] = res.split('x').map(Number)
  return { width: w || 1920, height: h || 1080 }
}
