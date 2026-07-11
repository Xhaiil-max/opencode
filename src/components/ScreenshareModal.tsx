import { useState } from 'react'
import { X, Monitor, MonitorUp, Grid3x3, Crop, Volume2 } from 'lucide-react'

interface ScreenshareModalProps {
  onClose: () => void
  onStartScreenShare?: () => Promise<void>
}

export default function ScreenshareModal({ onClose, onStartScreenShare }: ScreenshareModalProps) {
  const [tab, setTab] = useState<'main' | 'settings'>('main')
  const [includeAudio, setIncludeAudio] = useState(true)
  const [resolution, setResolution] = useState('1920x1080')
  const [frameRate, setFrameRate] = useState('30')
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null)

  const targets = [
    { id: 'full', label: 'Fullscreen', icon: Monitor, desc: 'Entire screen(s)' },
    { id: 'tab', label: 'Browser Tab', icon: MonitorUp, desc: 'A single tab' },
    { id: 'window', label: 'App Window', icon: Grid3x3, desc: 'A specific window' },
    { id: 'region', label: 'Region/Crop', icon: Crop, desc: 'A selected area' },
  ]

  const nextStep = () => {
    if (tab === 'main' && selectedTarget) {
      onStartScreenShare?.();
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-zinc-900 rounded-2xl w-full max-w-lg mx-4 border border-zinc-800" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-lg font-medium">Share Screen</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-800"><X size={18} /></button>
        </div>

        <div className="flex items-center gap-1 px-4 pt-3">
          <button onClick={() => setTab('main')} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${tab === 'main' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'}`}>Main</button>
          <button onClick={() => setTab('settings')} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${tab === 'settings' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'}`}>Settings</button>
        </div>

        <div className="p-4">
          {tab === 'main' ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-zinc-400 mb-2">What would you like to share?</p>
              {targets.map(t => {
                const Icon = t.icon;
                const selected = selectedTarget === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTarget(t.id)}
                    className={`flex items-center gap-4 p-3 rounded-xl border transition-colors text-left ${selected ? 'bg-indigo-600/20 border-indigo-500/50' : 'bg-zinc-800/50 border-zinc-700/50 hover:bg-zinc-800'}`}
                  >
                    <div className={`p-2 rounded-lg ${selected ? 'bg-indigo-500/20' : 'bg-zinc-700'}`}>
                      <Icon size={20} className={selected ? 'text-indigo-400' : 'text-zinc-400'} />
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-medium">{t.label}</span>
                      <p className="text-xs text-zinc-500">{t.desc}</p>
                    </div>
                  </button>
                );
              })}

              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50 mt-2">
                <div className="flex items-center gap-2">
                  <Volume2 size={16} className="text-zinc-400" />
                  <span className="text-sm">Include Audio</span>
                </div>
                <button
                  onClick={() => setIncludeAudio(!includeAudio)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${includeAudio ? 'bg-indigo-500' : 'bg-zinc-700'}`}
                >
                  <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.75 transition-transform ${includeAudio ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <button onClick={nextStep} disabled={!selectedTarget} className="mt-4 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 transition-colors text-sm font-medium">
                {selectedTarget ? 'Start Sharing' : 'Select a target to share'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-zinc-400 mb-2 block">Send Resolution</label>
                <select value={resolution} onChange={e => setResolution(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm outline-none">
                  <option>1920x1080</option>
                  <option>1280x720</option>
                  <option>2560x1440</option>
                  <option>3840x2160</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-2 block">Frame Rate</label>
                <select value={frameRate} onChange={e => setFrameRate(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm outline-none">
                  <option>30</option>
                  <option>60</option>
                  <option>120</option>
                  <option>144</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
