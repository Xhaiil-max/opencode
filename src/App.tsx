import { useState } from 'react'
import type { ViewState } from './types'
import Landing from './components/Landing'
import MeetingRoom from './components/MeetingRoom'
import { getRoomFromUrl } from './utils/meetingLink'

export default function App() {
  const [view, setView] = useState<ViewState>('landing')
  const [username, setUsername] = useState('You')
  const [roomName, setRoomName] = useState('')
  const [isHost, setIsHost] = useState(false)
  const [initialRoomId] = useState(() => getRoomFromUrl())

  const handleCreate = (name: string, meetingId: string, _passcode: string) => {
    setUsername(name)
    setRoomName(meetingId)
    setIsHost(true)
    setView('meeting')
  }

  const handleJoin = (name: string, id: string, _passcode: string) => {
    setUsername(name)
    setRoomName(id)
    setIsHost(false)
    setView('meeting')
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {view === 'landing' ? (
        <Landing
          onCreateMeeting={handleCreate}
          onJoinMeeting={handleJoin}
          initialRoomId={initialRoomId}
        />
      ) : (
        <MeetingRoom
          username={username}
          roomName={roomName}
          isHost={isHost}
          onLeave={() => {
            setView('landing')
            setIsHost(false)
            window.history.replaceState({}, '', window.location.pathname)
          }}
        />
      )}
    </div>
  )
}
