import { useState } from 'react'
import { X, Mic, Video, Keyboard, Settings, Grid3x3, SplitSquareVertical, Menu, PanelRight, User } from 'lucide-react'
import type { TabName, Keybind, GridPreset, SelfViewMode } from '../types'

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
}

const tabs: { name: TabName; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { name: 'audio', label: 'Audio', icon: Mic },
  { name: 'video', label: 'Video', icon: Video },
  { name: 'keybinds', label: 'Keybinds', icon: Keyboard },
  { name: 'general', label: 'General', icon: Settings },
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
}: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabName>('audio')
  const [editingKey, setEditingKey] = useState<string | null>(null)

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

        <div className="flex flex-1 overflow-hidden">
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

          <div className="flex-1 overflow-y-auto p-4">
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
              </div>
            )}

            {activeTab === 'video' && (
              <div className="flex flex-col gap-4">
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
