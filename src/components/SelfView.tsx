import { Monitor } from 'lucide-react'

interface SelfViewProps {
  username: string
  camOn: boolean
  floating?: boolean
  large?: boolean
}

export default function SelfView({ username, camOn, floating, large }: SelfViewProps) {
  if (floating) {
    return (
      <div className="fixed bottom-24 right-4 z-40 w-52 rounded-xl overflow-hidden shadow-2xl border border-zinc-700/50 cursor-grab active:cursor-grabbing bg-zinc-800" style={{ aspectRatio: '16/9' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
          {camOn ? (
            <span className="text-zinc-500/30 text-xs font-mono">YOUR CAM</span>
          ) : (
            <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
              <span className="text-sm font-medium text-zinc-300">{username[0]}</span>
            </div>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/70 to-transparent">
          <span className="text-xs font-medium">{username}</span>
        </div>
      </div>
    )
  }

  if (large) {
    return (
      <div className="rounded-xl overflow-hidden bg-zinc-800/80 border border-zinc-700/30 h-full flex flex-col items-center justify-center" style={{ aspectRatio: '16/9' }}>
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-full bg-zinc-700 flex items-center justify-center">
            <span className="text-2xl font-medium text-zinc-300">{username[0]}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Monitor size={14} className="text-emerald-400" />
            <span className="text-xs font-medium text-zinc-300">{username} - Screenshare</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl overflow-hidden bg-zinc-800/80 border border-zinc-700/30" style={{ aspectRatio: '16/9' }}>
      <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
        {camOn ? (
          <span className="text-zinc-500/30 text-xs font-mono">YOUR CAM</span>
        ) : (
          <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
            <span className="text-sm font-medium text-zinc-300">{username[0]}</span>
          </div>
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/70 to-transparent">
        <span className="text-xs font-medium">{username} (You)</span>
      </div>
    </div>
  )
}
