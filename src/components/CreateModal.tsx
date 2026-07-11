import { useState } from 'react'
import { X, Copy, Check } from 'lucide-react'

interface CreateModalProps {
  onClose: () => void
  onConfirm: (name: string) => void
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
    if (username) onConfirm(username)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-md mx-4 border border-zinc-800" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-medium">Create Meeting</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="mb-4 p-3 rounded-xl bg-zinc-800/60 border border-zinc-700">
          <label className="text-xs uppercase tracking-widest text-zinc-400 mb-2 block">Meeting ID</label>
          <div className="flex items-center gap-2">
            <code className="text-indigo-400 font-mono text-sm">{meetingId}</code>
            <button onClick={copyId} className="p-1 rounded-lg hover:bg-zinc-700 transition-colors">
              {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Username"
            className="px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 focus:border-indigo-500 outline-none transition-colors"
          />
          <input
            type="password"
            value={passcode}
            onChange={e => setPasscode(e.target.value)}
            placeholder="Custom Passcode (optional)"
            className="px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 focus:border-indigo-500 outline-none transition-min"
          />
          <button
            type="submit"
            className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors font-medium mt-2"
          >
            Create Meeting
          </button>
        </form>
      </div>
    </div>
  )
}
