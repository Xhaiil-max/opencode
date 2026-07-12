import { useState, useEffect } from 'react'
import { Plus, LogIn, Shield, Sparkles, Zap, Users, MessageSquare, Palette, PenTool } from 'lucide-react'
import JoinModal from './JoinModal'
import CreateModal from './CreateModal'

interface LandingProps {
  onCreateMeeting: (name: string, meetingId: string, passcode: string) => void
  onJoinMeeting: (name: string, id: string, passcode: string) => void
  initialRoomId?: string | null
}

export default function Landing({ onCreateMeeting, onJoinMeeting, initialRoomId }: LandingProps) {
  const [showJoin, setShowJoin] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    if (initialRoomId) setShowJoin(true)
  }, [initialRoomId])

  const features = [
    { icon: Users, title: 'HD Video & Audio', desc: 'Crystal clear communication with adaptive bitrate' },
    { icon: MessageSquare, title: 'Live Chat & Reactions', desc: 'Rich messaging with emoji reactions and threads' },
    { icon: Palette, title: 'Custom Colors', desc: 'Personalize with solid colors or beautiful gradients' },
    { icon: PenTool, title: 'Collaborative Whiteboard', desc: 'Real-time drawing and brainstorming together' },
    { icon: Shield, title: 'End-to-End Encrypted', desc: 'Your meetings stay private and secure' },
    { icon: Zap, title: 'Lightning Fast', desc: 'Powered by LiveKit for ultra-low latency' },
  ]

  return (
    <div className="min-h-screen bg-gradient-mesh relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-brand-soft" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,var(--color-haze-500/0.08),transparent_60%)] pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-20">
        <div className="flex flex-col items-center text-center mb-16 animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-gradient-brand flex items-center justify-center mb-8 animate-float shadow-glow-lg">
            <Sparkles size={40} className="text-bg-primary" />
          </div>
          <h1 className="text-6xl font-display font-bold text-gradient-brand mb-4 tracking-tight">Hazecode</h1>
          <p className="text-lg text-text-secondary max-w-xl">Secure, high-performance video meetings with collaborative tools built for modern teams.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl w-full mb-16 animate-slide-up">
          {features.map((feature, i) => (
            <div key={feature.title} className="card glass-card-hover p-6 group" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="w-12 h-12 rounded-xl bg-gradient-brand-soft flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon size={24} className="text-haze-400" />
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-2">{feature.title}</h3>
              <p className="text-sm text-text-secondary">{feature.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-4 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" />
            Create Meeting
          </button>
          <button
            onClick={() => setShowJoin(true)}
            className="btn-secondary"
          >
            <LogIn size={20} />
            Join Meeting
          </button>
        </div>

        <div className="mt-16 flex items-center gap-8 text-sm text-text-muted animate-fade-in" style={{ animationDelay: '400ms' }}>
          <span className="flex items-center gap-1.5"><Shield size={14} className="text-haze-500" /> E2E Encrypted</span>
          <span className="flex items-center gap-1.5"><Zap size={14} className="text-haze-500" /> Sub-100ms Latency</span>
          <span className="flex items-center gap-1.5"><Users size={14} className="text-haze-500" /> Up to 100 Participants</span>
        </div>
      </div>

      {showJoin && (
        <JoinModal
          onClose={() => setShowJoin(false)}
          onConfirm={(name, id, passcode) => { setShowJoin(false); onJoinMeeting(name, id, passcode) }}
          initialMeetingId={initialRoomId ?? undefined}
        />
      )}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onConfirm={(name, id, passcode) => { setShowCreate(false); onCreateMeeting(name, id, passcode) }}
        />
      )}
    </div>
  )
}
