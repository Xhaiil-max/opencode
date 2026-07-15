import { useState } from 'react'
import { X, MonitorUp, Volume2 } from 'lucide-react'
import type { ScreenShareSettings } from '../utils/screenShare'
import { DEFAULT_SCREENSHARE_SETTINGS } from '../utils/screenShare'

interface ScreenshareModalProps {
  onClose: () => void
  onStartScreenShare?: (settings: ScreenShareSettings) => Promise<void>
}

export default function ScreenshareModal({ onClose, onStartScreenShare }: ScreenshareModalProps) {
  const [tab, setTab] = useState<'main' | 'settings'>('main')
  const [settings, setSettings] = useState<ScreenShareSettings>(DEFAULT_SCREENSHARE_SETTINGS)

  const handleShare = async () => {
    await onStartScreenShare?.(settings)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="glass-card w-full max-w-lg mx-4 animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border-primary">
          <h2 className="text-lg font-display font-medium">Share Screen</h2>
          <button onClick={onClose} className="btn-ghost btn-icon-sm"><X size={18} /></button>
        </div>

        <div className="flex items-center gap-1 px-4 pt-3">
          <button
            onClick={() => setTab('main')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${tab === 'main' ? 'bg-bg-tertiary text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'}`}
          >
            Share
          </button>
          <button
            onClick={() => setTab('settings')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${tab === 'settings' ? 'bg-bg-tertiary text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'}`}
          >
            Quality
          </button>
        </div>

        <div className="p-4">
          {tab === 'main' ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-text-secondary">
                Choose a screen, window, or tab to share. Enable app audio below to share sound from applications (Chrome/Edge).
              </p>

              <div className="flex items-center justify-between p-3 rounded-xl bg-bg-tertiary border border-border-primary">
                <div className="flex items-center gap-2">
                  <Volume2 size={16} className="text-text-muted" />
                  <div>
                    <span className="text-sm block">Share application audio</span>
                    <span className="text-xs text-text-muted">Tab or window audio when supported</span>
                  </div>
                </div>
                <button
                  onClick={() => setSettings(s => ({ ...s, includeAudio: !s.includeAudio }))}
                  className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${settings.includeAudio ? 'bg-haze-500' : 'bg-bg-elevated'}`}
                >
                  <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${settings.includeAudio ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <div className="flex gap-3">
                <button onClick={onClose} className="btn-secondary flex-1 px-4 py-3">
                  Cancel
                </button>
                <button onClick={handleShare} className="btn-primary flex-1 px-4 py-3 flex items-center justify-center gap-2">
                  <MonitorUp size={16} /> Start Sharing
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-text-muted mb-2 block">Resolution</label>
                <select
                  value={settings.resolution}
                  onChange={e => setSettings(s => ({ ...s, resolution: e.target.value }))}
                  className="input appearance-none"
                >
                  <option value="1280x720">1280 × 720 (HD)</option>
                  <option value="1920x1080">1920 × 1080 (Full HD)</option>
                  <option value="2560x1440">2560 × 1440 (2K)</option>
                  <option value="3840x2160">3840 × 2160 (4K)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-text-muted mb-2 block">Frame Rate</label>
                <select
                  value={settings.frameRate}
                  onChange={e => setSettings(s => ({ ...s, frameRate: Number(e.target.value) }))}
                  className="input appearance-none"
                >
                  <option value={15}>15 fps</option>
                  <option value={24}>24 fps</option>
                  <option value={30}>30 fps</option>
                  <option value={60}>60 fps</option>
                </select>
              </div>
              <p className="text-xs text-text-muted">
                Higher quality uses more bandwidth. Actual quality depends on your browser and connection.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
