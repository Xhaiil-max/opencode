import { useRef, useEffect } from 'react'
import { type Participant, Track } from 'livekit-client'

interface ParticipantVideoProps {
  participant: Participant
  isLocal?: boolean
  source?: Track.Source
}

export default function ParticipantVideo({
  participant,
  isLocal,
  source = Track.Source.Camera,
}: ParticipantVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const attachedTrackRef = useRef<Track | null>(null)

  useEffect(() => {
    const videoEl = videoRef.current
    if (!videoEl) return

    const attach = () => {
      const pub = participant.getTrackPublication(source)
      const track = pub?.track
      
      // Detach previous track if different
      if (attachedTrackRef.current && attachedTrackRef.current !== track) {
        attachedTrackRef.current.detach(videoEl)
      }
      
      if (track) {
        track.attach(videoEl)
        attachedTrackRef.current = track
      } else {
        videoEl.srcObject = null
        attachedTrackRef.current = null
      }
    }

    attach()

    const handleTrackSubscribed = () => attach()
    const handleTrackUnsubscribed = () => attach()
    const handleTrackPublished = () => attach()
    const handleTrackUnpublished = () => attach()

    participant.on('trackSubscribed', handleTrackSubscribed)
    participant.on('trackUnsubscribed', handleTrackUnsubscribed)
    participant.on('trackPublished', handleTrackPublished)
    participant.on('trackUnpublished', handleTrackUnpublished)

    return () => {
      participant.off('trackSubscribed', handleTrackSubscribed)
      participant.off('trackUnsubscribed', handleTrackUnsubscribed)
      participant.off('trackPublished', handleTrackPublished)
      participant.off('trackUnpublished', handleTrackUnpublished)
      if (attachedTrackRef.current) {
        attachedTrackRef.current.detach(videoEl)
        attachedTrackRef.current = null
      }
    }
  }, [participant, source])

  return (
    <video
      ref={videoRef}
      autoPlay
      muted={isLocal}
      playsInline
      className="absolute inset-0 w-full h-full object-contain bg-black"
    />
  )
}
