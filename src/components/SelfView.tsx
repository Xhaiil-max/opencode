import { Monitor } from 'lucide-react'
import ParticipantVideo from './ParticipantVideo'
import { Track } from 'livekit-client'
import { useRoom } from '../context/LiveKitContext'

interface SelfViewProps {
  username: string
  camOn: boolean
  isSharing?: boolean
  floating?: boolean
}

export default function SelfView({ username, camOn, isSharing, floating }: SelfViewProps) {
  const room = useRoom()
  const localParticipant = room?.localParticipant

  const content = isSharing && localParticipant ? (
    <ParticipantVideo
      participant={localParticipant}
      isLocal
      source={Track.Source.ScreenShare}
    />
  ) : camOn && localParticipant ? (
    <ParticipantVideo participant={localParticipant} isLocal />
  ) : (
    <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
      <span className="text-sm font-medium text-zinc-300">{username[0]}</span>
    </div>
  )

  if (floating) {
    return (
      <div className="fixed bottom-24 right-4 z-40 w-52 rounded-xl overflow-hidden shadow-2xl border border-zinc-700/50 bg-zinc-800" style={{ aspectRatio: '16/9' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
          {content}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/70 to-transparent">
          <span className="text-xs font-medium">{username} (You)</span>
          {isSharing && <Monitor size={10} className="inline ml-1 text-emerald-400" />}
        </div>
      </div>
    )
  }

  return (
    <div className="relative rounded-xl overflow-hidden bg-zinc-800/80 border border-zinc-700/30" style={{ aspectRatio: '16/9' }}>
      <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
        {content}
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/70 to-transparent">
        <span className="text-xs font-medium">{username} (You)</span>
      </div>
    </div>
  )
}
