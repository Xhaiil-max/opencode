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

  useEffect(() => {
    const videoEl = videoRef.current
    if (!videoEl) return

    const attach = () => {
      const pub = participant.getTrackPublication(source)
      const track = pub?.track
      if (track) {
        track.attach(videoEl)
      } else {
        videoEl.srcObject = null
      }
    }

    attach()

    participant.on('trackSubscribed', attach)
    participant.on('trackUnsubscribed', attach)
    participant.on('trackPublished', attach)
    participant.on('trackUnpublished', attach)

    return () => {
      participant.off('trackSubscribed', attach)
      participant.off('trackUnsubscribed', attach)
      participant.off('trackPublished', attach)
      participant.off('trackUnpublished', attach)
      const pub = participant.getTrackPublication(source)
      pub?.track?.detach(videoEl)
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
