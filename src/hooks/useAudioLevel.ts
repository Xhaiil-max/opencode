import { useEffect, useState, useRef } from 'react'
import { Track, RoomEvent, type Room } from 'livekit-client'

export function useAudioLevel(stream: MediaStream | null, active = true) {
  const [level, setLevel] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!stream || !active) {
      setLevel(0)
      return
    }

    const ctx = new AudioContext()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    const source = ctx.createMediaStreamSource(stream)
    source.connect(analyser)
    const data = new Uint8Array(analyser.frequencyBinCount)

    const tick = () => {
      analyser.getByteFrequencyData(data)
      const avg = data.reduce((a, b) => a + b, 0) / data.length
      setLevel(Math.min(100, Math.round((avg / 255) * 100 * 1.8)))
      rafRef.current = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      cancelAnimationFrame(rafRef.current)
      source.disconnect()
      void ctx.close()
    }
  }, [stream, active])

  return level
}

export function useLocalMicStream(room: Room | null, micOn: boolean) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [, bump] = useState(0)

  useEffect(() => {
    if (!room) return
    const refresh = () => bump(n => n + 1)
    room.on(RoomEvent.LocalTrackPublished, refresh)
    room.on(RoomEvent.LocalTrackUnpublished, refresh)
    return () => {
      room.off(RoomEvent.LocalTrackPublished, refresh)
      room.off(RoomEvent.LocalTrackUnpublished, refresh)
    }
  }, [room])

  useEffect(() => {
    if (!room || !micOn) {
      setStream(null)
      return
    }
    const pub = room.localParticipant.getTrackPublication(Track.Source.Microphone)
    const mediaTrack = pub?.track?.mediaStreamTrack
    setStream(mediaTrack ? new MediaStream([mediaTrack]) : null)
  }, [room, micOn, room?.localParticipant.audioTrackPublications.size])

  return stream
}
