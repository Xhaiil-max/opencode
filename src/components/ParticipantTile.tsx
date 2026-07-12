import { useState, useEffect, useRef } from 'react'
import type { User } from '../types'
import { Mic, MicOff, MonitorUp, Volume2, VolumeX, Eye, EyeOff, MoreVertical } from 'lucide-react'
import ParticipantVideo from './ParticipantVideo'
import { Track, type Participant } from 'livekit-client'
import { useRoom, useLocalIdentity } from '../context/LiveKitContext'

interface ParticipantTileProps {
  user: User
  isCurrent?: boolean
  isDeafened?: boolean
}

export default function ParticipantTile({ user, isCurrent, isDeafened }: ParticipantTileProps) {
  const room = useRoom()
  const localIdentity = useLocalIdentity()
  const isLocal = user.id === localIdentity

  const [showMenu, setShowMenu] = useState(false)
  const [localVolume, setLocalVolume] = useState(user.volume)
  const [localMute, setLocalMute] = useState(false)
  const [localVideoOff, setLocalVideoOff] = useState(user.localVideoDisabled)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const participant: Participant | null = room
    ? room.localParticipant.identity === user.id
      ? room.localParticipant
      : room.remoteParticipants.get(user.id) ?? null
    : null

  const initials = user.name.split(' ').slice(0, 2).map(n => n[0]).join('')
  const showScreenShare = user.isSharing && !user.localScreenshareDisabled
  const showCamera = user.camOn && !localVideoOff && !showScreenShare

  useEffect(() => {
    if (!participant || isLocal) return

    const handleTrackSubscription = () => {
      const pub = participant.getTrackPublication(Track.Source.Microphone)
      if (pub?.track && audioRef.current) {
        pub.track.attach(audioRef.current)
        audioRef.current.muted = localMute || !!isDeafened
        audioRef.current.volume = localVolume / 100
      } else if (audioRef.current) {
        audioRef.current.srcObject = null
      }
    }

    participant.on('trackSubscribed', handleTrackSubscription)
    participant.on('trackUnsubscribed', handleTrackSubscription)
    participant.on('trackPublished', handleTrackSubscription)
    participant.on('trackUnpublished', handleTrackSubscription)
    handleTrackSubscription()

    return () => {
      participant.off('trackSubscribed', handleTrackSubscription)
      participant.off('trackUnsubscribed', handleTrackSubscription)
      participant.off('trackPublished', handleTrackSubscription)
      participant.off('trackUnpublished', handleTrackSubscription)
      if (audioRef.current) audioRef.current.srcObject = null
    }
  }, [participant, isLocal, localMute, localVolume, isDeafened])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = localVolume / 100
    }
  }, [localVolume])

  return (
    <div
      className={`relative rounded-xl overflow-hidden group bg-zinc-800/80 ${
        user.isSpeaking ? 'ring-2 ring-indigo-500' : ''
      } ${user.isSharing ? 'ring-2 ring-emerald-500' : ''}`}
      style={{ aspectRatio: showScreenShare ? '16/9' : user.camOn ? '16/9' : '16/10' }}
    >
      {showScreenShare && participant ? (
        <ParticipantVideo
          participant={participant}
          isLocal={isLocal}
          source={Track.Source.ScreenShare}
        />
      ) : showCamera && participant ? (
        <ParticipantVideo participant={participant} isLocal={isLocal} />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
          {user.isSharing ? (
            <div className="flex flex-col items-center gap-1">
              <MonitorUp size={22} className="text-emerald-400/60" />
              <span className="text-xs text-emerald-400/60">Sharing screen</span>
            </div>
          ) : (
            <div className="w-14 h-14 rounded-full bg-zinc-700 flex items-center justify-center">
              <span className="text-lg font-medium text-zinc-300">{initials}</span>
            </div>
          )}
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent flex items-center gap-1.5">
        <div className="flex gap-1 mr-auto">
          {user.micOn ? <Mic size={12} className="text-green-400" /> : <MicOff size={12} className="text-red-400" />}
          {user.handRaised && <span className="text-yellow-400 text-xs">✋</span>}
          {user.isSharing && <MonitorUp size={12} className="text-emerald-400" />}
        </div>
        <span className="text-xs font-medium truncate">{user.name}{isCurrent ? ' (You)' : ''}</span>
      </div>

      {!isLocal && (
        <div className="absolute top-2 right-2">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-lg bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
          >
            <MoreVertical size={14} />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-9 w-56 bg-zinc-900 border border-zinc-700 rounded-xl p-3 shadow-2xl z-30 flex flex-col gap-2.5">
              <div>
                <label className="text-xs text-zinc-400 mb-1 flex items-center gap-1"><Volume2 size={12} /> Volume</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={localVolume}
                  onChange={e => setLocalVolume(Number(e.target.value))}
                  className="w-full accent-indigo-500 h-1"
                />
              </div>
              <button onClick={() => setLocalMute(!localMute)} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors">
                {localMute ? <VolumeX size={14} className="text-red-400" /> : <Volume2 size={14} />} {localMute ? 'Unmute' : 'Mute'}
              </button>
              <button onClick={() => setLocalVideoOff(!localVideoOff)} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors">
                {localVideoOff ? <Eye size={14} /> : <EyeOff size={14} className="text-red-400" />} {localVideoOff ? 'Show Video' : 'Hide Video (Local)'}
              </button>
            </div>
          )}
        </div>
      )}

      {!isLocal && (
        <audio ref={audioRef} autoPlay playsInline muted={localMute || !!isDeafened} />
      )}
    </div>
  )
}
