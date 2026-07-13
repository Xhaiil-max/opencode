let audioCtx: AudioContext | null = null

function getCtx() {
  if (!audioCtx) audioCtx = new AudioContext()
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

function tone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  } catch {
    // Audio may be blocked until user gesture
  }
}

function chord(freqs: number[], duration: number, volume = 0.1) {
  freqs.forEach((f, i) => setTimeout(() => tone(f, duration, 'sine', volume), i * 40))
}

export const sounds = {
  join: () => chord([523, 659, 784], 0.25, 0.12),
  leave: () => chord([784, 659, 523], 0.3, 0.1),
  mute: () => tone(440, 0.08, 'square', 0.06),
  unmute: () => tone(660, 0.08, 'square', 0.06),
  handRaise: () => tone(880, 0.15, 'triangle', 0.1),
  handLower: () => tone(660, 0.1, 'triangle', 0.08),
  message: () => tone(740, 0.12, 'sine', 0.08),
  participantJoin: () => chord([440, 554, 659, 880], 0.35, 0.18),
  participantLeave: () => chord([880, 659, 554, 440], 0.3, 0.14),
  screenShareStart: () => chord([523, 659, 784, 1047], 0.4, 0.15),
  screenShareStop: () => chord([1047, 784, 659, 523], 0.35, 0.12),
  deafen: () => tone(220, 0.2, 'sine', 0.05),
  undeafen: () => tone(440, 0.2, 'sine', 0.08),
}
