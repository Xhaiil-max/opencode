import { useState, useEffect, useRef } from 'react'
import { useLiveKit } from '../hooks/useLiveKit'
import type { User } from '../types'
import { Mic, MicOff, MonitorUp, Volume2, VolumeX, Eye, EyeOff, MoreVertical } from 'lucide-react'
import ParticipantVideo from './ParticipantVideo'
import { Track } from 'livekit-client'

interface ParticipantTileProps {
  user: User
  isCurrent?: boolean
}

export default function ParticipantTile({ user, isCurrent }: ParticipantTileProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [localVolume, setLocalVolume] = useState(user.volume)
  const [localMute, setLocalMute] = useState(false)
  const [localVideoOff, setLocalVideoOff] = useState(user.localVideoDisabled)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const { room } = useLiveKit({ username: user.id === '1' ? user.name : '', roomName: '' })
  const currentRoom = room.current

  // Get participant by identity
  const participant = currentRoom
    ? currentRoom.localParticipant.identity === user.id
      ? currentRoom.localParticipant
      : currentRoom.remoteParticipants.get(user.id)
    : null

  const initials = user.name.split(' ').slice(0, 2).map(n => n[0]).join('')

  useEffect(() => {
    if (!participant || participant === currentRoom?.localParticipant) return

    const handleTrackSubscription = () => {
      // Get audio track using Track.Source.Microphone (similar to how ParticipantVideo gets video)
      const pub = participant.getTrackPublication(Track.Source.Microphone)
      if (pub?.track && audioRef.current) {
        // Attach the audio track to the audio element
        pub.track.attach(audioRef.current)
        audioRef.current.muted = localMute
        audioRef.current.volume = localVolume / 100
      } else if (audioRef.current) {
        // Detach any existing tracks
        audioRef.current.srcObject = null
      }
    }

    // Subscribe to track events to handle subscription/unsubscription
    if (participant) {
      participant.on('trackSubscribed', handleTrackSubscription)
      participant.on('trackUnsubscribed', handleTrackSubscription)
      participant.on('trackPublished', handleTrackSubscription)
      participant.on('trackUnpublished', handleTrackSubscription)

      // Initial check
      handleTrackSubscription()
    }

    return () => {
      if (participant) {
        participant.off('trackSubscribed', handleTrackSubscription)
        participant.off('trackUnsubscribed', handleTrackSubscription)
        participant.off('trackPublished', handleTrackSubscription)
        participant.off('trackUnpublished', handleTrackSubscription)
      }
      // Detach any tracks when cleaning up
      if (audioRef.current) {
        audioRef.current.srcObject = null
      }
    }
  }, [participant, currentRoom?.localParticipant, audioRef, localMute, localVolume])

  return (
    <div
      className={`relative rounded-xl overflow-hidden group bg-zinc-800/80 ${
        user.isSpeaking ? 'ring-2 ring-indigo-500' : ''
      } ${user.isSharing ? 'ring-2 ring-emerald-500' : ''}`}
      style={{ aspectRatio: user.camOn ? '16/9' : '16/10' }}
    >
      {user.camOn && participant && participant !== currentRoom?.localParticipant ? (
        <ParticipantVideo
          participant={participant}
          isLocal={user.id === '1'}
        />
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
            <span className="text-zinc-500/30 font-mono text-sm">CAM-{user.id}</span>
            {user.isSharing && (
              <div className="absolute inset-0 bg-emerald-900/20 flex items-center justify-center">
                <MonitorUp size={28} className="text-emerald-400/60" />
              </div>
            )}
          </div>
          {user.isSharing && !user.localScreenshareDisabled ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-1">
                <MonitorUp size={22} className="text-emerald-400/60" />
                <span className="text-xs text-emerald-400/60 font-mono">SCREEN</span>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-zinc-700 flex items-center justify-center">
                <span className="text-lg font-medium text-zinc-300">{initials}</span>
              </div>
            </div>
          )}
        </>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent flex items-center gap-1.5">
        <div className="flex gap-1 mr-auto">
          {user.micOn ? <Mic size={12} className="text-green-400" /> : <MicOff size={12} className="text-red-400" />}
          {user.handRaised && <span className="text-yellow-400 text-xs">RH</span>}
          {user.isSharing && <MonitorUp size={12} className="text-emerald-400" />}
        </div>
        <span className="text-xs font-medium truncate">{user.name}{isCurrent ? ' (You)' : ''}</span>
      </div>

      {user.id !== '1' && (
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
                <input type="range" min="0" max="100" value={localVolume} onChange={e => setLocalVolume(Number(e.target.value))} className="w-full accent-indigo-500 h-1" />
              </div>
              <button onClick={() => setLocalMute(!localMute)} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors">
                {localMute ? <VolumeX size={14} className="text-red-400" /> : <Volume2 size={14} />} {localMute ? 'Unmute' : 'Mute'}
              </button>
              <button onClick={() => setLocalVideoOff(!localVideoOff)} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors">
                {localVideoOff ? <Eye size={14} /> : <EyeOff size={14} className="text-red-400" />} {localVideoOff ? 'Enable Video' : 'Disable Video (Local)'}
              </button>
              <button onClick={() => { user.localScreenshareDisabled = !user.localScreenshareDisabled; setShowMenu(false) }} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors">
                <MonitorUp size={14} className={user.localScreenshareDisabled ? '' : 'text-red-400'} /> {user.localScreenshareDisabled ? 'Allow Screenshare' : 'Block Screenshare (Local)'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Audio element for remote participant audio - hidden */}
      <audio
        ref={audioRef}
        autoPlay
        playsInline
        muted={localMute}
      />
    </div>
  )
}