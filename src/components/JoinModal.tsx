import { useState } from 'react'
import { X } from 'lucide-react'

interface JoinModalProps {
  onClose: () => void
  onConfirm: (name: string, meetingId: string, passcode: string) => void
  initialMeetingId?: string
}

export default function JoinModal({ onClose, onConfirm, initialMeetingId }: JoinModalProps) {
  const [username, setUsername] = useState('')
  const [meetingId, setMeetingId] = useState(initialMeetingId ?? '')
  const [passcode, setPasscode] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (username.trim() && meetingId.trim()) onConfirm(username.trim(), meetingId.trim(), passcode)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="glass-card w-full max-w-md mx-4 p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-medium">Join Meeting</h2>
          <button onClick={onClose} className="btn-ghost btn-icon-sm" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Username"
            required
            className="input"
            autoFocus
          />
          <input
            value={meetingId}
            onChange={e => setMeetingId(e.target.value)}
            placeholder="Meeting ID or Link"
            required
            className="input"
          />
          <input
            type="password"
            value={passcode}
            onChange={e => setPasscode(e.target.value)}
            placeholder="Passcode (optional)"
            className="input"
          />
          <button
            type="submit"
            className="btn-primary mt-2"
          >
            Join
          </button>
        </form>
      </div>
    </div>
  )
}
