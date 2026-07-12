import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { User } from '../types'
import { Mic, MicOff, MonitorUp, Volume2, VolumeX, Eye, EyeOff, MoreVertical } from 'lucide-react'
import ParticipantVideo from './ParticipantVideo'
import { Track, type Participant } from 'livekit-client'
import { useRoom, useLocalIdentity } from '../context/LiveKitContext'
import { getDesaturatedColor } from '../utils/colors'

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
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const [localVolume, setLocalVolume] = useState(user.volume)
  const [localMute, setLocalMute] = useState(false)
  const [localVideoOff, setLocalVideoOff] = useState(user.localVideoDisabled)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const screenAudioRef = useRef<HTMLAudioElement | null>(null)
  const menuBtnRef = useRef<HTMLButtonElement | null>(null)

  const participant: Participant | null = room
    ? room.localParticipant.identity === user.id
      ? room.localParticipant
      : room.remoteParticipants.get(user.id) ?? null
    : null

  const initials = user.name.split(' ').slice(0, 2).map(n => n[0]).join('')
  const showScreenShare = user.isSharing && !user.localScreenshareDisabled
  const userColor = user.color || '#6366f1'
  const showCamera = user.camOn && !localVideoOff && !showScreenShare

  const attachAudio = (source: Track.Source, ref: React.RefObject<HTMLAudioElement | null>) => {
    if (!participant || isLocal) return
    const pub = participant.getTrackPublication(source)
    if (pub?.track && ref.current) {
      pub.track.attach(ref.current)
      ref.current.muted = localMute || !!isDeafened
      ref.current.volume = localVolume / 100
    } else if (ref.current) {
      ref.current.srcObject = null
    }
  }

  useEffect(() => {
    if (!participant || isLocal) return

    const handleTrackSubscription = () => {
      attachAudio(Track.Source.Microphone, audioRef)
      attachAudio(Track.Source.ScreenShareAudio, screenAudioRef)
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
      if (screenAudioRef.current) screenAudioRef.current.srcObject = null
    }
  }, [participant, isLocal, localMute, localVolume, isDeafened])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = localVolume / 100
    if (screenAudioRef.current) screenAudioRef.current.volume = localVolume / 100
  }, [localVolume])

  useEffect(() => {
    if (!showMenu) return
    const close = (e: MouseEvent) => {
      if (menuBtnRef.current?.contains(e.target as Node)) return
      setShowMenu(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [showMenu])

  const openMenu = () => {
    if (menuBtnRef.current) {
      const rect = menuBtnRef.current.getBoundingClientRect()
      const menuWidth = 224 // w-56 = 14rem = 224px
      const menuHeight = 200 // approximate height
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      // Calculate position - try right side first
      let left = rect.right
      let top = rect.top - 8

      // Check if menu would go off right edge
      if (left + menuWidth > viewportWidth - 8) {
        left = rect.left - menuWidth - 8 // position to left of button
      }

      // Check if menu would go off bottom edge
      if (top + menuHeight > viewportHeight - 8) {
        top = viewportHeight - menuHeight - 8
      }

      // Check if menu would go off top edge
      if (top < 8) {
        top = 8
      }

      setMenuPos({ top, left })
    }
    setShowMenu(true)
  }

  return (
    <div
      className={`relative rounded-xl group ${
        user.isSpeaking ? 'ring-2 ring-indigo-500' : ''
      } ${user.isSharing ? 'ring-2 ring-emerald-500' : ''}`}
      style={{
        aspectRatio: showScreenShare ? '16/9' : user.camOn ? '16/9' : '16/10',
        backgroundColor: getDesaturatedColor(user.color, 0.2),
      }}
    >
      <div className="absolute inset-0 rounded-xl overflow-hidden">
        {showScreenShare && participant ? (
          <ParticipantVideo
            participant={participant}
            isLocal={isLocal}
            source={Track.Source.ScreenShare}
          />
        ) : showCamera && participant ? (
          <ParticipantVideo participant={participant} isLocal={isLocal} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: getDesaturatedColor(userColor, 0.3) }}>
            {user.isSharing ? (
              <div className="flex flex-col items-center gap-1">
                <MonitorUp size={22} className="text-emerald-400/60" />
                <span className="text-xs text-emerald-400/60">Sharing screen</span>
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: userColor }}>
                <span className="text-lg font-medium text-white">{initials}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent flex items-center gap-1.5 z-10">
        <div className="flex gap-1 mr-auto">
          {user.micOn ? <Mic size={12} className="text-green-400" /> : <MicOff size={12} className="text-red-400" />}
          {user.handRaised && <span className="text-yellow-400 text-xs">✋</span>}
          {user.isSharing && <MonitorUp size={12} className="text-emerald-400" />}
        </div>
        <span className="text-xs font-medium truncate" style={{ color: userColor }}>{user.name}{isCurrent ? ' (You)' : ''}</span>
      </div>

      {!isLocal && (
        <div className="absolute top-2 right-2 z-20">
          <button
            ref={menuBtnRef}
            onClick={() => showMenu ? setShowMenu(false) : openMenu()}
            className="p-1.5 rounded-lg bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
          >
            <MoreVertical size={14} />
          </button>
        </div>
      )}

      {!isLocal && showMenu && createPortal(
        <div
          className="fixed z-[100] w-56 bg-zinc-900 border border-zinc-700 rounded-xl p-3 shadow-2xl flex flex-col gap-2.5 -translate-x-full -translate-y-full"
          style={{ top: menuPos.top, left: menuPos.left }}
        >
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
        </div>,
        document.body
      )}

      {!isLocal && (
        <>
          <audio ref={audioRef} autoPlay playsInline muted={localMute || !!isDeafened} />
          <audio ref={screenAudioRef} autoPlay playsInline muted={localMute || !!isDeafened} />
        </>
      )}
    </div>
  )
}
