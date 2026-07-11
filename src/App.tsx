import { useState } from 'react'
import type { ViewState } from './types'
import Landing from './components/Landing'
import MeetingRoom from './components/MeetingRoom'

export default function App() {
  const [view, setView] = useState<ViewState>('landing')
  const [username, setUsername] = useState('You')
  const [roomName, setRoomName] = useState('')
  const handleCreate = (name: string, meetingId: string, _passcode: string) => {
    setUsername(name)
    setRoomName(meetingId)
    setView('meeting')
  }

  const handleJoin = (name: string, id: string, _passcode: string) => {
    setUsername(name)
    setRoomName(id)
    setView('meeting')
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {view === 'landing' ? (
        <Landing
          onCreateMeeting={handleCreate}
          onJoinMeeting={handleJoin}
        />
      ) : (
        <MeetingRoom
          username={username}
          roomName={roomName}
          onLeave={() => setView('landing')}
        />
      )}
    </div>
  )
}
