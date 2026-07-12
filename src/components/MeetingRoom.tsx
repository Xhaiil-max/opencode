import { useState, useEffect, useRef } from 'react'
import { Copy, Check, Wifi, WifiOff, WifiHigh, MoreHorizontal, PenTool, Settings, Users, MessageSquare } from 'lucide-react'
import type { SelfViewMode, SidebarTab } from '../types'
import ControlBar from './ControlBar'
import ParticipantTile from './ParticipantTile'
import SelfView from './SelfView'
import Sidebar from './Sidebar'
import ScreenshareModal from './ScreenshareModal'
import SettingsPanel from './SettingsPanel'
import Whiteboard from './Whiteboard'
import HostControlRow from './HostControlRow'
import { useLiveKit } from '../hooks/useLiveKit'
import { LiveKitRoomContext, LocalIdentityContext } from '../context/LiveKitContext'
import { copyMeetingLink } from '../utils/meetingLink'

function ConnectionQualityIndicator({ quality, state }: { quality: number; state: string }) {
  // LiveKit connectionQuality is 0-5, higher is better
  // 5 = excellent (all bars), 4 = good, 3 = fair, 2 = poor, 1 = very poor, 0 = disconnected
  const getIcon = () => {
    if (state !== 'connected') return <WifiOff size={14} className="text-text-muted" />
    if (quality >= 4.5) return <WifiHigh size={14} className="text-accent-success" />
    if (quality >= 3.5) return <Wifi size={14} className="text-accent-success" />
    if (quality >= 2.5) return <Wifi size={14} className="text-accent-warning" />
    if (quality >= 1.5) return <Wifi size={14} className="text-accent-error" />
    return <WifiOff size={14} className="text-accent-error" />
  }

  const getText = () => {
    if (state !== 'connected') return state.charAt(0).toUpperCase() + state.slice(1)
    if (quality >= 4.5) return 'Excellent'
    if (quality >= 3.5) return 'Good'
    if (quality >= 2.5) return 'Fair'
    if (quality >= 1.5) return 'Poor'
    return 'Lost'
  }

  return (
    <div className="flex items-center gap-1.5">
      {getIcon()}
      <span className="text-xs font-medium text-text-secondary">{getText()}</span>
    </div>
  )
}

interface MeetingRoomProps {
  username: string
  roomName: string
  isHost: boolean
  onLeave: () => void
}

export default function MeetingRoom({ username, roomName, isHost, onLeave }: MeetingRoomProps) {
  const lk = useLiveKit({ username, roomName, isHostCreator: isHost })

  const [selfViewMode, setSelfViewMode] = useState<SelfViewMode>('grid')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('participants')
  const [showSettings, setShowSettings] = useState(false)
  const [showScreenshare, setShowScreenshare] = useState(false)
  const [showHostControls, setShowHostControls] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [showWhiteboard, setShowWhiteboard] = useState(false)
  const [showUnifiedMenu, setShowUnifiedMenu] = useState(false)
  const unifiedMenuRef = useRef<HTMLDivElement>(null)

  const localUser = lk.users.find(u => u.id === username)
  const isSpeaking = localUser?.isSpeaking ?? false

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

  // Click outside to close unified menu
  useEffect(() => {
    if (!showUnifiedMenu) return
    const handleClick = (e: MouseEvent) => {
      if (unifiedMenuRef.current && !unifiedMenuRef.current.contains(e.target as Node)) {
        setShowUnifiedMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showUnifiedMenu, unifiedMenuRef])

  const handleLeave = () => { lk.disconnect(); onLeave() }

  const remoteUsers = lk.users.filter(u => u.id !== username)

  const sortedRemote = [...remoteUsers].sort((a, b) => {
    if (a.handRaised && !b.handRaised) return -1
    if (!a.handRaised && b.handRaised) return 1
    return 0
  })

  const handleCopyLink = async () => {
    const ok = await copyMeetingLink(roomName)
    if (ok) {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    }
  }

  const handleHostSettingChange = (key: keyof typeof lk.hostSettings, value: boolean) => {
    const next = { ...lk.hostSettings, [key]: value }
    lk.updateHostSettings(next)
    if (key === 'muteEveryone' && value) lk.broadcastHostAction('muteAll')
    if (key === 'disableCameras' && value) lk.broadcastHostAction('disableCameras')
  }

  if (lk.connectionState === 'disconnected' && !lk.error) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-haze-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Connecting to meeting...</p>
        </div>
      </div>
    )
  }

  if (lk.error) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-center">
          <p className="text-accent-error mb-2">Failed to connect: {lk.error}</p>
          <button onClick={handleLeave} className="btn-secondary text-sm">Go Back</button>
        </div>
      </div>
    )
  }

  const renderGrid = () => {
    // Simple tiled layout - always show all participants in a grid
    return (
      <>
        {sortedRemote.map(u => <ParticipantTile key={u.id} user={u} isDeafened={lk.isDeafened} />)}
        {selfViewMode === 'grid' && (
          <SelfView username={username} camOn={lk.isCamOn} isSharing={lk.isSharing} isSpeaking={isSpeaking} />
        )}
      </>
    )
  }

  return (
    <LiveKitRoomContext.Provider value={lk.room}>
      <LocalIdentityContext.Provider value={username}>
        <div className="flex h-screen bg-bg-primary overflow-hidden">
          <div className="flex-1 flex flex-col relative">
            <div className="flex items-center justify-between px-4 py-2 glass-strong/50 border-b border-border-primary shrink-0">
              <span className="text-sm text-text-secondary">
                Meeting: <code className="text-text-primary font-mono">{roomName}</code>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="btn-secondary btn-sm gap-1.5"
                  title="Copy meeting link"
                >
                  {linkCopied ? <Check size={14} className="text-accent-success" /> : <Copy size={14} />}
                  {linkCopied ? 'Copied!' : 'Copy Link'}
                </button>

                {/* Unified Menu Dropdown */}
                <div className="relative" ref={unifiedMenuRef}>
                  <button
                    onClick={() => setShowUnifiedMenu(!showUnifiedMenu)}
                    className="btn-ghost btn-icon-sm"
                    title="More options"
                    aria-label="More options"
                  >
                    <MoreHorizontal size={20} />
                  </button>

                  {showUnifiedMenu && (
                    <div className="absolute right-0 top-full mt-2 z-30 glass-strong rounded-xl p-2 shadow-2xl min-w-[180px] animate-fade-in">
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-bg-tertiary transition-colors cursor-pointer" onClick={() => { setShowWhiteboard(!showWhiteboard); setShowUnifiedMenu(false); }}>
                        <PenTool size={18} className="text-haze-400" />
                        <span className="text-sm font-medium text-text-primary">Whiteboard</span>
                        {showWhiteboard && <span className="ml-auto text-xs text-accent-success">Open</span>}
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-bg-tertiary transition-colors cursor-pointer" onClick={() => { setShowSettings(true); setShowUnifiedMenu(false); }}>
                        <Settings size={18} className="text-haze-400" />
                        <span className="text-sm font-medium text-text-primary">Settings</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-bg-tertiary transition-colors cursor-pointer" onClick={() => { setSidebarTab('participants'); setSidebarOpen(true); setShowUnifiedMenu(false); }}>
                        <Users size={18} className="text-haze-400" />
                        <span className="text-sm font-medium text-text-primary">Participants</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-bg-tertiary transition-colors cursor-pointer" onClick={() => { setSidebarTab('chat'); setSidebarOpen(true); setShowUnifiedMenu(false); }}>
                        <MessageSquare size={18} className="text-haze-400" />
                        <span className="text-sm font-medium text-text-primary">Chat</span>
                      </div>
                      {lk.isLocalHost && (
                        <div className="border-t border-border-primary my-1" />
                      )}
                      {lk.isLocalHost && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-bg-tertiary transition-colors cursor-pointer" onClick={() => { setShowHostControls(!showHostControls); setShowUnifiedMenu(false); }}>
                          <Settings size={18} className="text-accent-warning" />
                          <span className="text-sm font-medium text-accent-warning">Host Controls</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <ConnectionQualityIndicator quality={lk.stats?.connectionQuality ?? 0} state={lk.connectionState} />
              </div>
            </div>

            {showHostControls && lk.isLocalHost && (
              <div className="absolute top-10 right-4 z-30 glass-strong rounded-xl p-4 w-72 shadow-2xl">
                <h3 className="text-sm font-medium text-text-primary mb-3">Host Controls</h3>
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
                    'repeat(auto-fill, minmax(240px, 1fr))',
                }}
              >
                {renderGrid()}
              </div>
            </div>

            {selfViewMode === 'floating' && (
              <SelfView username={username} camOn={lk.isCamOn} isSharing={lk.isSharing} isSpeaking={isSpeaking} floating />
            )}

            {lk.isSharing && (
              <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 glass-strong rounded-full text-xs font-medium shadow-lg">
                <span className="text-text-primary">You are sharing your screen</span>
                <button
                  onClick={lk.stopScreenShare}
                  className="px-2 py-0.5 rounded-full bg-bg-tertiary hover:bg-bg-elevated text-text-primary transition-colors"
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
              whiteboardOpen={showWhiteboard}
              onToggleWhiteboard={() => setShowWhiteboard(!showWhiteboard)}
              disableWhiteboard={lk.hostSettings.disableWhiteboard}
              isLocalHost={lk.isLocalHost}
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
              chatDisabled={lk.hostSettings.disableChat}
              isLocalHost={lk.isLocalHost}
              onBroadcastHostAction={lk.broadcastHostAction}
              onToggleWhiteboard={() => setShowWhiteboard(!showWhiteboard)}
              whiteboardOpen={showWhiteboard}
              hostSettings={lk.hostSettings}
              onUpdateHostSettings={lk.updateHostSettings}
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

          {showWhiteboard && (
            <Whiteboard 
              isOpen={showWhiteboard} 
              onClose={() => setShowWhiteboard(false)}
              disableWhiteboardDrawing={lk.hostSettings.disableWhiteboardDrawing}
              isLocalHost={lk.isLocalHost}
            />
          )}
          {showSettings && (
            <SettingsPanel
              onClose={() => setShowSettings(false)}
              keybinds={lk.keybinds}
              audioDevices={lk.audioDevices}
              videoDevices={lk.videoDevices}
              onSwitchAudioDevice={lk.switchAudioDevice}
              onSwitchVideoDevice={lk.switchVideoDevice}
              room={lk.room}
              micOn={lk.isMicOn}
              micGain={lk.micGain}
              onMicGainChange={lk.setMicGain}
              stats={lk.stats}
              camOn={lk.isCamOn}
              userColor={lk.users.find(u => u.id === username)?.color || '#6366f1'}
              onUserColorChange={lk.setUserColor}
            />
          )}
        </div>
      </LocalIdentityContext.Provider>
    </LiveKitRoomContext.Provider>
  )
}
