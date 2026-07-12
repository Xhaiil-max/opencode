export interface User {
  id: string
  name: string
  avatar?: string
  micOn: boolean
  camOn: boolean
  handRaised: boolean
  isSharing: boolean
  isSpeaking: boolean
  audioLevel: number
  volume: number
  localVideoDisabled: boolean
  localScreenshareDisabled: boolean
  isHost: boolean
  color: string
  connectionQuality?: number // 0-5, higher is better
}

export interface ChatMessage {
  id: string
  sender: string
  content: string
  timestamp: number
  isImage?: boolean
  isLink?: boolean
  imageData?: string // base64 encoded image
}

export type ViewState = 'landing' | 'meeting' | 'screenshare-modal'

export type SelfViewMode = 'grid' | 'floating'

export type GridPreset = 'tiled' | 'spotlight' | 'speaker' | 'sidebar'

export type SidebarTab = 'participants' | 'chat' | 'tools'

export type TabName = 'audio' | 'video' | 'keybinds' | 'general' | 'stats'

export interface Stat {
  label: string
  audio: string
  video: string
  screenshare: string
}

export interface Keybind {
  id: string
  label: string
  keys: string
}

export interface Stats {
  audio: {
    inputLevel: number
    outputLevel: number
    packetLoss: number
    jitter: number
    latency: number
  }
  video: {
    width: number
    height: number
    frameRate: number
    packetLoss: number
    jitter: number
  }
  screenShare: {
    width: number
    height: number
    frameRate: number
    packetLoss: number
    jitter: number
  }
  connectionQuality: number // 0-5, higher is better
}

export interface HostSettings {
  disableChat: boolean
  muteEveryone: boolean
  disableCameras: boolean
  chatSlowdown: boolean
  disableWhiteboard: boolean
  disableWhiteboardDrawing: boolean
}

export interface ScreenshareTarget {
  id: string
  label: string
  type: 'fullscreen' | 'tab' | 'window' | 'region'
}
