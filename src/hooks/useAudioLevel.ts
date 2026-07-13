import { useEffect, useState, useRef } from 'react'
import { Track, RoomEvent, type Room } from 'livekit-client'

export function useAudioLevel(stream: MediaStream | null, active = true) {
  const [level, setLevel] = useState(0)
  const rafRef = useRef<number>(0)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    if (!stream || !active) {
      setLevel(0)
      return
    }

    // Reuse AudioContext to avoid creating too many
    let ctx = ctxRef.current
    if (!ctx || ctx.state === 'closed') {
      ctx = new AudioContext()
      ctxRef.current = ctx
    }

    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.3 // Smoother visualization
    analyserRef.current = analyser
    
    const source = ctx.createMediaStreamSource(stream)
    source.connect(analyser)
    const data = new Uint8Array(analyser.frequencyBinCount)

    const tick = () => {
      if (!analyserRef.current) return
      analyser.getByteFrequencyData(data)
      // Calculate RMS for more accurate level
      let sum = 0
      for (let i = 0; i < data.length; i++) {
        sum += data[i] * data[i]
      }
      const rms = Math.sqrt(sum / data.length)
      // Map 0-255 to 0-100 with better curve
      const normalized = Math.min(100, Math.round((rms / 128) * 100))
      setLevel(normalized)
      rafRef.current = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      cancelAnimationFrame(rafRef.current)
      source.disconnect()
      // Don't close context - reuse it
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
