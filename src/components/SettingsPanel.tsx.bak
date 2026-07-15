import { useState, useEffect, useRef } from 'react'
import { X, Mic, MicOff, Video, Keyboard, Settings, Grid3x3, SplitSquareVertical, Menu, PanelRight, User, BarChart3, Palette, MonitorUp } from 'lucide-react'
import type { TabName, Keybind, GridPreset, SelfViewMode, Stats } from '../types'
import type { Room } from 'livekit-client'
import AudioVisualizer from './AudioVisualizer'
import ParticipantVideo from './ParticipantVideo'
import { useAudioLevel, useLocalMicStream } from '../hooks/useAudioLevel'
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
  selfViewMode?: SelfViewMode
  onSelfViewModeChange?: (mode: SelfViewMode) => void
  gridPreset?: GridPreset
  onGridPresetChange?: (preset: GridPreset) => void
  isHost: boolean
}
export default function SettingsPanel({
  onClose,
  keybinds,
  audioDevices,
setKeybinds,
  videoDevices,
  onSwitchAudioDevice,
  onSwitchVideoDevice,
  room,
  micOn,
  micGain,
  onMicGainChange,
  stats,
  camOn,
  userColor,
  onUserColorChange,
  selfViewMode: propSelfViewMode,
  onSelfViewModeChange: propOnSelfViewModeChange,
  gridPreset: propGridPreset,
  onGridPresetChange: propOnGridPresetChange,
  isHost
}: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabName>('audio')
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const keybindInputRef = useRef<HTMLButtonElement>(null)

  const tabs = [
    { name: 'audio', label: 'Audio', icon: Mic },
    { name: 'video', label: 'Video', icon: Video },
    { name: 'keybinds', label: 'Keybinds', icon: Keyboard },
    { name: 'general', label: 'General', icon: Settings },
    { name: 'stats', label: 'Stats', icon: BarChart3 },
    { name: 'screenshare', label: 'Screenshare', icon: MonitorUp },
    { name: 'chat', label: 'Chat', icon: User },
    ...(isHost ? [{ name: 'host-controls', label: 'Host Controls', icon: Settings }] : []),
  ] as const

  // Global keydown listener for keybind editing
  useEffect(() => {
    if (!editingKey) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore modifier keys alone
      if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return

      e.preventDefault()
      e.stopPropagation()

      const parts: string[] = []
      if (e.metaKey || e.ctrlKey) parts.push(e.metaKey ? '⌘' : 'Ctrl')
      if (e.shiftKey) parts.push('Shift')
      if (e.altKey) parts.push(e.metaKey ? '⌥' : 'Alt')
      
      // Get the main key
      let key = e.key
      if (key === ' ') key = 'Space'
      else if (key === 'Escape') key = 'Esc'
      else if (key.length === 1) key = key.toUpperCase()
      else key = key.charAt(0).toUpperCase() + key.slice(1).replace(/Key$/, '')
      
      parts.push(key)
      const combo = parts.join(' + ')

      const updated = keybinds.map(kb => kb.id === editingKey ? { ...kb, keys: combo } : kb)
      setKeybinds(updated)
      setEditingKey(null)
      
      // Remove listener after capturing
      document.removeEventListener('keydown', handleKeyDown, true)
    }

    // Use capture phase to catch keys before other handlers
    document.addEventListener('keydown', handleKeyDown, true)
    
    // Auto-focus the button for visual feedback
    keybindInputRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [editingKey, keybinds, setKeybinds])
  const [localSelfViewMode, setLocalSelfViewMode] = useState<SelfViewMode>('grid')
  const [localGridPreset, setLocalGridPreset] = useState<GridPreset>('tiled')
  const micStream = useLocalMicStream(room, micOn)
  const micLevel = useAudioLevel(micStream, micOn)

  const selfViewMode = propSelfViewMode ?? localSelfViewMode
  const onSelfViewModeChange = propOnSelfViewModeChange ?? setLocalSelfViewMode
  const gridPreset = propGridPreset ?? localGridPreset
  const onGridPresetChange = propOnGridPresetChange ?? setLocalGridPreset
  void selfViewMode

  // Used in JSX template literals - TypeScript doesn't track this usage
  void gridPreset

  const gridPresets: { value: GridPreset; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { value: 'tiled', label: 'Tiled', icon: Grid3x3 },
    { value: 'spotlight', label: 'Spotlight', icon: SplitSquareVertical },
    { value: 'speaker', label: 'Speaker', icon: Menu },
    { value: 'sidebar', label: 'Sidebar', icon: PanelRight },
  ]

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
      <div className="glass-card w-full max-w-2xl mx-4 flex flex-col max-h-[85vh] animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b border-border-primary shrink-0">
          <h2 className="text-lg font-display font-medium">Settings</h2>
          <button onClick={onClose} className="btn-ghost btn-icon-sm" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-1 p-2 border-b border-border-primary shrink-0 overflow-x-auto scrollbar-thin">
          {tabs.map(({ name, label, icon: Icon }) => (
            <button
              key={name}
              onClick={() => setActiveTab(name as TabName)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap $
                {activeTab === name ? 'bg-bg-tertiary text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'}`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 scrollbar-thin">
          {activeTab === 'audio' && (
            <div className="flex flex-col gap-6">
              <div>
                <label className="text-xs text-text-muted mb-2 block">Microphone</label>
                <div className="flex items-center gap-3">
                  <AudioVisualizer level={micLevel} className="h-6 flex-1" type="waveform" />
                  <span className="text-xs font-mono text-text-secondary w-16 text-right">
                    {Math.round(micLevel)}%
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
                <label className="text-xs text-text-muted mb-2 block">Microphone</label>
                <select
                  value={audioDevices.find(d => d.deviceId === 'default') ? 'default' : ''}
                  onChange={e => onSwitchAudioDevice(e.target.value)}
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
                  value="default"
                  onChange={e => onSwitchAudioDevice(e.target.value)}
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
                  value="default"
                  onChange={e => onSwitchVideoDevice(e.target.value)}
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
            </div>
          )}

          {activeTab === 'keybinds' && (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-medium text-text-primary">Keyboard Shortcuts</h3>
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
                onClick={e => { e.stopPropagation(); setEditingKey(editingKey === k.id ? null : k.id) }}
                className={`w-full max-w-xs px-3 py-2 rounded-lg text-xs font-mono transition-colors flex items-center justify-between ${
                  editingKey === k.id
                    ? 'bg-haze-500/20 text-haze-400 ring-2 ring-haze-500/50'
                    : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
                }`}
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
        );
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
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-colors $
                        {selfViewMode === mode
                          ? 'bg-haze-500/20 border-haze-500/50 text-haze-300'
                          : 'bg-bg-tertiary border-border-primary text-text-secondary hover:bg-bg-elevated'`}
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
                      className={`flex items-center gap-2 p-3 rounded-xl border transition-colors text-sm $
                        {gridPreset === value
                          ? 'bg-haze-500/20 border-haze-500/50'
                          : 'bg-bg-tertiary border-border-primary hover:bg-bg-elevated'`}
                    >
                      <Icon size={16} /> {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-text-muted mb-2 block flex items-center gap-1">
                  <Palette size={12} /> Your Color
                </label>
                <ColorPicker userColor={userColor} onUserColorChange={onUserColorChange} />
              </div>
            </div>
          )}

          {activeTab === 'screenshare' && (
            <div className="grid gap-4">
              <div>
                <label className="text-xs text-text-muted mb-2 block flex items-center gap-1">
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
                      className={`p-3 rounded-xl border transition-colors text-sm ${value === '1920x1080' ? 'bg-haze-500/20 border-haze-500/50' : 'bg-bg-tertiary border-border-primary hover:bg-bg-elevated'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-text-muted mb-2 block flex items-center gap-1">
                  <MonitorUp size={12} /> Default Frame Rate
                </label>
                <div className="flex gap-2">
                  {[15, 30, 60].map(fps => (
                    <button
                      key={fps}
                      className={`px-4 py-2 rounded-xl border transition-colors text-sm ${fps === 30 ? 'bg-haze-500/20 border-haze-500/50 text-haze-400' : 'bg-bg-tertiary border-border-primary text-text-secondary hover:bg-bg-elevated'}`}
                    >
                      {fps} fps
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-text-muted mb-2 block flex items-center gap-1">
                  <Mic size={12} /> Include Audio by Default
                </label>
                <button className="px-4 py-2 rounded-xl border transition-colors text-sm bg-bg-tertiary border-border-primary hover:bg-bg-elevated">
                  System Audio + Microphone
                </button>
              </div>
              <div>
                <label className="text-xs text-text-muted mb-2 block flex items-center gap-1">
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

          {activeTab === 'chat' && (
            <div className="flex flex-col gap-4">
              <div className="border-t border-border-primary pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Chat</h3>
                  <button onClick={onClose} className="btn-ghost btn-icon-sm">
                    <X size={20} />
                  </button>
                </div>
                <div className="flex-1 flex flex-col">
                  <div className="flex-1 overflow-y-auto space-y-3 pb-4">
                    {/* Chat messages will be rendered here */}
                    <div className="text-center text-text-muted py-8">
                      No messages yet
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-border-primary">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      className="flex-1 input placeholder:text-text-secondary"
                    />
                    <button className="btn-primary px-4 py-2">Send</button>
                  </div>
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
                      <button className="w-full text-left bg-bg-tertiary hover:bg-bg-elevated p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span>Mute All Participants</span>
                          <MicOff size={16} className="text-accent-error" />
                        </div>
                      </button>
                      <button className="w-full text-left bg-bg-tertiary hover:bg-bg-elevated p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span>Remove Participant</span>
                          <X size={16} className="text-accent-error" />
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="border-b border-border-primary pb-3">
                    <h4 className="font-medium mb-2">Room Settings</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Allow Screen Sharing</span>
                        <button className="p-1.5 rounded-lg hover:bg-bg-tertiary transition-colors">
                          <MonitorUp size={14} className="text-accent-success" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Allow Camera</span>
                        <button className="p-1.5 rounded-lg hover:bg-bg-tertiary transition-colors">
                          <Video size={14} className="text-accent-success" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Allow Microphone</span>
                        <button className="p-1.5 rounded-lg hover:bg-bg-tertiary transition-colors">
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
  )
}
