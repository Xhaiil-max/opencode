import { useState, useEffect, useRef } from 'react'
import { Copy, Check, MoreHorizontal, PenTool, Settings, Users, MessageSquare } from 'lucide-react'
import type { SelfViewMode, SidebarTab, GridPreset } from '../types'
import { Track } from 'livekit-client'
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

  // Show different states based on connection
  if (state === 'disconnected') {
    return (
      <div className="relative inline-flex items-center gap-2" title="Disconnected">
        <div className="flex space-x-0.5">
          {[1, 2, 3, 4].map((bar) => (
            <div key={bar} className="h-1 bg-text-muted/20" />
          ))}
        </div>
        <span className="text-xs font-medium text-accent-error whitespace-nowrap">Lost</span>
        <span className="text-xs text-text-muted">Disconnected</span>
      </div>
    );
  }

  if (state === 'connecting' || state === 'reconnecting' || state === 'signalReconnecting') {
    return (
      <div className="relative inline-flex items-center gap-2" title="Connecting...">
        <div className="flex space-x-0.5">
          {[1, 2, 3, 4].map((bar, i) => (
            <div
              key={bar}
              className={`h-1.5 bg-haze-500/50 animate-pulse`}
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
        <span className="text-xs font-medium text-haze-500 whitespace-nowrap">Connecting...</span>
      </div>
    );
  }

  // Connected state - show quality bars
  const getBarClasses = (barIndex: number) => {
    const barCount = 4;
    const threshold = (barIndex + 1) / barCount * 5; // Convert 0-5 scale to bar threshold

    if (quality >= threshold) {
      if (quality >= 4.5) return 'h-2.5 bg-accent-success';
      if (quality >= 3.5) return 'h-2 bg-accent-success';
      if (quality >= 2.5) return 'h-1.5 bg-accent-warning';
      if (quality >= 1.5) return 'h-1 bg-accent-error';
      return 'h-0.5 bg-accent-error';
    }

    return 'h-1 bg-text-muted/20';
  };

  const getTooltipContent = () => {
    let qualityText = '';
    if (quality >= 4.5) qualityText = 'Excellent';
    else if (quality >= 3.5) qualityText = 'Good';
    else if (quality >= 2.5) qualityText = 'Fair';
    else if (quality >= 1.5) qualityText = 'Poor';
    else qualityText = 'Very Poor';

    return `${qualityText} (${quality.toFixed(1)}/5)`;
  };

  return (
    <div
      className="relative inline-flex items-center gap-2"
      title={getTooltipContent()}
    >
      <div className="flex space-x-0.5">
        {[1, 2, 3, 4].map((bar) => (
          <div key={bar} className={getBarClasses(bar - 1)} />
        ))}
      </div>
      <span className="text-xs font-medium text-text-secondary whitespace-nowrap">
        {/* Optional: show text label */}
        {/* {getText()} */}
      </span>
    </div>
  );
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
  const [gridPreset, setGridPreset] = useState<GridPreset>('tiled')
  const [showSettings, setShowSettings] = useState(false)
  const [showScreenshare, setShowScreenshare] = useState(false)
  const [showHostControls, setShowHostControls] = useState(false)
  const hostControlsRef = useRef<HTMLDivElement>(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [showWhiteboard, setShowWhiteboard] = useState(false)
  const [showUnifiedMenu, setShowUnifiedMenu] = useState(false)
  const unifiedMenuRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Handle whiteboard toggle from host
  useEffect(() => {
    const handleWhiteboardToggle = (e: CustomEvent) => {
      if (e.detail?.open) {
        setShowWhiteboard(true);
      } else {
        setShowWhiteboard(false);
      }
    };
    window.addEventListener('whiteboardToggle', handleWhiteboardToggle as EventListener);
    return () => window.removeEventListener('whiteboardToggle', handleWhiteboardToggle as EventListener);
  }, []);

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        // Check if click is on the control bar buttons that open the sidebar
        const target = e.target as HTMLElement
        if (target.closest('[data-sidebar-trigger]')) return
        setSidebarOpen(false)
      }
    }

    if (sidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [sidebarOpen])

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

  // Click outside to close host controls
  useEffect(() => {
    if (!showHostControls) return
    const handleClick = (e: MouseEvent) => {
      if (hostControlsRef.current && !hostControlsRef.current.contains(e.target as Node)) {
        setShowHostControls(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showHostControls])

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
    if (key === 'deafenEveryone' && value) lk.broadcastHostAction('deafenEveryone')
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

  const { screenShares } = lk

  const renderGrid = () => {
    return (
      <>
        {sortedRemote.map(u => <ParticipantTile
          key={u.id}
          user={u}
          isDeafened={lk.isDeafened}
          isLocalHost={lk.isLocalHost}
          muteParticipant={lk.muteParticipant}
          deafenParticipant={lk.deafenParticipant}
          disableVideo={lk.disableVideo}
          pinnedParticipantId={lk.pinnedParticipantId}
          pinParticipant={lk.pinParticipant}
          unpinParticipant={lk.unpinParticipant}
        />)}
        {screenShares.map(ss => {
            const presenterParticipant = ss.presenterId === lk.room?.localParticipant.identity
              ? lk.room?.localParticipant
              : lk.room?.remoteParticipants.get(ss.presenterId) ?? null
            return (
              <ParticipantTile
                key={ss.id}
                user={{
                  id: ss.id,
                  name: `${ss.presenterName}'s Screen`,
                  micOn: false,
                  camOn: false,
                  handRaised: false,
                  isSharing: true,
                  isSpeaking: ss.isSpeaking,
                  audioLevel: ss.audioLevel,
                  volume: 80,
                  localVideoDisabled: false,
                  localScreenshareDisabled: false,
                  isHost: false,
                  color: ss.presenterColor,
                  connectionQuality: 5,
                }}
                isDeafened={lk.isDeafened}
                participant={presenterParticipant}
                source={Track.Source.ScreenShare}
                isLocalHost={lk.isLocalHost}
                muteParticipant={lk.muteParticipant}
                deafenParticipant={lk.deafenParticipant}
                disableVideo={lk.disableVideo}
                pinnedParticipantId={lk.pinnedParticipantId}
                pinParticipant={lk.pinParticipant}
                unpinParticipant={lk.unpinParticipant}
              />
            )
          })}
        {selfViewMode === 'grid' && (
          <SelfView username={username} camOn={lk.isCamOn} isSharing={lk.isSharing} isSpeaking={isSpeaking} />
        )}
      </>
    )
  }
        </>
      )
    }

    // Tiled mode (default): all participants in a grid, screen shares take max space
    return (
      <>
        {hasScreenShare && (
          <div className="col-span-full">
            {screenTiles}
          </div>
        )}
        {participantTiles}
        {selfTile}
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

                <ConnectionQualityIndicator quality={lk.stats?.connectionQuality ?? 5} state={lk.connectionState} />
              </div>
            </div>

            {showHostControls && lk.isLocalHost && (
              <div ref={hostControlsRef} className="absolute top-10 right-4 z-30 glass-strong rounded-xl p-4 w-72 shadow-2xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-text-primary">Host Controls</h3>
                  <button onClick={() => setShowHostControls(false)} className="p-1 rounded-lg hover:bg-bg-tertiary transition-colors text-text-secondary hover:text-text-primary cursor-pointer" title="Close">
                    <X size={14} />
                  </button>
                </div>
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
                  <HostControlRow
                    label="Deafen Everyone"
                    checked={lk.hostSettings.deafenEveryone}
                    onChange={v => handleHostSettingChange('deafenEveryone', v)}
                  />
                </div>
              </div>
            )}

            <div className="flex-1 p-4 overflow-auto">
              <div
                className="w-full grid gap-2 h-full"
                style={{
                  gridTemplateColumns: gridPreset === 'spotlight' ? '2fr 1fr' : gridPreset === 'sidebar' ? '3fr 1fr' : 'repeat(auto-fill, minmax(240px, 1fr))',
                }}
              >
                {renderGrid()}
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
              sidebarTab={sidebarTab}
              onSidebarTabChange={setSidebarTab}
              onSwitchAudioDevice={lk.switchAudioDevice}
              onSwitchVideoDevice={lk.switchVideoDevice}
              whiteboardOpen={showWhiteboard}
              onToggleWhiteboard={() => setShowWhiteboard(!showWhiteboard)}
              disableWhiteboard={lk.hostSettings.disableWhiteboard}
              isLocalHost={lk.isLocalHost}
              gridPreset={gridPreset}
              onGridPresetChange={setGridPreset}
              requestMediaPermissions={lk.requestMediaPermissions}
            />
          </div>

          {sidebarOpen && (
            <Sidebar
              ref={sidebarRef}
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
              onClose={() => setSidebarOpen(false)}
              onSidebarTabChange={setSidebarTab}
              pinnedParticipantId={lk.pinnedParticipantId}
              pinParticipant={lk.pinParticipant}
              unpinParticipant={lk.unpinParticipant}
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
              setKeybinds={lk.setKeybinds}
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
              soundVolume={lk.soundVolume}
              onSoundVolumeChange={lk.setSoundVolume}
              selfViewMode={selfViewMode}
              onSelfViewModeChange={setSelfViewMode}
              gridPreset={gridPreset}
              onGridPresetChange={setGridPreset}
              isHost={lk.isLocalHost}
              // Host control functions
              muteAllParticipants={lk.muteAllParticipants}
              toggleScreenSharePermission={lk.toggleScreenSharePermission}
              toggleCameraPermission={lk.toggleCameraPermission}
              toggleMicrophonePermission={lk.toggleMicrophonePermission}
              // Device functions
              requestMediaPermissions={lk.requestMediaPermissions}
              // Theme + screenshare settings persistence
              theme={lk.theme}
              onThemeChange={lk.setTheme}
              screenShareSettings={lk.screenShareSettings}
              onScreenShareSettingsChange={lk.setScreenShareSettings}
            />
          )}
        </div>
      </LocalIdentityContext.Provider>
    </LiveKitRoomContext.Provider>
  )
}
