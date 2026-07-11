import { useState } from 'react'
import { Plus, LogIn, Shield } from 'lucide-react'
import JoinModal from './JoinModal'
import CreateModal from './CreateModal'

interface LandingProps {
  onCreateMeeting: (name: string, meetingId: string, passcode: string) => void
  onJoinMeeting: (name: string, id: string, passcode: string) => void
}

export default function Landing({ onCreateMeeting, onJoinMeeting }: LandingProps) {
  const [showJoin, setShowJoin] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <div className="flex flex-col items-center mb-16">
        <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mb-6">
          <Shield size={36} className="text-white" />
        </div>
        <h1 className="text-5xl font-semibold tracking-tight mb-2">Connect</h1>
        <p className="text-zinc-400 text-lg">Secure, high-performance meetings</p>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors font-medium"
        >
          <Plus size={20} />
          Create Meeting
        </button>
        <button
          onClick={() => setShowJoin(true)}
          className="flex items-center gap-2 px-8 py-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors font-medium"
        >
          <LogIn size={20} />
          Join Meeting
        </button>
      </div>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onConfirm={onCreateMeeting} />}
      {showJoin && <JoinModal onClose={() => setShowJoin(false)} onConfirm={(name, id, passcode) => onJoinMeeting(name, id, passcode)} />}
    </div>
  )
}
