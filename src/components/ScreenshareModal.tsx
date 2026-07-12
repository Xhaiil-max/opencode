import { MonitorUp } from 'lucide-react'

interface ScreenshareModalProps {
  onClose: () => void
  onStartScreenShare?: () => Promise<void>
}

export default function ScreenshareModal({ onClose, onStartScreenShare }: ScreenshareModalProps) {
  const handleShare = async () => {
    await onStartScreenShare?.()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-2xl w-full max-w-md mx-4 border border-zinc-800 p-6">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/20">
            <MonitorUp size={32} className="text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-medium mb-1">Share your screen</h2>
            <p className="text-sm text-zinc-400">
              Your browser will ask which screen, window, or tab to share.
            </p>
          </div>
          <div className="flex gap-3 w-full mt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleShare}
              className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors text-sm font-medium"
            >
              Choose what to share
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
