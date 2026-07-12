import { useState, useEffect } from 'react'
import type { SelfViewMode, GridPreset } from '../types'
import ControlBar from './ControlBar'
import ParticipantTile from './ParticipantTile'
import SelfView from './SelfView'
import Sidebar from './Sidebar'
import ScreenshareModal from './ScreenshareModal'
import SettingsPanel from './SettingsPanel'
import HostControlRow from './HostControlRow'
import { useLiveKit } from '../hooks/useLiveKit'
import { LiveKitRoomContext, LocalIdentityContext } from '../context/LiveKitContext'

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
  const [showHostControls, setShowHostControls] = useState(false)
  const [isHost] = useState(true)

  useEffect(() => {
    const init = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        await lk.connect(true, true)
      } catch (err) {
        console.error('Failed to get media permissions:', err)
        await lk.connect(false, false)
      }
    }
    init()
    return () => lk.disconnect()
  }, [])

  const handleLeave = () => { lk.disconnect(); onLeave() }

  const remoteUsers = lk.users.filter(u => u.id !== username)

  const sortedRemote = [...remoteUsers].sort((a, b) => {
    if (a.handRaised && !b.handRaised) return -1
    if (!a.handRaised && b.handRaised) return 1
    return 0
  })

  const spotlightUser = sortedRemote.find(u => u.isSharing) || sortedRemote.find(u => u.isSpeaking) || sortedRemote[0]

  const handleHostSettingChange = (key: keyof typeof lk.hostSettings, value: boolean) => {
    const next = { ...lk.hostSettings, [key]: value }
    lk.updateHostSettings(next)
    if (key === 'muteEveryone' && value) lk.broadcastHostAction('muteAll')
    if (key === 'disableCameras' && value) lk.broadcastHostAction('disableCameras')
  }

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

  const renderGrid = () => {
    if (gridPreset === 'spotlight' || gridPreset === 'speaker') {
      return (
        <>
          {spotlightUser ? (
            <ParticipantTile user={spotlightUser} isDeafened={lk.isDeafened} />
          ) : (
            <div className="rounded-xl bg-zinc-800/50 flex items-center justify-center text-zinc-500 text-sm">
              Waiting for others to join...
            </div>
          )}
          <div className="flex flex-col gap-2 overflow-y-auto content-start">
            {sortedRemote.filter(u => u.id !== spotlightUser?.id).map(u => (
              <ParticipantTile key={u.id} user={u} isDeafened={lk.isDeafened} />
            ))}
            {selfViewMode === 'grid' && (
              <SelfView username={username} camOn={lk.isCamOn} isSharing={lk.isSharing} />
            )}
          </div>
        </>
      )
    }

    if (gridPreset === 'sidebar') {
      return (
        <>
          <div className="grid grid-cols-2 gap-2 content-start">
            {sortedRemote.map(u => <ParticipantTile key={u.id} user={u} isDeafened={lk.isDeafened} />)}
            {selfViewMode === 'grid' && (
              <SelfView username={username} camOn={lk.isCamOn} isSharing={lk.isSharing} />
            )}
          </div>
          {spotlightUser ? (
            <ParticipantTile user={spotlightUser} isDeafened={lk.isDeafened} />
          ) : selfViewMode === 'grid' ? null : (
            <SelfView username={username} camOn={lk.isCamOn} isSharing={lk.isSharing} />
          )}
        </>
      )
    }

    return (
      <>
        {sortedRemote.map(u => <ParticipantTile key={u.id} user={u} isDeafened={lk.isDeafened} />)}
        {selfViewMode === 'grid' && (
          <SelfView username={username} camOn={lk.isCamOn} isSharing={lk.isSharing} />
        )}
      </>
    )
  }

  return (
    <LiveKitRoomContext.Provider value={lk.room}>
      <LocalIdentityContext.Provider value={username}>
        <div className="flex h-screen bg-zinc-950 overflow-hidden">
          <div className="flex-1 flex flex-col relative">
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-950/95 border-b border-zinc-800/50 shrink-0">
              <span className="text-sm text-zinc-400">
                Meeting: <code className="text-zinc-200 font-mono">{roomName}</code>
              </span>
              <div className="flex items-center gap-2">
                {isHost && (
                  <button
                    onClick={() => setShowHostControls(!showHostControls)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-xs font-medium"
                  >
                    Host Controls
                  </button>
                )}
                <span className={`text-xs ${lk.connectionState === 'connected' ? 'text-green-400' : 'text-zinc-500'}`}>
                  {lk.connectionState}
                </span>
              </div>
            </div>

            {showHostControls && isHost && (
              <div className="absolute top-10 right-4 z-30 bg-zinc-900 border border-zinc-700 rounded-xl p-4 w-72 shadow-2xl">
                <h3 className="text-sm font-medium mb-3">Host Controls</h3>
                <div className="flex flex-col gap-2">
                  <HostControlRow
                    label="Disable Chat"
                    checked={lk.hostSettings.disableChat}
                    onChange={v => handleHostSettingChange('disableChat', v)}
                  />
                  <HostControlRow
                    label="Mute Everyone"
                    checked={lk.hostSettings.muteEveryone}
                    onChange={v => handleHostSettingChange('muteEveryone', v)}
                  />
                  <HostControlRow
                    label="Disable Cameras"
                    checked={lk.hostSettings.disableCameras}
                    onChange={v => handleHostSettingChange('disableCameras', v)}
                  />
                  <HostControlRow
                    label="Chat Slowdown (5s)"
                    checked={lk.hostSettings.chatSlowdown}
                    onChange={v => handleHostSettingChange('chatSlowdown', v)}
                  />
                </div>
              </div>
            )}

            <div className="flex-1 p-4 overflow-auto">
              <div
                className="w-full grid gap-2 h-full"
                style={{
                  gridTemplateColumns:
                    gridPreset === 'tiled'
                      ? 'repeat(auto-fill, minmax(240px, 1fr))'
                      : '2.2fr 1.2fr',
                }}
              >
                {renderGrid()}
              </div>
            </div>

            {selfViewMode === 'floating' && (
              <SelfView username={username} camOn={lk.isCamOn} isSharing={lk.isSharing} floating />
            )}

            {lk.isSharing && (
              <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 bg-emerald-600/90 rounded-full text-xs font-medium shadow-lg">
                <span>You are sharing your screen</span>
                <button
                  onClick={lk.stopScreenShare}
                  className="px-2 py-0.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                >
                  Stop
                </button>
              </div>
            )}

            <ControlBar
              isMicOn={lk.isMicOn}
              isCamOn={lk.isCamOn}
              isSharing={lk.isSharing}
              isRaisedHand={lk.isRaisedHand}
              isDeafened={lk.isDeafened}
              audioDevices={lk.audioDevices}
              videoDevices={lk.videoDevices}
              onMicToggle={lk.toggleMic}
              onCamToggle={lk.toggleCam}
              onScreenshare={() => setShowScreenshare(true)}
              onStopScreenshare={lk.stopScreenShare}
              onHandRaise={lk.toggleHandRaise}
              onDeafen={() => lk.setIsDeafened(!lk.isDeafened)}
              onSettings={() => setShowSettings(true)}
              onEndCall={handleLeave}
              selfViewMode={selfViewMode}
              onSelfViewModeToggle={() => setSelfViewMode(v => v === 'floating' ? 'grid' : 'floating')}
              sidebarOpen={sidebarOpen}
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
              onSwitchAudioDevice={lk.switchAudioDevice}
              onSwitchVideoDevice={lk.switchVideoDevice}
            />
          </div>

          {sidebarOpen && (
            <Sidebar
              users={lk.users}
              localIdentity={username}
              messages={lk.messages}
              onSendMessage={lk.sendMessage}
              tab={sidebarTab}
              onTabChange={setSidebarTab}
              isHost={isHost}
              chatDisabled={lk.hostSettings.disableChat}
            />
          )}

          {showScreenshare && (
            <ScreenshareModal
              onClose={() => setShowScreenshare(false)}
              onStartScreenShare={async () => {
                await lk.startScreenShare()
                setShowScreenshare(false)
              }}
            />
          )}

          {showSettings && (
            <SettingsPanel
              onClose={() => setShowSettings(false)}
              gridPreset={gridPreset}
              onGridPresetChange={setGridPreset}
              selfViewMode={selfViewMode}
              onSelfViewModeChange={setSelfViewMode}
              keybinds={lk.keybinds}
              onKeybindChange={lk.setKeybinds}
              audioDevices={lk.audioDevices}
              videoDevices={lk.videoDevices}
              onSwitchAudioDevice={lk.switchAudioDevice}
              onSwitchVideoDevice={lk.switchVideoDevice}
            />
          )}
        </div>
      </LocalIdentityContext.Provider>
    </LiveKitRoomContext.Provider>
  )
}
