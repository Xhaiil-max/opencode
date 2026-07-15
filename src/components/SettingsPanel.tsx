import { useState, useEffect, useRef } from 'react'
import { X, Mic, MicOff, Video, Keyboard, Settings, Grid3x3, SplitSquareVertical, Menu, PanelRight, User, BarChart3, Palette, MonitorUp, RefreshCw, Type } from 'lucide-react'
import type { TabName, Keybind, GridPreset, SelfViewMode, Stats, FontSettings, ThemeName } from '../types'
import type { ScreenShareSettings } from '../utils/screenShare'
import type { Room } from 'livekit-client'
import AudioVisualizer from './AudioVisualizer'
import ParticipantVideo from './ParticipantVideo'
import ColorPicker from './ColorPicker'

interface SettingsPanelProps {
  onClose: () => void
  keybinds: Keybind[]
  setKeybinds: (keybinds: Keybind[]) => void
  audioDevices: MediaDeviceInfo[]
  videoDevices: MediaDeviceInfo[]
  onSwitchAudioDevice: (deviceId: string) => void
  onSwitchVideoDevice: (deviceId: string) => void
  room: Room | null
  micOn: boolean
  micGain: number
  onMicGainChange: (gain: number) => void
  stats: Stats | null
  camOn: boolean
  userColor: string
  onUserColorChange: (color: string) => void
  soundVolume: number
  onSoundVolumeChange: (volume: number) => void
  selfViewMode?: SelfViewMode
  onSelfViewModeChange?: (mode: SelfViewMode) => void
  gridPreset?: GridPreset
  onGridPresetChange?: (preset: GridPreset) => void
  isHost: boolean
  muteAllParticipants?: () => void
  toggleScreenSharePermission?: () => void
  toggleCameraPermission?: () => void
  toggleMicrophonePermission?: () => void
  requestMediaPermissions?: () => void
  fontSettings?: FontSettings
  setFontSettings?: (settings: FontSettings) => void
  theme?: ThemeName
  onThemeChange?: (t: ThemeName) => void
  screenShareSettings?: ScreenShareSettings
  onScreenShareSettingsChange?: (s: ScreenShareSettings) => void
  tileScale?: number
  onTileScaleChange?: (scale: number) => void
}
export default function SettingsPanel({
  onClose,
  keybinds,
  setKeybinds,
  audioDevices,
  onSwitchAudioDevice,
  onSwitchVideoDevice,
  room,
  micGain,
  onMicGainChange,
  stats,
  camOn,
  userColor,
  onUserColorChange,
  soundVolume,
  onSoundVolumeChange,
  selfViewMode: propSelfViewMode,
  onSelfViewModeChange: propOnSelfViewModeChange,
  gridPreset: propGridPreset,
  onGridPresetChange: propOnGridPresetChange,
  isHost,
  muteAllParticipants,
  toggleScreenSharePermission,
  toggleCameraPermission,
  toggleMicrophonePermission,
  requestMediaPermissions,
  videoDevices,
  fontSettings,
  setFontSettings,
  theme,
  onThemeChange,
  screenShareSettings,
  onScreenShareSettingsChange,
  tileScale = 100,
  onTileScaleChange,
}: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabName>('audio')
  const [selectedAudioInput, setSelectedAudioInput] = useState<string | null>(null)
  const [selectedAudioOutput, setSelectedAudioOutput] = useState<string | null>(null)
  const [selectedVideoInput, setSelectedVideoInput] = useState<string | null>(null)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const keybindInputRef = useRef<HTMLButtonElement>(null)

  // Initialize selected devices from available devices or use 'default'
  useEffect(() => {
    // Initialize audio input selection
    if (audioDevices.length > 0) {
      const defaultDevice = audioDevices.find(d => d.deviceId === 'default')
      if (defaultDevice) {
        setSelectedAudioInput('default')
      } else {
        setSelectedAudioInput(audioDevices[0].deviceId)
      }
    }

    // Initialize audio output selection (same devices for output in this context)
    if (audioDevices.length > 0) {
      const defaultDevice = audioDevices.find(d => d.deviceId === 'default')
      if (defaultDevice) {
        setSelectedAudioOutput('default')
      } else {
        setSelectedAudioOutput(audioDevices[0].deviceId)
      }
    }

    // Initialize video input selection
    if (videoDevices.length > 0) {
      const defaultDevice = videoDevices.find(d => d.deviceId === 'default')
      if (defaultDevice) {
        setSelectedVideoInput('default')
      } else {
        setSelectedVideoInput(videoDevices[0].deviceId)
      }
    }
  }, [audioDevices, videoDevices])

  const tabs = [
    { name: 'audio', label: 'Audio', icon: Mic },
    { name: 'video', label: 'Video', icon: Video },
    { name: 'keybinds', label: 'Keybinds', icon: Keyboard },
    { name: 'general', label: 'General', icon: Settings },
    { name: 'stats', label: 'Stats', icon: BarChart3 },
    { name: 'screenshare', label: 'Screenshare', icon: MonitorUp },
    { name: 'theme', label: 'Theme', icon: Palette },
    ...(isHost ? [{ name: 'host-controls', label: 'Host Controls', icon: Settings }] : []),
  ] as const

  const ssDefaults = screenShareSettings ?? { includeAudio: true, resolution: '1920x1080', frameRate: 30 }

  useEffect(() => {
    if (!editingKey) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return
      if (e.key === 'Escape') {
        setEditingKey(null)
        return
      }
      e.preventDefault()
      e.stopPropagation()

      const parts: string[] = []
      if (e.metaKey || e.ctrlKey) parts.push(e.metaKey ? '⌘' : 'Ctrl')
      if (e.shiftKey) parts.push('Shift')
      if (e.altKey) parts.push(e.metaKey ? '⌥' : 'Alt')
      let key = e.key
      if (key === ' ') key = 'Space'
      else if (key.length === 1) key = key.toUpperCase()
      else key = key.charAt(0).toUpperCase() + key.slice(1).replace(/Key$/, '')
      parts.push(key)
      const combo = parts.join(' + ')

      const updated = keybinds.map(kb => kb.id === editingKey ? { ...kb, keys: combo } : kb)
      setKeybinds(updated)
      setEditingKey(null)
    }

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const editingButton = keybindInputRef.current
      if (editingButton && !editingButton.contains(target)) {
        setEditingKey(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('mousedown', handleMouseDown)

    setTimeout(() => {
      keybindInputRef.current?.focus()
    }, 0)

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [editingKey, keybinds, setKeybinds])

  const selfViewMode = propSelfViewMode ?? 'grid'
  const onSelfViewModeChange = propOnSelfViewModeChange ?? (() => {})
  const gridPreset = propGridPreset ?? 'tiled'
  const onGridPresetChange = propOnGridPresetChange ?? (() => {})
  const localFontSettings = fontSettings ?? { fontFamily: 'system', fontSize: 'medium', highContrast: false }

  const getLocalUserAudioLevel = (): number => {
    // Try to get audio level from room's local participant
    if (room?.localParticipant) {
      return Math.round((room.localParticipant.audioLevel ?? 0) * 100)
    }

    // Fallback: try to get from users array if available through room (alternative approach)
    // This is a backup in case the direct approach doesn't work
    if (room) {
      const localParticipant = room.localParticipant
      if (localParticipant) {
        return Math.round((localParticipant.audioLevel ?? 0) * 100)
      }
    }

    // Final fallback to micGain (though this is what we're trying to fix)
    return micGain
  }

  const gridPresets: { value: GridPreset; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { value: 'tiled', label: 'Tiled', icon: Grid3x3 },
    { value: 'spotlight', label: 'Spotlight', icon: SplitSquareVertical },
    { value: 'speaker', label: 'Speaker', icon: Menu },
    { value: 'sidebar', label: 'Sidebar', icon: PanelRight },
  ]

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="glass-card w-full mx-4 flex flex-col max-h-[85vh] animate-slide-up" style={{ maxWidth: '760px', minHeight: '520px' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border-primary shrink-0">
          <h2 className="text-lg font-display font-medium">Settings</h2>
          <button onClick={onClose} className="btn-ghost btn-icon-sm" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          <div className="w-44 shrink-0 overflow-y-auto p-2 border-r border-border-primary space-y-1">
            {tabs.map(({ name, label, icon: Icon }) => (
              <button
                key={name}
                onClick={() => setActiveTab(name as TabName)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${activeTab === name ? 'bg-haze-500/20 text-haze-400' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'}`}
              >
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 scrollbar-thin">
          {activeTab === 'audio' && (
            <div className="flex flex-col gap-6">
              <div>
                <label className="text-xs text-text-muted mb-2 block">Microphone</label>
                <div className="flex items-center gap-3">
                  <AudioVisualizer level={getLocalUserAudioLevel()} className="h-6 flex-1" type="waveform" />
                  <span className="text-xs font-mono text-text-secondary w-16 text-right">
                    {getLocalUserAudioLevel()}%
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm text-text-primary">Input Volume</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={micGain}
                    onChange={e => onMicGainChange(Number(e.target.value))}
                    className="w-32 accent-haze-500"
                  />
                </label>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-text-muted mb-0">Microphone</label>
                  <button
                    onClick={requestMediaPermissions}
                    className="btn-ghost btn-icon-xs text-xs hover:bg-bg-tertiary"
                    title="Refresh devices"
                  >
                    <RefreshCw size={14} className="animate-spin" />
                  </button>
                </div>
                <select
                  value={selectedAudioInput ?? (audioDevices.find(d => d.deviceId === 'default') ? 'default' : '')}
                  onChange={(e) => {
                    const deviceId = e.target.value
                    onSwitchAudioDevice(deviceId)
                    setSelectedAudioInput(deviceId)
                  }}
                  className="input appearance-none"
                >
                  <option value="default">Default Device</option>
                  {audioDevices.length > 0 ? (
                    audioDevices.map(d => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Microphone ${d.deviceId.slice(0, 6)}`}
                      </option>
                    ))
                  ) : (
                    <option disabled>No microphones found</option>
                  )}
                </select>
              </div>

              <div>
                <label className="text-xs text-text-muted mb-2 block">Speaker</label>
                <select
                  value={selectedAudioOutput ?? (audioDevices.find(d => d.deviceId === 'default') ? 'default' : '')}
                  onChange={(e) => {
                    const deviceId = e.target.value
                    // Note: Using onSwitchAudioDevice for speaker output as well, assuming same device type
                    // In a more complex implementation, we might have separate output device handling
                    onSwitchAudioDevice(deviceId)
                    setSelectedAudioOutput(deviceId)
                  }}
                  className="input appearance-none"
                >
                  <option value="default">Default Device</option>
                  {audioDevices.length > 0 ? (
                    audioDevices.map(d => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Speaker ${d.deviceId.slice(0, 6)}`}
                      </option>
                    ))
                  ) : (
                    <option disabled>No speakers found</option>
                  )}
                </select>
              </div>

              <div className="space-y-3 pt-4 border-t border-border-primary">
                <label className="flex items-center justify-between">
                  <span className="text-sm text-text-primary">Notification Volume</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(soundVolume * 100)}
                    onChange={e => onSoundVolumeChange(Number(e.target.value) / 100)}
                    className="w-32 accent-haze-500"
                  />
                  <span className="text-xs font-mono text-text-secondary w-10 text-right">
                    {Math.round(soundVolume * 100)}%
                  </span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'video' && (
            <div className="flex flex-col gap-6">
              <div className="aspect-video rounded-xl border border-border-primary overflow-hidden bg-bg-secondary relative">
                {camOn && room?.localParticipant.videoTrackPublications.size ? (
                  <ParticipantVideo participant={room.localParticipant} isLocal={true} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-muted">
                    Camera preview
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs text-text-muted mb-2 block">Camera</label>
                <select
                  value={selectedVideoInput ?? (videoDevices.find(d => d.deviceId === 'default') ? 'default' : '')}
                  onChange={(e) => {
                    const deviceId = e.target.value
                    onSwitchVideoDevice(deviceId)
                    setSelectedVideoInput(deviceId)
                  }}
                  className="input appearance-none"
                >
                  <option value="default">Default Device</option>
                  {videoDevices.length > 0 ? (
                    videoDevices.map(d => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Camera ${d.deviceId.slice(0, 6)}`}
                      </option>
                    ))
                  ) : (
                    <option disabled>No cameras found</option>
                  )}
                </select>
              </div>

              <div className="border-t border-border-primary pt-4 space-y-4">
                <h4 className="text-sm font-medium text-text-primary">Camera Quality</h4>
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Resolution</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: '640x480', label: '480p (640x480)' },
                      { value: '1280x720', label: '720p (1280x720)' },
                      { value: '1920x1080', label: '1080p (1920x1080)' },
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => {
                          try {
                            room?.localParticipant.setCameraEnabled(false)
                            setTimeout(() => room?.localParticipant.setCameraEnabled(true), 100)
                          } catch {}
                        }}
                        className="px-3 py-2 rounded-xl border transition-colors text-xs bg-bg-tertiary border-border-primary text-text-secondary hover:bg-bg-elevated cursor-pointer"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Aspect Ratio</label>
                  <div className="flex gap-2">
                    {['16:9', '4:3', '1:1'].map(ratio => (
                      <button
                        key={ratio}
                        className="px-4 py-2 rounded-xl border transition-colors text-sm bg-bg-tertiary border-border-primary text-text-secondary hover:bg-bg-elevated cursor-pointer"
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'keybinds' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text-primary">Keyboard Shortcuts</h3>
                <button
                  onClick={() => {
                    setKeybinds([
                      { id: "toggle-mic", label: "Toggle Mic", keys: "Ctrl+Shift+M" },
                      { id: "toggle-cam", label: "Toggle Cam", keys: "Ctrl+Shift+C" },
                      { id: "toggle-deafen", label: "Toggle Deafen", keys: "Ctrl+Shift+D" },
                    ])
                  }}
                  className="text-xs text-haze-500 hover:text-haze-400"
                >
                  Reset to defaults
                </button>
              </div>
              <div className="space-y-3">
                {keybinds.map(k => {
                  const descriptions: Record<string, string> = {
                    "toggle-mic": "Mute or unmute your microphone",
                    "toggle-cam": "Turn your camera on or off",
                    "toggle-deafen": "Deafen or undeafen yourself (hear others but they can't hear you)"
                  };

                  return (
                    <div key={k.id} className="flex flex-col space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-text-primary">{k.label}</span>
                          <span className="text-xs text-text-muted">{descriptions[k.id]}</span>
                        </div>
                        <button
                          ref={editingKey === k.id ? keybindInputRef : undefined}
                          data-keybind-id={k.id}
                          onClick={e => { e.stopPropagation(); setEditingKey(editingKey === k.id ? null : k.id) }}
                          className={`w-full max-w-xs px-3 py-2 rounded-lg text-xs font-mono transition-colors flex items-center justify-between ${editingKey === k.id ? 'bg-haze-500/20 text-haze-400 ring-2 ring-haze-500/50' : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'}`}
                        >
                          {editingKey === k.id ? (
                            <>
                              <span className="anim-pulse">Press key...</span>
                              <span className="ml-2 text-xs text-haze-400">(Esc to cancel)</span>
                            </>
                          ) : (
                            k.keys
                          )}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === 'general' && (
            <div className="flex flex-col gap-6">
              <div>
                <label className="text-xs text-text-muted mb-2 block">Self View</label>
                <div className="flex gap-2">
                  {(['grid', 'floating'] as SelfViewMode[]).map(mode => (
                    <button
                      key={mode}
                      onClick={() => onSelfViewModeChange(mode)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-colors ${selfViewMode === mode ? 'bg-haze-500/20 border-haze-500/50 text-haze-300' : 'bg-bg-tertiary border-border-primary text-text-secondary hover:bg-bg-elevated'}`}
                    >
                      <User size={14} /> {mode === 'grid' ? 'In Grid' : 'Floating'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-text-muted mb-2 block">Grid Layout</label>
                <div className="grid grid-cols-2 gap-2">
                  {gridPresets.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => onGridPresetChange(value)}
                      className={`flex items-center gap-2 p-3 rounded-xl border transition-colors text-sm ${gridPreset === value ? 'bg-haze-500/20 border-haze-500/50' : 'bg-bg-tertiary border-border-primary hover:bg-bg-elevated'}`}
                    >
                      <Icon size={16} /> {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-text-muted mb-2 block">Tile Size</label>
                <div className="flex items-center gap-3">
                  <input type="range" min="50" max="150" value={tileScale} onChange={e => onTileScaleChange?.(Number(e.target.value))} className="flex-1 accent-haze-500 h-1" />
                  <span className="text-xs font-mono text-text-secondary w-10 text-right">{tileScale}%</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-text-muted mb-2 block flex items-center gap-1">
                  <Palette size={12} /> Your Color
                </label>
                <ColorPicker userColor={userColor} onUserColorChange={onUserColorChange} />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-2 block flex items-center gap-1">
                  <Palette size={12} /> Accent Theme
                </label>
                <div className="flex gap-3">
                  {[
                    { name: 'Haze', primary: '#6366f1', hover: '#4f46e5' },
                    { name: 'Violet', primary: '#8b5cf6', hover: '#7c3aed' },
                    { name: 'Rose', primary: '#f43f5e', hover: '#e11d48' },
                    { name: 'Emerald', primary: '#10b981', hover: '#059669' },
                    { name: 'Amber', primary: '#f59e0b', hover: '#d97706' },
                    { name: 'Sky', primary: '#0ea5e9', hover: '#0284c7' },
                  ].map(color => (
                    <button
                      key={color.name}
                      onClick={() => {
                        document.documentElement.style.setProperty('--color-accent-primary', color.primary)
                        document.documentElement.style.setProperty('--color-accent-primary-hover', color.hover)
                      }}
                      className="w-8 h-8 rounded-full border-2 border-border-primary hover:scale-110 transition-transform cursor-pointer"
                      style={{ backgroundColor: color.primary }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-text-muted mb-2 block font-semibold flex items-center gap-1">
                  <Type size={12} /> Font Settings
                </label>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Font Size</label>
                    <select
                      value={localFontSettings.fontSize}
                      onChange={e => setFontSettings?.({ fontSize: e.target.value, fontFamily: localFontSettings.fontFamily, highContrast: localFontSettings.highContrast })}
                      className="input appearance-none w-full"
                    >
                      <option value="small">Small (12px)</option>
                      <option value="medium">Medium (14px)</option>
                      <option value="large">Large (16px)</option>
                      <option value="xlarge">Extra Large (18px)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Font Family</label>
                    <select
                      value={localFontSettings.fontFamily}
                      onChange={e => setFontSettings?.({ fontFamily: e.target.value, fontSize: localFontSettings.fontSize, highContrast: localFontSettings.highContrast })}
                      className="input appearance-none w-full"
                    >
                      <option value="system">System Default</option>
                      <option value="inter">Inter</option>
                      <option value="roboto">Roboto</option>
                      <option value="opensans">Open Sans</option>
                      <option value="monospace">Monospace</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={localFontSettings.highContrast}
                      onChange={e => setFontSettings?.({ highContrast: e.target.checked, fontSize: localFontSettings.fontSize, fontFamily: localFontSettings.fontFamily })}
                      className="w-4 h-4 accent-haze-500 rounded border-border-primary bg-bg-secondary"
                    />
                    <span className="text-sm text-text-primary font-medium">High Contrast</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'screenshare' && (
            <div className="grid gap-4">
              <div>
                <label className="text-xs text-text-muted mb-2 block flex-items-center gap-1">
                  <MonitorUp size={12} /> Default Resolution
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: '1920x1080', label: '1080p (1920x1080)' },
                    { value: '1280x720', label: '720p (1280x720)' },
                    { value: '2560x1440', label: '1440p (2560x1440)' },
                    { value: '3840x2160', label: '4K (3840x2160)' },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => onScreenShareSettingsChange?.({ ...ssDefaults, resolution: value })}
                      className={`p-3 rounded-xl border transition-colors text-sm cursor-pointer ${value === ssDefaults.resolution ? 'bg-haze-500/20 border-haze-500/50' : 'bg-bg-tertiary border-border-primary hover:bg-bg-elevated'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-text-muted mb-2 block flex-items-center gap-1">
                  <MonitorUp size={12} /> Default Frame Rate
                </label>
                <div className="flex gap-2">
                  {[15, 30, 60].map(fps => (
                    <button
                      key={fps}
                      onClick={() => onScreenShareSettingsChange?.({ ...ssDefaults, frameRate: fps })}
                      className={`px-4 py-2 rounded-xl border transition-colors text-sm cursor-pointer ${fps === ssDefaults.frameRate ? 'bg-haze-500/20 border-haze-500/50 text-haze-400' : 'bg-bg-tertiary border-border-primary text-text-secondary hover:bg-bg-elevated'}`}
                    >
                      {fps} fps
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-text-muted mb-2 block flex-items-center gap-1">
                  <Mic size={12} /> Include Audio by Default
                </label>
                <button
                  onClick={() => onScreenShareSettingsChange?.({ ...ssDefaults, includeAudio: !ssDefaults.includeAudio })}
                  className={`px-4 py-2 rounded-xl border transition-colors text-sm cursor-pointer ${ssDefaults.includeAudio ? 'bg-haze-500/20 border-haze-500/50 text-haze-400' : 'bg-bg-tertiary border-border-primary text-text-secondary hover:bg-bg-elevated'}`}
                >
                  {ssDefaults.includeAudio ? 'System Audio + Microphone' : 'No Audio'}
                </button>
              </div>
              <div>
                <label className="text-xs text-text-muted mb-2 block flex-items-center gap-1">
                  <Palette size={12} /> Remember Settings
                </label>
                <p className="text-sm text-text-muted">Settings are automatically saved to your browser and will be used as defaults for future screen shares.</p>
              </div>
            </div>
          )}

          {activeTab === 'stats' && stats && (
            <div className="grid gap-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded-xl bg-bg-tertiary border border-border-primary">
                  <div className="text-xs text-text-muted mb-1">Audio</div>
                  <div className="text-sm font-mono">In: {stats.audio.inputLevel}%</div>
                  <div className="text-sm font-mono">Out: {stats.audio.outputLevel}%</div>
                  <div className="text-sm font-mono">Loss: {stats.audio.packetLoss.toFixed(1)}%</div>
                  <div className="text-sm font-mono">Jitter: {stats.audio.jitter.toFixed(1)}ms</div>
                  <div className="text-sm font-mono">Latency: {stats.audio.latency}ms</div>
                </div>
                <div className="p-3 rounded-xl bg-bg-tertiary border border-border-primary">
                  <div className="text-xs text-text-muted mb-1">Video</div>
                  <div className="text-sm font-mono">{stats.video.width}x{stats.video.height}</div>
                  <div className="text-sm font-mono">{stats.video.frameRate}fps</div>
                  <div className="text-sm font-mono">Loss: {stats.video.packetLoss.toFixed(1)}%</div>
                  <div className="text-sm font-mono">Jitter: {stats.video.jitter.toFixed(1)}ms</div>
                </div>
                <div className="p-3 rounded-xl bg-bg-tertiary border border-border-primary">
                  <div className="text-xs text-text-muted mb-1">Screenshare</div>
                  <div className="text-sm font-mono">{stats.screenShare.width}x{stats.screenShare.height}</div>
                  <div className="text-sm font-mono">{stats.screenShare.frameRate}fps</div>
                  <div className="text-sm font-mono">Loss: {stats.screenShare.packetLoss.toFixed(1)}%</div>
                  <div className="text-sm font-mono">Jitter: {stats.screenShare.jitter.toFixed(1)}ms</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'theme' && (
            <div className="flex flex-col gap-6">
              <div>
                <label className="text-xs text-text-muted mb-2 block">Appearance</label>
                <div className="flex gap-2">
                  {([
                    { value: 'dark', label: 'Dark' },
                    { value: 'light', label: 'Light' },
                    { value: 'gray', label: 'Gray' },
                  ] as { value: ThemeName; label: string }[]).map(t => (
                    <button
                      key={t.value}
                      onClick={() => onThemeChange?.(t.value)}
                      className={`px-4 py-2 rounded-xl border transition-colors text-sm ${theme === t.value ? 'bg-haze-500/20 border-haze-500/50 text-haze-300' : 'bg-bg-tertiary border-border-primary text-text-secondary hover:bg-bg-elevated'}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-text-muted mb-2 block">Accent Color</label>
                <div className="flex gap-3">
                  {[
                    { name: 'Haze', primary: '#6366f1', hover: '#4f46e5' },
                    { name: 'Violet', primary: '#8b5cf6', hover: '#7c3aed' },
                    { name: 'Rose', primary: '#f43f5e', hover: '#e11d48' },
                    { name: 'Emerald', primary: '#10b981', hover: '#059669' },
                    { name: 'Amber', primary: '#f59e0b', hover: '#d97706' },
                    { name: 'Sky', primary: '#0ea5e9', hover: '#0284c7' },
                  ].map(color => (
                    <button
                      key={color.name}
                      onClick={() => {
                        document.documentElement.style.setProperty('--color-accent-primary', color.primary)
                        document.documentElement.style.setProperty('--color-accent-primary-hover', color.hover)
                      }}
                      className="w-8 h-8 rounded-full border-2 border-border-primary hover:scale-110 transition-transform"
                      style={{ backgroundColor: color.primary }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'host-controls' && room && isHost && (
            <div className="flex flex-col gap-4">
              <div className="border-t border-border-primary pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Host Controls</h3>
                  <button onClick={onClose} className="btn-ghost btn-icon-sm">
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="border-b border-border-primary pb-3">
                    <h4 className="font-medium mb-2">Participant Controls</h4>
                    <div className="space-y-2">
                      <button
                        onClick={muteAllParticipants}
                        className="w-full text-left bg-bg-tertiary hover:bg-bg-elevated p-3 rounded-lg cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <span>Mute All Participants</span>
                        <MicOff size={16} className="text-accent-error" />
                      </button>
                      <button
                        onClick={() => console.log('Remove participant - select from list')}
                        className="w-full text-left bg-bg-tertiary hover:bg-bg-elevated p-3 rounded-lg cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <span>Remove Participant</span>
                        <X size={16} className="text-accent-error" />
                      </button>
                    </div>
                  </div>

                  <div className="border-b border-border-primary pb-3">
                    <h4 className="font-medium mb-2">Room Settings</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Allow Screen Sharing</span>
                        <button
                          onClick={toggleScreenSharePermission}
                          className="p-1.5 rounded-lg hover:bg-bg-tertiary transition-colors cursor-pointer"
                        >
                          <MonitorUp size={14} className="text-accent-success" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Allow Camera</span>
                        <button
                          onClick={toggleCameraPermission}
                          className="p-1.5 rounded-lg hover:bg-bg-tertiary transition-colors cursor-pointer"
                        >
                          <Video size={14} className="text-accent-success" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Allow Microphone</span>
                        <button
                          onClick={toggleMicrophonePermission}
                          className="p-1.5 rounded-lg hover:bg-bg-tertiary transition-colors cursor-pointer"
                        >
                          <Mic size={14} className="text-accent-success" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}