import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { User } from '../types'
import { Mic, MicOff, MonitorUp, Volume2, VolumeX, Eye, EyeOff, MoreVertical, EarOff, Video } from 'lucide-react'
import ParticipantVideo from './ParticipantVideo'
import AudioVisualizer from './AudioVisualizer'
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
    const menuWidth = 224 // w-56 = 224px
    const menuHeight = 140 // approximate height
    
    let left = rect.left
    let top = rect.bottom + 4 // 4px gap below button
    
    // Check if menu would go off right edge
    if (left + menuWidth > window.innerWidth) {
      left = window.innerWidth - menuWidth - 8 // 8px padding from edge
    }
    // Check if menu would go off left edge
    if (left < 8) {
      left = 8
    }
    // Check if menu would go off bottom edge
    if (top + menuHeight > window.innerHeight) {
      top = rect.top - menuHeight - 4 // Show above button instead
    }
    // Check if menu would go off top edge
    if (top < 0) {
      top = 8
    }
    
    setMenuPos({ top, left })
    setShowMenu(true)
  }

  if (!isLocal && !isCurrent && !participant) {
    return (
      <div className="relative aspect-video flex items-center justify-center bg-bg-tertiary border border-border-primary rounded-xl">
        <div className="text-center p-4 text-text-muted">
          <div className="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center" style={{"backgroundColor": userColor}}>
            <span className="text-lg font-medium text-white">{initials}</span>
          </div>
          <span className="text-sm font-medium" style={{"color": userColor}}>{user.name}{isCurrent ? ' (You)' : ''}</span>
          <span className="block text-xs mt-1">Connecting...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative aspect-video bg-bg-tertiary border border-border-primary rounded-xl overflow-hidden group flex flex-col">
      <audio ref={audioRef} autoPlay playsInline muted={localMute || !!isDeafened} />
      <audio ref={screenAudioRef} autoPlay playsInline muted={localMute || !!isDeafened} />

      <div className="relative flex-1 overflow-hidden bg-black/50">
        {/* Audio visualization - waveform dots */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <AudioVisualizer level={user.audioLevel} className="h-6 w-24" type="dots" />
          {!isLocal && user.isSpeaking && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative">
                <div className="absolute inset-0 rounded-full border-2 animate-ping opacity-75" style={{borderColor: userColor, animationDuration: '1500ms'}} />
                <div className="absolute inset-0 rounded-full border-2 animate-ping opacity-50" style={{borderColor: userColor, animationDuration: '2000ms', animationDelay: '300ms'}} />
                <div className="absolute inset-0 rounded-full border-2 animate-ping opacity-30" style={{borderColor: userColor, animationDuration: '2500ms', animationDelay: '600ms'}} />
              </div>
            </div>
          )}
        </div>
        {(showScreenShare || !showCamera) ? (
          <div className="absolute inset-0 flex items-center justify-center" style={{"backgroundColor": getDesaturatedColor(userColor, 0.3)}}>
            {user.isSharing ? (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                  <MonitorUp size={26} className="text-accent-success animate-pulse" />
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-accent-success/60">You're sharing</span>
                    <span className="text-xs text-accent-success/60">your screen</span>
                  </div>
                </div>
                {!localVideoOff || screenAudioRef.current?.srcObject ? (
          <div className="flex items-center gap-2 text-xs text-accent-success/40">
            {!localVideoOff && (
              <>
                <Video size={14} className="text-accent-success" />
                <span>+(Camera)</span>
              </>
            )}
            {screenAudioRef.current?.srcObject && (
              <>
                <Mic size={14} className="text-accent-success" />
                <span>+(Audio)</span>
              </>
            )}
          </div>
        ) : null}
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

        {/* Deafen indicator for other users */}
        {!isLocal && user.isDeafened && (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-accent-error/90 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg">
            <EarOff size={10} />
            <span>Deafened</span>
          </div>
        )}

        {/* Muted locally indicator */}
        {!isLocal && localMute && (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-amber-500/90 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg">
            <MicOff size={10} />
            <span>Muted</span>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-bg-primary/80 to-transparent flex items-center gap-1.5 z-10">
        <div className="flex gap-1 mr-auto">
          {user.micOn ? <Mic size={12} className="text-accent-success" /> : <MicOff size={12} className="text-accent-error" />}
          {user.handRaised && <span className="text-accent-warning text-xs">✋</span>}
          {user.isSharing ? (
  <>
    <MonitorUp size={12} className="text-accent-success" />
    {!localVideoOff && <span className="xs ml-1">+Cam</span>}
    {screenAudioRef.current?.srcObject && <span className="xs ml-1">+Audio</span>}
  </>
) : null}
          {user.isDeafened && <EarOff size={12} className="text-accent-error" />}
          {localMute && <MicOff size={12} className="text-amber-500" />}
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
          className="fixed z-[9999] w-56 glass-strong rounded-xl p-3 shadow-2xl flex flex-col gap-2.5 "
          style={{ top: menuPos.top, left: menuPos.left }}
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

          </div>
  )
}
