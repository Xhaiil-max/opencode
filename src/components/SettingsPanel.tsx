import { useState } from 'react'
import { X, Mic, Video, Keyboard, Settings, Grid3x3, SplitSquareVertical, Menu, PanelRight, User, BarChart3, Palette } from 'lucide-react'
import type { TabName, Keybind, GridPreset, SelfViewMode, Stats } from '../types'
import type { Room } from 'livekit-client'
import AudioVisualizer from './AudioVisualizer'
import ParticipantVideo from './ParticipantVideo'
import { useAudioLevel, useLocalMicStream } from '../hooks/useAudioLevel'
import ColorPicker from './ColorPicker'

interface SettingsPanelProps {
  onClose: () => void
  keybinds: Keybind[]
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
}

const tabs: { name: TabName; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { name: 'audio', label: 'Audio', icon: Mic },
  { name: 'video', label: 'Video', icon: Video },
  { name: 'keybinds', label: 'Keybinds', icon: Keyboard },
  { name: 'general', label: 'General', icon: Settings },
  { name: 'stats', label: 'Stats', icon: BarChart3 },
]

export default function SettingsPanel({
  onClose,
  keybinds,
  audioDevices,
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
}: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabName>('audio')
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const micStream = useLocalMicStream(room, micOn)
  const micLevel = useAudioLevel(micStream, micOn)

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
              onClick={() => setActiveTab(name)}
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
                  <AudioVisualizer level={micLevel} className="h-6 flex-1" />
                  <span className="text-xs font-mono text-text-secondary w-16 text-right">
                    {Math.round(micLevel * 100)}%
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
                  {audioDevices.map(d => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Microphone ${d.deviceId.slice(0, 6)}`}
                    </option>
                  ))}
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
                  {audioDevices.map(d => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Speaker ${d.deviceId.slice(0, 6)}`}
                    </option>
                  ))}
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
                  {videoDevices.map(d => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Camera ${d.deviceId.slice(0, 6)}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {activeTab === 'keybinds' && (
            <div className="space-y-3">
              {keybinds.map(k => (
                <div key={k.id} className="flex items-center justify-between p-3 rounded-xl bg-bg-tertiary border border-border-primary">
                  <span className="text-sm text-text-primary">{k.label}</span>
                  <button
                    onClick={e => { e.stopPropagation(); setEditingKey(k.id) }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors $
                      {editingKey === k.id
                        ? 'bg-haze-500/20 text-haze-400 ring-2 ring-haze-500/50'
                        : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'`}
                  >
                    {editingKey === k.id ? 'Press key...' : k.keys}
                  </button>
                </div>
              ))}
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
                      onClick={() => {}}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-colors $
                        {false
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
                      onClick={() => {}}
                      className={`flex items-center gap-2 p-3 rounded-xl border transition-colors text-sm $
                        {false
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
        </div>
      </div>
    </div>
  )
}
