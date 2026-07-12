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
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [showMenu])

  const openMenu = () => {
    if (!menuBtnRef.current) return
    const rect = menuBtnRef.current.getBoundingClientRect()
    setMenuPos({ top: rect.bottom, left: rect.left })
    setShowMenu(true)
  }

  if (!isLocal && !user.camOn && !user.micOn && !user.isSharing && !isCurrent) {
    return (
      <div className="relative aspect-video flex items-center justify-center bg-bg-tertiary border border-border-primary rounded-xl">
        <div className="text-center p-4 text-text-muted">
          <div className="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center" style={{"backgroundColor": userColor}}>
            <span className="text-lg font-medium text-white">{initials}</span>
          </div>
          <span className="text-sm font-medium" style={{"color": userColor}}>{user.name}{isCurrent ? ' (You)' : ''}</span>
          <span className="block text-xs mt-1">Not joined yet</span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative aspect-video bg-bg-tertiary border border-border-primary rounded-xl overflow-hidden group flex flex-col">
      <audio ref={audioRef} autoPlay playsInline muted={localMute || !!isDeafened} />
      <audio ref={screenAudioRef} autoPlay playsInline muted={localMute || !!isDeafened} />

      <div className="relative flex-1 overflow-hidden bg-black/50">
        {(showScreenShare || !showCamera) ? (
          <div className="absolute inset-0 flex items-center justify-center" style={{"backgroundColor": getDesaturatedColor(userColor, 0.3)}}>
            {user.isSharing ? (
              <div className="flex flex-col items-center gap-1">
                <MonitorUp size={22} className="text-accent-success/60" />
                <span className="text-xs text-accent-success/60">Sharing screen</span>
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{"backgroundColor": userColor}}>
                <span className="text-lg font-medium text-white">{initials}</span>
              </div>
            )}
          </div>
        ) : showCamera && participant ? (
          <ParticipantVideo participant={participant} isLocal={isLocal} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{"backgroundColor": getDesaturatedColor(userColor, 0.3)}}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{"backgroundColor": userColor}}>
              <span className="text-lg font-medium text-white">{initials}</span>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-bg-primary/80 to-transparent flex items-center gap-1.5 z-10">
        <div className="flex gap-1 mr-auto">
          {user.micOn ? <Mic size={12} className="text-accent-success" /> : <MicOff size={12} className="text-accent-error" />}
          {user.handRaised && <span className="text-accent-warning text-xs">✋</span>}
          {user.isSharing && <MonitorUp size={12} className="text-accent-success" />}
        </div>
        <span className="text-xs font-medium truncate" style={{"color": userColor}}>{user.name}{isCurrent ? ' (You)' : ''}</span>
      </div>

      {!isLocal && (
        <div className="absolute top-2 right-2 z-20">
          <button
            ref={menuBtnRef}
            onClick={() => showMenu ? setShowMenu(false) : openMenu()}
            className="btn-ghost btn-icon-sm"
          >
            <MoreVertical size={14} />
          </button>
        </div>
      )}

      {!isLocal && showMenu && createPortal(
        <div
          className="fixed z-[100] w-56 glass-strong rounded-xl p-3 shadow-2xl flex flex-col gap-2.5 -translate-x-full -translate-y-full"
          style={{"top": menuPos.top, "left": menuPos.left}}
        >
          <div>
            <label className="text-xs text-text-muted mb-1 flex items-center gap-1"><Volume2 size={12} /> Volume</label>
            <input
              type="range"
              min="0"
              max="100"
              value={localVolume}
              onChange={e => setLocalVolume(Number(e.target.value))}
              className="w-full accent-haze-500 h-1"
            />
          </div>
          <button onClick={() => setLocalMute(!localMute)} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg hover:bg-bg-tertiary transition-colors">
            {localMute ? <VolumeX size={14} className="text-accent-error" /> : <Volume2 size={14} />} {localMute ? 'Unmute' : 'Mute'}
          </button>
          <button onClick={() => setLocalVideoOff(!localVideoOff)} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg hover:bg-bg-tertiary transition-colors">
            {localVideoOff ? <Eye size={14} /> : <EyeOff size={14} className="text-accent-error" />} {localVideoOff ? 'Show Video' : 'Hide Video (Local)'}
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
