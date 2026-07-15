import { useState } from 'react'
import { X, Copy, Check } from 'lucide-react'

interface CreateModalProps {
  onClose: () => void
  onConfirm: (name: string, meetingId: string, passcode: string) => void
}

const generateMeetingId = () => {
  const seg = () => Math.random().toString(36).substring(2, 6)
  return `${seg()}-${seg()}-${seg()}`
}

export default function CreateModal({ onClose, onConfirm }: CreateModalProps) {
  const [username, setUsername] = useState('')
  const [passcode, setPasscode] = useState('')
  const [meetingId] = useState(generateMeetingId)
  const [copied, setCopied] = useState(false)

  const copyId = () => {
    navigator.clipboard.writeText(meetingId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (username) onConfirm(username, meetingId, passcode)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="glass-card w-full max-w-md mx-4 p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-medium">Create Meeting</h2>
          <button onClick={onClose} className="btn-ghost btn-icon-sm" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="mb-4 p-3 rounded-xl bg-bg-tertiary border border-border-primary">
          <label className="text-xs uppercase tracking-widest text-text-muted mb-2 block">Meeting ID</label>
          <div className="flex items-center gap-2">
            <code className="text-haze-400 font-mono text-sm">{meetingId}</code>
            <button onClick={copyId} className="btn-ghost btn-icon-sm" aria-label="Copy meeting ID">
              {copied ? <Check size={16} className="text-accent-success" /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Username"
            className="input"
            autoFocus
          />
          <input
            type="password"
            value={passcode}
            onChange={e => setPasscode(e.target.value)}
            placeholder="Custom Passcode (optional)"
            className="input"
          />
          <button
            type="submit"
            className="btn-primary mt-2"
          >
            Create Meeting
          </button>
        </form>
      </div>
    </div>
  )
}
