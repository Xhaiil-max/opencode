import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { User } from '../types'
import { Mic, MicOff, MonitorUp, Volume2, VolumeX, Eye, EyeOff, MoreVertical, EarOff, VolumeX as MuteIcon, EarOff as DeafenIcon, VideoOff, Pin, X } from 'lucide-react'
import ParticipantVideo from './ParticipantVideo'
import { WaveformDots } from './AudioVisualizer'
import { Track, ConnectionState, type Participant } from 'livekit-client'
import { useRoom, useLocalIdentity } from '../context/LiveKitContext'
import { getDesaturatedColor } from '../utils/colors'

interface ParticipantTileProps {
  user: User
  isCurrent?: boolean
  isDeafened?: boolean
  participant?: Participant | null
  source?: Track.Source
  // Host controls
  isLocalHost?: boolean
  muteParticipant?: (identity: string) => void
  deafenParticipant?: (identity: string) => void
  disableVideo?: (identity: string) => void
  // Pin controls
  pinnedParticipantId?: string | null
  pinParticipant?: (identity: string) => void
  unpinParticipant?: (identity: string) => void
}

// Concentric circles that radiate out from the avatar/pfp, scaling with volume.
function RadiatingCircles({ isSpeaking, audioLevel, color }: { isSpeaking: boolean; audioLevel: number; color: string }) {
  if (!isSpeaking) return null
  const intensity = Math.min(1, Math.max(0, audioLevel / 100))
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {[0, 1, 2].map(i => {
        const size = 56 + i * 28 + intensity * 70
        const opacity = Math.max(0, (0.45 - i * 0.12) * (0.4 + intensity * 0.6))
        return (
          <div
            key={i}
            className="absolute rounded-full transition-all duration-100 ease-out"
            style={{
              width: size,
              height: size,
              border: `2px solid ${color}`,
              opacity,
            }}
          />
        )
      })}
    </div>
  )
}

export default function ParticipantTile({ user, isCurrent, isDeafened, participant: participantProp, source, isLocalHost, muteParticipant, deafenParticipant, disableVideo, pinnedParticipantId, pinParticipant, unpinParticipant }: ParticipantTileProps) {
  const room = useRoom()
  const localIdentity = useLocalIdentity()
  const isLocal = user.id === localIdentity

  const [showMenu, setShowMenu] = useState(false)
  const [localVolume, setLocalVolume] = useState(user.volume)
  const [localMute, setLocalMute] = useState(false)
  const [localVideoOff, setLocalVideoOff] = useState(user.localVideoDisabled)
  const [watchingSS, setWatchingSS] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const screenAudioRef = useRef<HTMLAudioElement | null>(null)
  const menuBtnRef = useRef<HTMLButtonElement | null>(null)

  // Use passed participant or look up from room
  const participant: Participant | null = participantProp ?? (room
    ? room.localParticipant.identity === user.id
      ? room.localParticipant
      : room.remoteParticipants.get(user.id) ?? null
    : null)

  const initials = user.name.split(' ').slice(0, 2).map(n => n[0]).join('')
  const userColor = user.color || '#6366f1'
  const showCamera = user.camOn && !localVideoOff
  const sourceToUse = source || Track.Source.Camera
  const isScreenShare = source === Track.Source.ScreenShare

  // Presenter initials for the screenshare "don't watch" view
  const presenterName = user.name.replace(/'s Screen$/, '')
  const ssInitials = presenterName.split(' ').slice(0, 2).map(n => n[0]).join('')

  const roomConnected = room?.state === ConnectionState.Connected

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

  // Auto-pin screen-share presenters when they start sharing and aren't pinned yet
  useEffect(() => {
    if (!isScreenShare || !participant || pinnedParticipantId === participant?.id || !pinParticipant) return
    // If this participant is currently presenting their screen and isn't pinned, pin them automatically
    pinParticipant?.(participant?.id)
  }, [isScreenShare, participant, pinnedParticipantId, pinParticipant])

  // Smooth, low-latency speaking glow that scales with audio level
        const glowStyle = user.isSpeaking
          ? {
              boxShadow: `0 0 0 2px ${userColor}, 0 0 ${6 + (user.audioLevel / 100) * 18}px ${2 + (user.audioLevel / 100) * 10}px ${userColor}80`,
            }
          : undefined

  const showMutedBadge = !user.micOn && !isLocal && !isScreenShare
  const showPresentingBadge = user.isSharing && !isScreenShare

  if (!isLocal && !isCurrent && !participant) {
    // Only show "Connecting..." when the room is genuinely not connected yet.
    // Otherwise just render the avatar calmly (no alarming random flicker).
    return (
      <div className="relative aspect-video flex items-center justify-center bg-bg-tertiary border border-border-primary rounded-xl">
        <div className="text-center p-4">
          <div className="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: userColor }}>
            <span className="text-lg font-medium text-white">{initials}</span>
          </div>
          <span className="text-sm font-medium" style={{ color: userColor }}>{user.name}{isCurrent ? ' (You)' : ''}</span>
          {!roomConnected && <span className="block text-xs mt-1 text-text-muted">Connecting...</span>}
        </div>
      </div>
    )
  }

  return (
    <div
      className="relative aspect-video bg-bg-tertiary border border-border-primary rounded-xl overflow-hidden group flex flex-col transition-[box-shadow] duration-100"
      style={glowStyle}
    >
      <audio ref={audioRef} autoPlay playsInline muted={localMute || !!isDeafened} />
      <audio ref={screenAudioRef} autoPlay playsInline muted={localMute || !!isDeafened} />

      <div className="relative flex-1 overflow-hidden bg-black/50">
        {isScreenShare ? (
          watchingSS && participant ? (
            <ParticipantVideo participant={participant} isLocal={isLocal} source={Track.Source.ScreenShare} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: getDesaturatedColor(userColor, 0.3) }}>
              {user.isSpeaking && <RadiatingCircles isSpeaking={user.isSpeaking} audioLevel={user.audioLevel} color={userColor} />}
              <div className="relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: userColor }}>
                <span className="text-xl font-medium text-white">{ssInitials}</span>
              </div>
            </div>
          )
        ) : showCamera && participant ? (
          <ParticipantVideo participant={participant} isLocal={isLocal} source={sourceToUse} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: getDesaturatedColor(userColor, 0.3) }}>
            {user.isSpeaking && <RadiatingCircles isSpeaking={user.isSpeaking} audioLevel={user.audioLevel} color={userColor} />}
            {user.isSharing ? (
              <div className="flex flex-col items-center gap-2">
                <MonitorUp size={26} className="text-accent-success" />
                <span className="text-xs text-accent-success/70">Sharing screen</span>
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: userColor }}>
                <span className="text-lg font-medium text-white">{initials}</span>
              </div>
            )}
          </div>
        )}

        {/* Top-left: pin (on hover) + status badges */}
        <div className="absolute top-2 left-2 z-20 flex flex-col items-start gap-1">
          <button
            onClick={() => pinnedParticipantId === user.id ? unpinParticipant?.(user.id) : pinParticipant?.(user.id)}
            title={pinnedParticipantId === user.id ? 'Unpin' : 'Pin'}
            className={`btn-ghost btn-icon-sm opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity ${pinnedParticipantId === user.id ? 'text-accent-warning' : ''}`}
          >
            <Pin size={14} />
          </button>

          {showMutedBadge && (
            <div className="flex items-center gap-1 bg-accent-error/90 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg">
              <MicOff size={10} />
              <span>Muted</span>
            </div>
          )}
          {user.isDeafened && (
            <div className="flex items-center gap-1 bg-accent-error/90 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg">
              <EarOff size={10} />
              <span>Deafened</span>
            </div>
          )}
          {!isLocal && localMute && (
            <div className="flex items-center gap-1 bg-amber-500/90 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg">
              <MicOff size={10} />
              <span>Muted</span>
            </div>
          )}
          {showPresentingBadge && (
            <div className="flex items-center gap-1 bg-accent-success/90 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg">
              <MonitorUp size={10} />
              <span>Presenting</span>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-bg-primary/80 to-transparent flex items-center gap-1.5 z-10">
        <div className="flex gap-1 mr-auto">
          {/* Audio waveform dots — colored with the user's color */}
          {(user.audioLevel > 5 || user.isSpeaking) && (user.micOn || isScreenShare) && (
            <WaveformDots level={user.audioLevel} isSpeaking={user.isSpeaking} color={userColor} className="items-center" />
          )}
          {user.micOn ? <Mic size={12} className="text-accent-success" /> : <MicOff size={12} className="text-accent-error" />}
          {user.handRaised && <span className="text-accent-warning text-xs">✋</span>}
          {user.isSharing ? (
            <>
              <MonitorUp size={12} className="text-accent-success" />
              {!localVideoOff && <span className="text-xs ml-1 text-accent-success/70">+Cam</span>}
              {screenAudioRef.current?.srcObject && <span className="text-xs ml-1 text-accent-success/70">+Audio</span>}
            </>
          ) : null}
          {user.isDeafened && <EarOff size={12} className="text-accent-error" />}
          {localMute && <MicOff size={12} className="text-amber-500" />}
        </div>
        <span className="text-xs font-medium truncate" style={{ color: userColor }}>{user.name}{isCurrent ? ' (You)' : ''}</span>
      </div>

      {!isLocal && (
        <div className="absolute top-2 right-2 z-20">
          <button
            ref={menuBtnRef}
            onClick={() => setShowMenu(!showMenu)}
            className="btn-ghost btn-icon-sm"
          >
            <MoreVertical size={14} />
          </button>
        </div>
      )}

      {!isLocal && showMenu && createPortal(
        (() => {
          if (!menuBtnRef.current) return null
          const rect = menuBtnRef.current.getBoundingClientRect()

          // Safety check: if rect is invalid, don't render menu
          if (rect.width === 0 || rect.height === 0) return null

          const margin = 8
          const menuWidth = 224
          // Base height + extra for host controls
          const baseMenuHeight = 140
          const hostControlsHeight = isLocalHost && !isLocal ? 140 : 0
          const menuHeight = baseMenuHeight + hostControlsHeight

          let left = rect.left
          let top = rect.bottom + margin

          // Prefer opening below; flip above only if it fits within the viewport.
          if (top + menuHeight > window.innerHeight - margin) {
            const above = rect.top - menuHeight - margin
            if (above >= margin) {
              top = above
            }
          }

          // Clamp so the whole menu (incl. flipping) stays inside the viewport.
          if (top + menuHeight > window.innerHeight - margin) {
            top = window.innerHeight - menuHeight - margin
          }
          if (top < margin) {
            top = margin
          }
          if (left + menuWidth > window.innerWidth - margin) {
            left = window.innerWidth - menuWidth - margin
          }
          if (left < margin) {
            left = margin
          }

          return (
            <div
              className="fixed z-[9999] w-56 glass-strong rounded-xl p-3 shadow-2xl flex flex-col gap-2.5"
              style={{ top, left, maxHeight: '80vh', overflowY: 'auto' }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-text-muted">Options</span>
                <button onClick={() => setShowMenu(false)} className="p-1 rounded hover:bg-bg-tertiary transition-colors text-text-secondary hover:text-text-primary" title="Close menu">
                  <X size={14} />
                </button>
              </div>
              {isScreenShare && (
                <button onClick={() => { setWatchingSS(!watchingSS); setShowMenu(false); }} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg hover:bg-bg-tertiary transition-colors cursor-pointer">
                  {watchingSS ? <EyeOff size={14} className="text-accent-warning" /> : <Eye size={14} />} {watchingSS ? "Don't watch" : 'Watch'}
                </button>
              )}
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
              <button onClick={() => { setLocalMute(!localMute); setShowMenu(false); }} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg hover:bg-bg-tertiary transition-colors cursor-pointer">
                {localMute ? <VolumeX size={14} className="text-accent-error" /> : <Volume2 size={14} />} {localMute ? 'Unmute' : 'Mute'}
              </button>
              <button onClick={() => { setLocalVideoOff(!localVideoOff); setShowMenu(false); }} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg hover:bg-bg-tertiary transition-colors cursor-pointer">
                {localVideoOff ? <Eye size={14} /> : <EyeOff size={14} className="text-accent-error" />} {localVideoOff ? 'Show Video' : 'Hide Video (Local)'}
              </button>
              {isLocalHost && !isLocal && (
                <>
                  <div className="border-t border-border-primary my-1" />
                  <div className="text-xs text-text-muted px-1 mb-1">Host Controls</div>
                  <button onClick={() => { muteParticipant?.(user.id); setShowMenu(false); }} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg hover:bg-bg-tertiary transition-colors cursor-pointer">
                    <MuteIcon size={14} className="text-accent-warning" /> Mute Participant
                  </button>
                  <button onClick={() => { deafenParticipant?.(user.id); setShowMenu(false); }} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg hover:bg-bg-tertiary transition-colors cursor-pointer">
                    <DeafenIcon size={14} className="text-accent-warning" /> Deafen Participant
                  </button>
                  <button onClick={() => { disableVideo?.(user.id); setShowMenu(false); }} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg hover:bg-bg-tertiary transition-colors cursor-pointer">
                    <VideoOff size={14} className="text-accent-warning" /> Turn Off Camera
                  </button>
                </>
              )}
              {!isLocal && (
                <>
                  <div className="border-t border-border-primary my-1" />
                  <div className="text-xs text-text-muted px-1 mb-1">View</div>
                  {pinnedParticipantId === user.id ? (
                    <button onClick={() => { unpinParticipant?.(user.id); setShowMenu(false); }} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg hover:bg-bg-tertiary transition-colors cursor-pointer">
                      <Pin size={14} className="text-accent-warning" /> Unpin
                    </button>
                  ) : (
                    <button onClick={() => { pinParticipant?.(user.id); setShowMenu(false); }} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg hover:bg-bg-tertiary transition-colors cursor-pointer">
                      <Pin size={14} className="text-haze-500" /> Pin
                    </button>
                  )}
                </>
              )}
            </div>
          )
        })(),
        document.body
      )}

    </div>
  )
}
