import type { User } from '../types'
import ParticipantVideo from './ParticipantVideo'
import { Track } from 'livekit-client'
import { useRoom } from '../context/LiveKitContext'

interface FloatingFilmstripProps {
  users: User[]
  localIdentity: string
}

function MiniTile({ user, isLocal }: { user: User; isLocal: boolean }) {
  const room = useRoom()
  const participant = room
    ? isLocal
      ? room.localParticipant
      : room.remoteParticipants.get(user.id) ?? null
    : null

  const initials = user.name[0]
  const showVideo = user.camOn && participant && !user.isSharing

  return (
    <div
      className={`relative shrink-0 w-28 h-16 rounded-lg overflow-hidden bg-zinc-800 border ${
        user.isSpeaking ? 'border-indigo-500 ring-1 ring-indigo-500/50' : 'border-zinc-700/60'
      }`}
    >
      {user.isSharing && participant ? (
        <ParticipantVideo participant={participant} isLocal={isLocal} source={Track.Source.ScreenShare} />
      ) : showVideo ? (
        <ParticipantVideo participant={participant} isLocal={isLocal} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
          <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center">
            <span className="text-xs font-medium text-zinc-300">{initials}</span>
          </div>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 px-1 py-0.5 bg-gradient-to-t from-black/80 to-transparent">
        <span className="text-[10px] font-medium truncate block">
          {user.name}{isLocal ? ' (You)' : ''}
        </span>
      </div>
    </div>
  )
}

export default function FloatingFilmstrip({ users, localIdentity }: FloatingFilmstripProps) {
  if (users.length === 0) return null

  return (
    <div className="fixed bottom-[5.5rem] right-4 z-30 flex gap-1.5 p-1.5 rounded-xl bg-zinc-900/90 border border-zinc-700/50 shadow-2xl backdrop-blur-sm max-w-[min(90vw,420px)] overflow-x-auto scrollbar-thin">
      {users.map(u => (
        <MiniTile key={u.id} user={u} isLocal={u.id === localIdentity} />
      ))}
    </div>
  )
}
