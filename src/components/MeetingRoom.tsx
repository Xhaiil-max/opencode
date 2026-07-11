import { useState } from 'react'
import type { User, SelfViewMode, GridPreset } from '../types'
import { MOCK_USERS } from '../mockData'
import ControlBar from './ControlBar'
import ParticipantTile from './ParticipantTile'
import SelfView from './SelfView'
import Sidebar from './Sidebar'
import ScreenshareModal from './ScreenshareModal'
import SettingsPanel from './SettingsPanel'
import PiPView from './PiPView'
import HostControlRow from './HostControlRow'

interface MeetingRoomProps {
  username: string
  onLeave: () => void
}

export default function MeetingRoom({ username, onLeave }: MeetingRoomProps) {
  const [users, setUsers] = useState<User[]>(MOCK_USERS)
  const [selfViewMode, setSelfViewMode] = useState<SelfViewMode>('grid')
  const [gridPreset, setGridPreset] = useState<GridPreset>('tiled')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarTab, setSidebarTab] = useState<'participants' | 'chat'>('participants')
  const [showSettings, setShowSettings] = useState(false)
  const [showScreenshare, setShowScreenshare] = useState(false)
  const [showPip, setShowPip] = useState(false)
  const [isHost] = useState(true)
  const [showHostControls, setShowHostControls] = useState(false)
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCamOn, setIsCamOn] = useState(true)
  const [isDeafened, setIsDeafened] = useState(false)
  const [isRaisedHand, setIsRaisedHand] = useState(false)

  const sortedUsers = [...users].sort((a, b) => {
    if (a.handRaised && !b.handRaised) return -1
    if (!a.handRaised && b.handRaised) return 1
    return 0
  })

  const handleMute = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, micOn: false } : u))
  }
  const toggleUserCam = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, camOn: !u.camOn } : u))
  }
  const toggleHandRaised = () => setIsRaisedHand(!isRaisedHand)

  const hostMuteAll = () => setUsers(prev => prev.map(u => u.isHost ? u : { ...u, micOn: false }))
  const hostHideAllCams = () => setUsers(prev => prev.map(u => u.isHost ? u : { ...u, camOn: false }))
  const hostBlockAllScreenshares = () => setUsers(prev => prev.map(u => u.isHost ? u : { ...u, localScreenshareDisabled: true }))

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      <div className="flex-1 flex flex-col relative">
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-950/95 border-b border-zinc-800/50 shrink-0">
          <span className="text-sm text-zinc-400">Meeting: <code className="text-zinc-200 font-mono">abc-def-ghi</code></span>
          <div className="flex items-center gap-2">
            {isHost && (
              <button onClick={() => setShowHostControls(!showHostControls)} className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-xs font-medium">
                Host Controls
              </button>
            )}
            <span className="text-xs text-zinc-500">00:12:34</span>
          </div>
        </div>

        {showHostControls && isHost && (
          <div className="absolute top-10 right-4 z-30 bg-zinc-900 border border-zinc-700 rounded-xl p-4 w-72 shadow-2xl">
            <h3 className="text-sm font-medium mb-3">Host Controls</h3>
            <div className="flex flex-col gap-2">
              <HostControlRow label="Disable Chat" />
              <HostControlRow label="Mute Everyone" defaultChecked onClick={hostMuteAll} />
              <HostControlRow label="Disable Screenshares" defaultChecked onClick={hostBlockAllScreenshares} />
              <HostControlRow label="Disable Cameras" defaultChecked onClick={hostHideAllCams} />
              <HostControlRow label="Screen Audio" />
              <HostControlRow label="Chat Slowdown (5s)" />
            </div>
          </div>
        )}

        <div className="flex-1 p-4 overflow-auto">
          {showPip ? (
            <PiPView
              users={sortedUsers}
              isMicOn={isMicOn}
              isCamOn={isCamOn}
              isDeafened={isDeafened}
              onMicToggle={() => setIsMicOn(!isMicOn)}
              onCamToggle={() => setIsCamOn(!isCamOn)}
              onClosePip={() => setShowPip(false)}
              onEndCall={onLeave}
            />
          ) : (
            <div className="w-full grid gap-2 h-full"
              style={{
                gridTemplateColumns:
                  gridPreset === 'tiled' || !gridPreset
                    ? 'repeat(auto-fill, minmax(240px, 1fr))'
                    : gridPreset === 'spotlight'
                    ? '2.2fr 1.2fr'
                    : gridPreset === 'speaker'
                    ? '2.2fr 1.2fr'
                    : '1.6fr 1.2fr'
              }}
            >
              {gridPreset === 'spotlight' || gridPreset === 'speaker' ? (
                <>
                  <ParticipantTile user={sortedUsers[0]} isCurrent={true} />
                  <div className="flex flex-col gap-2 overflow-y-auto content-start">
                    {sortedUsers.slice(1).map(u => (
                      <ParticipantTile key={u.id} user={u} isCurrent={u.id === '1'} />
                    ))}
                    {selfViewMode === 'grid' && <SelfView username={username} camOn={isCamOn} />}
                  </div>
                </>
              ) : gridPreset === 'sidebar' ? (
                <>
                  <div className="grid grid-cols-2 gap-2 content-start">
                    {sortedUsers.map(u => <ParticipantTile key={u.id} user={u} isCurrent={u.id === '1'} />)}
                    {selfViewMode === 'grid' && <SelfView username={username} camOn={isCamOn} />}
                  </div>
                  <SelfView username={username} camOn={isCamOn} large />
                </>
              ) : (
                <>
                  {sortedUsers.map(u => <ParticipantTile key={u.id} user={u} isCurrent={u.id === '1'} />)}
                  {selfViewMode === 'grid' && <SelfView username={username} camOn={isCamOn} />}
                </>
              )}
            </div>
          )}
        </div>

        {selfViewMode === 'floating' && !showPip && (
          <SelfView username={username} camOn={isCamOn} floating />
        )}

        <ControlBar
          isMicOn={isMicOn}
          isCamOn={isCamOn}
          isSharing={false}
          isRaisedHand={isRaisedHand}
          isDeafened={false}
          onMicToggle={() => setIsMicOn(!isMicOn)}
          onCamToggle={() => setIsCamOn(!isCamOn)}
          onScreenshare={() => setShowScreenshare(true)}
          onHandRaise={toggleHandRaised}
          onDeafen={() => setIsDeafened(!isDeafened)}
          onFullscreen={() => {}}
          onSettings={() => setShowSettings(true)}
          onEndCall={onLeave}
          onTogglePip={() => setShowPip(!showPip)}
          selfViewMode={selfViewMode}
          onSelfViewModeToggle={() => setSelfViewMode(v => v === 'floating' ? 'grid' : 'floating')}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
      </div>

      {sidebarOpen && (
        <Sidebar
          users={sortedUsers}
          tab={sidebarTab}
          onTabChange={setSidebarTab}
          isHost={isHost}
          onMute={handleMute}
          onToggleCam={toggleUserCam}
        />
      )}

      {showScreenshare && <ScreenshareModal onClose={() => setShowScreenshare(false)} />}

      {showSettings && (
        <SettingsPanel
          onClose={() => setShowSettings(false)}
          gridPreset={gridPreset}
          onGridPresetChange={setGridPreset}
        />
      )}
    </div>
  )
}
