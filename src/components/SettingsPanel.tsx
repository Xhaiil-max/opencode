import { useState } from 'react'
import { X, Mic, Video, Keyboard, Settings, Grid3x3, SplitSquareVertical, Menu, PanelRight, User, Volume2, BarChart3, Palette } from 'lucide-react'
import type { TabName, Keybind, GridPreset, SelfViewMode, Stats } from '../types'
import type { Room } from 'livekit-client'
import AudioVisualizer from './AudioVisualizer'
import ParticipantVideo from './ParticipantVideo'
import { useAudioLevel, useLocalMicStream } from '../hooks/useAudioLevel'
import ColorPicker from './ColorPicker'

interface SettingsPanelProps {
  onClose: () => void
  gridPreset: GridPreset
  onGridPresetChange: (preset: GridPreset) => void
  selfViewMode: SelfViewMode
  onSelfViewModeChange: (mode: SelfViewMode) => void
  keybinds: Keybind[]
  onKeybindChange: (keybinds: Keybind[]) => void
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
  gridPreset,
  onGridPresetChange,
  selfViewMode,
  onSelfViewModeChange,
  keybinds,
  onKeybindChange,
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

  const handleKeybindCapture = (e: React.KeyboardEvent, id: string) => {
    e.preventDefault()
    const keys: string[] = []
    if (e.ctrlKey || e.metaKey) keys.push('Ctrl')
    if (e.altKey) keys.push('Alt')
    if (e.shiftKey) keys.push('Shift')
    const key = e.key.toUpperCase()
    if (!['CONTROL', 'ALT', 'SHIFT', 'META'].includes(key)) keys.push(key)
    if (keys.length > 0) {
      onKeybindChange(keybinds.map(k => k.id === id ? { ...k, keys: keys.join('+') } : k))
      setEditingKey(null)
    }
  }

  const gridPresets: { value: GridPreset; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { value: 'tiled', label: 'Tiled', icon: Grid3x3 },
    { value: 'spotlight', label: 'Spotlight', icon: SplitSquareVertical },
    { value: 'speaker', label: 'Speaker', icon: Menu },
    { value: 'sidebar', label: 'Sidebar', icon: PanelRight },
  ]

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-2xl w-full max-w-2xl mx-4 border border-zinc-800 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 shrink-0">
          <h2 className="text-lg font-medium">Settings</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-800"><X size={18} /></button>
        </div>

        <div className="flex flex-1 overflow-hidden min-h-0">
          <div className="w-36 border-r border-zinc-800 shrink-0 p-2">
            {tabs.map(({ name, label, icon: Icon }) => (
              <button
                key={name}
                onClick={() => setActiveTab(name)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors mb-0.5 ${activeTab === name ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
            {activeTab === 'audio' && (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Microphone</label>
                  <select
                    onChange={e => onSwitchAudioDevice(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm outline-none"
                    defaultValue=""
                  >
                    <option value="" disabled>Select microphone</option>
                    {audioDevices.map(d => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Microphone ${d.deviceId.slice(0, 6)}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 mb-2 block">Mic Tester</label>
                  <div className="p-3 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center gap-3">
                    <Volume2 size={20} className="text-zinc-400 shrink-0" />
                    <AudioVisualizer level={micOn ? micLevel : 0} className="flex-1" />
                    <span className="text-xs text-zinc-500 w-10 text-right">{micOn ? `${micLevel}%` : '—'}</span>
                  </div>
                  {!micOn && (
                    <p className="text-xs text-zinc-500 mt-1">Unmute your mic to test audio levels</p>
                  )}
                </div>

                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Input Gain</label>
                  <input
                    type="range"
                    min="0"
                    max="150"
                    value={micGain}
                    onChange={e => onMicGainChange(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                  <div className="flex justify-between text-xs text-zinc-500 mt-1">
                    <span>0%</span>
                    <span>{micGain}%</span>
                    <span>150%</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'video' && (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs text-zinc-400 mb-2 block">Camera Preview</label>
                  <div className="aspect-video rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700 relative">
                    {camOn && room?.localParticipant ? (
                      <ParticipantVideo participant={room.localParticipant} isLocal />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-sm">
                        Camera is off
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Camera</label>
                  <select
                    onChange={e => onSwitchVideoDevice(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm outline-none"
                    defaultValue=""
                  >
                    <option value="" disabled>Select camera</option>
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
              <div className="flex flex-col gap-2">
                {keybinds.map(kb => (
                  <div key={kb.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                    <span className="text-xs text-zinc-300">{kb.label}</span>
                    {editingKey === kb.id ? (
                      <input
                        autoFocus
                        onKeyDown={(e) => handleKeybindCapture(e, kb.id)}
                        onBlur={() => setEditingKey(null)}
                        className="px-3 py-1 rounded-lg bg-zinc-700 text-xs font-mono text-indigo-300 outline-none w-28 text-center"
                        placeholder="Press keys..."
                      />
                    ) : (
                      <button onClick={() => setEditingKey(kb.id)} className="px-3 py-1 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-xs font-mono text-zinc-300 transition-colors">
                        {kb.keys}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'stats' && stats && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                    <div className="text-xs text-zinc-400 mb-1">Audio</div>
                    <div className="text-sm font-mono">In: {stats.audio.inputLevel}%</div>
                    <div className="text-sm font-mono">Out: {stats.audio.outputLevel}%</div>
                    <div className="text-sm font-mono">Loss: {stats.audio.packetLoss.toFixed(1)}%</div>
                    <div className="text-sm font-mono">Jitter: {stats.audio.jitter.toFixed(1)}ms</div>
                    <div className="text-sm font-mono">Latency: {stats.audio.latency}ms</div>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                    <div className="text-xs text-zinc-400 mb-1">Video</div>
                    <div className="text-sm font-mono">{stats.video.width}x{stats.video.height}</div>
                    <div className="text-sm font-mono">{stats.video.frameRate}fps</div>
                    <div className="text-sm font-mono">Loss: {stats.video.packetLoss.toFixed(1)}%</div>
                    <div className="text-sm font-mono">Jitter: {stats.video.jitter.toFixed(1)}ms</div>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                    <div className="text-xs text-zinc-400 mb-1">Screenshare</div>
                    <div className="text-sm font-mono">{stats.screenShare.width}x{stats.screenShare.height}</div>
                    <div className="text-sm font-mono">{stats.screenShare.frameRate}fps</div>
                    <div className="text-sm font-mono">Loss: {stats.screenShare.packetLoss.toFixed(1)}%</div>
                    <div className="text-sm font-mono">Jitter: {stats.screenShare.jitter.toFixed(1)}ms</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'general' && (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs text-zinc-400 mb-2 block">Self View</label>
                  <div className="flex gap-2">
                    {(['grid', 'floating'] as SelfViewMode[]).map(mode => (
                      <button
                        key={mode}
                        onClick={() => onSelfViewModeChange(mode)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-colors ${selfViewMode === mode ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300' : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:bg-zinc-800'}`}
                      >
                        <User size={14} /> {mode === 'grid' ? 'In Grid' : 'Floating'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-2 block">Grid Layout</label>
                  <div className="grid grid-cols-2 gap-2">
                    {gridPresets.map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => onGridPresetChange(value)}
                        className={`flex items-center gap-2 p-3 rounded-xl border transition-colors text-sm ${gridPreset === value ? 'bg-indigo-600/20 border-indigo-500/50' : 'bg-zinc-800/50 border-zinc-700/50 hover:bg-zinc-800'}`}
                      >
                        <Icon size={16} /> {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-2 block flex items-center gap-1">
                    <Palette size={12} /> Your Color
                  </label>
                  <ColorPicker userColor={userColor} onUserColorChange={onUserColorChange} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
