import type { User } from '../types'
import { Mic, MicOff, PhoneOff, Maximize } from 'lucide-react'

interface PiPViewProps {
  users: User[]
  isMicOn: boolean
  isCamOn: boolean
  isDeafened?: boolean
  onMicToggle: () => void
  onCamToggle?: () => void
  onClosePip: () => void
  onEndCall: () => void
}

export default function PiPView({
  users, isMicOn, isCamOn,
  onMicToggle, onClosePip, onEndCall
}: PiPViewProps) {

  const activeSpeaker = users.find(u => u.isSpeaking) || users[0];
  const firstLetter = activeSpeaker.name[0];

  return (
    <div className="fixed bottom-24 right-4 z-50 w-72 rounded-xl overflow-hidden shadow-2xl border border-zinc-700/50 bg-zinc-900">
      {/* Video / avatar area */}
      <div className="relative" style={{ aspectRatio: '16/9' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
          {activeSpeaker.camOn ? (
            <span className="text-zinc-500/30 text-xs font-mono">CAM</span>
          ) : (
            <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center">
              <span className="text-lg font-medium text-zinc-300">{firstLetter}</span>
            </div>
          )}
        </div>

        {/* Speaker name */}
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
          <span className="text-xs font-medium">{activeSpeaker.name}</span>
        </div>

        {/* Close p ip */}
        <button onClick={onClosePip} className="absolute top-2 right-2 p-1 rounded-lg bg-black/40 hover:bg-black/60 transition-colors">
          <Maximize size={12} />
        </button>
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-center gap-2 p-2.5 bg-zinc-900 border-t border-zinc-800">
        <button
          onClick={onMicToggle}
          className={`p-2 rounded-lg transition-colors ${!isMicOn ? 'bg-red-500/20 text-red-400' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`}
        >
          {isMicOn ? <Mic size={16} /> : <MicOff size={16} />}
        </button>
        <button onClick={() => {}} className="text-zinc-400 hover:text-zinc-200 p-2 rounded-lg hover:bg-zinc-800 transition-colors">
          {isCamOn ? <MicOff size={16} /> : <Mic size={16} />}
        </button>
        <div className="w-px h-5 bg-zinc-800" />
        <button onClick={onEndCall} className="p-2 rounded-lg bg-red-600 hover:bg-red-500 transition-colors">
          <PhoneOff size={16} />
        </button>
      </div>
    </div>
  );
}
