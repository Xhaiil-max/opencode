import { useState } from 'react'
import { X, Mic, Video, Keyboard, Settings, BarChart3, Volume2, Grid3x3, SplitSquareVertical, Menu, PanelRight } from 'lucide-react'
import type { TabName, Keybind, GridPreset } from '../types'
import { STATS, DEFAULT_KEYBINDS } from '../mockData'

interface SettingsPanelProps {
  onClose: () => void
  gridPreset: GridPreset
  onGridPresetChange: (preset: GridPreset) => void
}

const tabs: { name: TabName; label: string; icon: any }[] = [
  { name: 'audio', label: 'Audio', icon: Mic },
  { name: 'video', label: 'Video', icon: Video },
  { name: 'keybinds', label: 'Keybinds', icon: Keyboard },
  { name: 'general', label: 'General', icon: Settings },
  { name: 'stats', label: 'Stats', icon: BarChart3 },
];

export default function SettingsPanel({ onClose, gridPreset, onGridPresetChange }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabName>('audio');
  const [microphone, setMicrophone] = useState('Scarlett 2i2');
  const [camera, setCamera] = useState('Logitech C920');
  const [resolution, setResolution] = useState('1080p');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [cropSetting, setCropSetting] = useState('Fit');
  const [gainslider, setGainslider] = useState(75);
  const [autoLeave, setAutoLeave] = useState(true);
  const [theme, setTheme] = useState('Dark');
  const [keybinds, setKeybinds] = useState<Keybind[]>(DEFAULT_KEYBINDS);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const handleKeybindCapture = (e: React.KeyboardEvent, id: string) => {
    e.preventDefault();
    const keys: string[] = [];
    if (e.ctrlKey || e.metaKey) keys.push('Ctrl');
    if (e.altKey) keys.push('Alt');
    if (e.shiftKey) keys.push('Shift');
    const key = e.key.toUpperCase();
    if (!['CONTROL', 'ALT', 'SHIFT', 'META'].includes(key)) keys.push(key);
    if (keys.length > 0) {
      setKeybinds(prev => prev.map(k => k.id === id ? { ...k, keys: keys.join('+') } : k));
      setEditingKey(null);
    }
  };

  const gridPresets: { value: GridPreset; label: string; icon: any }[] = [
    { value: 'tiled', label: 'Tiled', icon: Grid3x3 },
    { value: 'spotlight', label: 'Spotlight', icon: SplitSquareVertical },
    { value: 'speaker', label: 'Speaker', icon: Menu },
    { value: 'sidebar', label: 'Sidebar', icon: PanelRight },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-zinc-900 rounded-2xl w-full max-w-2xl mx-4 border border-zinc-800 flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
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
                  <select value={microphone} onChange={e => setMicrophone(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm outline-none">
                    <option>Scarlett 2i2</option>
                    <option>USB Headset</option>
                    <option>Webcam Mic</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-2 block">Mic Tester</label>
                  <div className="p-3 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center gap-3">
                    <Volume2 size={20} className="text-zinc-400" />
                    <div className="flex-1 h-2 bg-zinc-700 rounded-full overflow-hidden">
                      <div className="h-full w-2/5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" />
                    </div>
                    <span className="text-xs text-zinc-500">-23 dB</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Volume Gain</label>
                  <input type="range" min="0" max="100" value={gainslider} onChange={e => setGainslider(Number(e.target.value))} className="w-full accent-indigo-500" />
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>0%</span>
                    <span>{gainslider}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'video' && (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Camera</label>
                  <select value={camera} onChange={e => setCamera(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm outline-none">
                    <option>Logitech C920</option>
                    <option>MacBook Camera</option>
                    <option>External 4K</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Crop Setting</label>
                  <select value={cropSetting} onChange={e => setCropSetting(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm outline-none">
                    <option>Fit</option>
                    <option>Fill</option>
                    <option>Center</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Resolution</label>
                  <div className="flex gap-2">
                    {['720p', '1080p', '4K'].map(r => (
                      <button
                        key={r}
                        onClick={() => setResolution(r)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${resolution === r ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Aspect Ratio</label>
                  <div className="flex gap-2">
                    {['16:9', '4:3', '21:9'].map(r => (
                      <button
                        key={r}
                        onClick={() => setAspectRatio(r)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${aspectRatio === r ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
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
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-zinc-300">Auto-leave empty calls</span>
                    <button onClick={() => setAutoLeave(!autoLeave)} className="w-8 h-4 rounded-full bg-indigo-500 relative"><div className="w-3 h-3 bg-white rounded-full absolute top-0.5 left-4" /></button>
                  </div>
                  <div className="border-t border-zinc-800 my-2" />
                  <div>
                    <label className="text-xs text-zinc-400 mb-2 block">Theme</label>
                    <div className="flex gap-2">
                      {['Dark', 'Darker', 'Contrast'].map(t => (
                        <button key={t} onClick={() => setTheme(t)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${theme === t ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-zinc-800 my-2" />
                  <div>
                    <label className="text-xs text-zinc-400 mb-2 block">Grid Layout</label>
                    <div className="grid grid-cols-2 gap-2">
                      {gridPresets.map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          onClick={() => onGridPresetChange(value)}
                          className={`flex items-center gap-2 p-3 rounded-xl border transition-colors text-sm ${gridPreset === value ? 'bg-indigo-600/20 border-indigo-500/50' : 'bg-zinc-800/50 border-zinc-700/50 hover:bg-zinc-800'}`}
                        >
                          <Icon size={16} className={gridPreset === value ? 'text-indigo-400' : 'text-zinc-400'} /> {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'stats' && (
              <div>
                <div className="grid grid-cols-5 gap-px bg-zinc-800 rounded-xl overflow-hidden text-xs">
                  <div className="p-2 bg-zinc-900 font-medium text-zinc-500"></div>
                  <div className="p-2 bg-zinc-900 font-medium text-zinc-300">Audio</div>
                  <div className="p-2 bg-zinc-900 font-medium text-zinc-300">Video</div>
                  <div className="p-2 bg-zinc-900 font-medium text-zinc-300">Screenshare</div>
                  <div className="p-2 bg-zinc-900 font-medium text-zinc-300">Overall</div>
                  {STATS.map((stat, i) => (
                    <>
                      <div key={stat.label + '-' + i} className="p-2 bg-zinc-900 text-zinc-400">{stat.label}</div>
                      <div className="p-2 bg-zinc-900 font-mono">{stat.audio}</div>
                      <div className="p-2 bg-zinc-900 font-mono">{stat.video}</div>
                      <div className="p-2 bg-zinc-900 font-mono">{stat.screenshare}</div>
                      <div className="p-2 bg-zinc-900 font-mono">{stat.audio}</div>
                    </>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
