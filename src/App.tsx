import { useState } from 'react'
import type { ViewState } from './types'
import Landing from './components/Landing'
import MeetingRoom from './components/MeetingRoom'

export default function App() {
  const [view, setView] = useState<ViewState>('landing')
  const [username, setUsername] = useState('You')

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {view === 'landing' ? (
        <Landing
          onCreateMeeting={(name) => { setUsername(name); setView('meeting') }}
          onJoinMeeting={(name) => { setUsername(name); setView('meeting') }}
        />
      ) : (
        <MeetingRoom
          username={username}
          onLeave={() => setView('landing')}
        />
      )}
    </div>
  )
}
