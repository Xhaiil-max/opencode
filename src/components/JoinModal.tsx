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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-md mx-4 border border-zinc-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-medium">Join Meeting</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-800 transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Username"
            required
            className="px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 focus:border-indigo-500 outline-none transition-colors"
          />
          <input
            value={meetingId}
            onChange={e => setMeetingId(e.target.value)}
            placeholder="Meeting ID or Link"
            required
            className="px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 focus:border-indigo-500 outline-none transition-colors"
          />
          <input
            type="password"
            value={passcode}
            onChange={e => setPasscode(e.target.value)}
            placeholder="Passcode (optional)"
            className="px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 focus:border-indigo-500 outline-none transition-colors"
          />
          <button
            type="submit"
            className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors font-medium mt-2"
          >
            Join
          </button>
        </form>
      </div>
    </div>
  )
}
