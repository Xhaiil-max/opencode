import { useState, useEffect } from 'react'
import type { SelfViewMode, GridPreset } from '../types'
import ControlBar from './ControlBar'
import ParticipantTile from './ParticipantTile'
import SelfView from './SelfView'
import Sidebar from './Sidebar'
import ScreenshareModal from './ScreenshareModal'
import SettingsPanel from './SettingsPanel'
import PiPView from './PiPView'
import HostControlRow from './HostControlRow'
import { useLiveKit } from '../hooks/useLiveKit'

interface MeetingRoomProps {
  username: string
  roomName: string
  onLeave: () => void
}

export default function MeetingRoom({ username, roomName, onLeave }: MeetingRoomProps) {
  const lk = useLiveKit({ username, roomName })

  const [selfViewMode, setSelfViewMode] = useState<SelfViewMode>('grid')
  const [gridPreset, setGridPreset] = useState<GridPreset>('tiled')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarTab, setSidebarTab] = useState<'participants' | 'chat'>('participants')
  const [showSettings, setShowSettings] = useState(false)
  const [showScreenshare, setShowScreenshare] = useState(false)
  const [showPip, setShowPip] = useState(false)
  const [showHostControls, setShowHostControls] = useState(false)
  const [isHost] = useState(true)

  useEffect(() => { lk.connect(); return () => lk.disconnect() }, [])

  const handleLeave = () => { lk.disconnect(); onLeave() }

  const sortedUsers = [...lk.users].sort((a, b) => {
    if (a.handRaised && !b.handRaised) return -1
    if (!a.handRaised && b.handRaised) return 1
    return 0
  })

  const hostMuteAll = () => { lk.room.current?.remoteParticipants.forEach((p: any) => { p.setMicrophoneEnabled(false) }) }
  const hostHideAllCams = () => { lk.room.current?.remoteParticipants.forEach((p: any) => { p.setCameraEnabled(false) }) }

  if (lk.connectionState === 'disconnected' && !lk.error) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Connecting to meeting...</p>
        </div>
      </div>
    )
  }

  if (lk.error) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-center">
          <p className="text-red-400 mb-2">Failed to connect: {lk.error}</p>
          <button onClick={handleLeave} className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm">Go Back</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      <div className="flex-1 flex flex-col relative">
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-950/95 border-b border-zinc-800/50 shrink-0">
          <span className="text-sm text-zinc-400">Meeting: <code className="text-zinc-200 font-mono">{roomName}</code></span>
          <div className="flex items-center gap-2">
            {isHost && (
              <button onClick={() => setShowHostControls(!showHostControls)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-xs font-medium">
                Host Controls
              </button>
            )}
            <span className="text-xs text-zinc-500">{lk.connectionState}</span>
          </div>
        </div>

        {showHostControls && isHost && (
          <div className="absolute top-10 right-4 z-30 bg-zinc-900 border border-zinc-700 rounded-xl p-4 w-72 shadow-2xl">
            <h3 className="text-sm font-medium mb-3">Host Controls</h3>
            <div className="flex flex-col gap-2">
              <HostControlRow label="Disable Chat" />
              <HostControlRow label="Mute Everyone" onClick={hostMuteAll} />
              <HostControlRow label="Disable Cameras" onClick={hostHideAllCams} />
              <HostControlRow label="Chat Slowdown (5s)" />
            </div>
          </div>
        )}

        <div className="flex-1 p-4 overflow-auto">
          {showPip ? (
            <PiPView
              users={sortedUsers}
              isMicOn={lk.isMicOn}
              isCamOn={lk.isCamOn}
              onMicToggle={lk.toggleMic}
              onClosePip={() => setShowPip(false)}
              onEndCall={handleLeave}
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
                      <ParticipantTile key={u.id} user={u} isCurrent={u.id === username} />
                    ))}
                    {selfViewMode === 'grid' && <SelfView username={username} camOn={lk.isCamOn} />}
                  </div>
                </>
              ) : gridPreset === 'sidebar' ? (
                <>
                  <div className="grid grid-cols-2 gap-2 content-start">
                    {sortedUsers.map(u => <ParticipantTile key={u.id} user={u} isCurrent={u.id === username} />)}
                    {selfViewMode === 'grid' && <SelfView username={username} camOn={lk.isCamOn} />}
                  </div>
                  <SelfView username={username} camOn={lk.isCamOn} large />
                </>
              ) : (
                <>
                  {sortedUsers.map(u => <ParticipantTile key={u.id} user={u} isCurrent={u.id === username} />)}
                  {selfViewMode === 'grid' && <SelfView username={username} camOn={lk.isCamOn} />}
                </>
              )}
            </div>
          )}
        </div>

        {selfViewMode === 'floating' && !showPip && (
          <SelfView username={username} camOn={lk.isCamOn} floating />
        )}

        <ControlBar
          isMicOn={lk.isMicOn}
          isCamOn={lk.isCamOn}
          isSharing={false}
          isRaisedHand={lk.isRaisedHand}
          isDeafened={lk.isDeafened}
          onMicToggle={lk.toggleMic}
          onCamToggle={lk.toggleCam}
          onScreenshare={() => {
            lk.room.current?.localParticipant.setMicrophoneEnabled(false)
            setShowScreenshare(true)
          }}
          onHandRaise={() => lk.setIsRaisedHand(!lk.isRaisedHand)}
          onDeafen={() => lk.setIsDeafened(!lk.isDeafened)}
          onFullscreen={() => {}}
          onSettings={() => setShowSettings(true)}
          onEndCall={handleLeave}
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
          onMute={() => {}}
          onToggleCam={() => {}}
        />
      )}

      {showScreenshare && (
        <ScreenshareModal
          onClose={() => setShowScreenshare(false)}
          onStartScreenShare={lk.startScreenShare}
        />
      )}

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
