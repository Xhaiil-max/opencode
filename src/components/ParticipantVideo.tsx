import { useRef, useEffect } from 'react'
import { type Participant, Track } from 'livekit-client'

interface ParticipantVideoProps {
  participant: Participant
  isLocal?: boolean
}

export default function ParticipantVideo({ participant, isLocal }: ParticipantVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const pub = participant.getTrackPublication(Track.Source.Camera)
    const sub = pub?.track
    if (sub && videoRef.current) {
      sub.attach(videoRef.current)
    }
    return () => {
      if (sub) sub.detach()
    }
  }, [participant])

  return (
    <video
      ref={videoRef}
      autoPlay
      muted={isLocal}
      playsInline
      className="absolute inset-0 w-full h-full object-cover"
    />
  )
}
