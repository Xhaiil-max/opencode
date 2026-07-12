import { useState } from 'react'
import {
  Mic, MicOff, Video, VideoOff, MonitorUp, Hand, Ear, EarOff,
  Settings, PhoneOff, ChevronUp, PanelRight, PanelRightClose, User, PenTool
} from 'lucide-react'

interface ControlBarProps {
  isMicOn: boolean
  isCamOn: boolean
  isSharing: boolean
  isRaisedHand: boolean
  isDeafened: boolean
  audioDevices: MediaDeviceInfo[]
  videoDevices: MediaDeviceInfo[]
  onMicToggle: () => void
  onCamToggle: () => void
  onScreenshare: () => void
  onStopScreenshare: () => void
  onHandRaise: () => void
  onDeafen: () => void
  onSettings: () => void
  onEndCall: () => void
  sidebarOpen: boolean
  onToggleSidebar: () => void
  selfViewMode: string
  onSelfViewModeToggle: () => void
  onSwitchAudioDevice: (deviceId: string) => void
  onSwitchVideoDevice: (deviceId: string) => void
  whiteboardOpen: boolean
  onToggleWhiteboard: () => void
  disableWhiteboard?: boolean
  isLocalHost?: boolean
}

export default function ControlBar({
  isMicOn, isCamOn, isSharing, isRaisedHand, isDeafened,
  audioDevices, videoDevices,
  onMicToggle, onCamToggle, onScreenshare, onStopScreenshare,
  onHandRaise, onDeafen, onSettings, onEndCall,
  sidebarOpen, onToggleSidebar, selfViewMode, onSelfViewModeToggle,
  onSwitchAudioDevice, onSwitchVideoDevice,
  whiteboardOpen, onToggleWhiteboard,
  disableWhiteboard, isLocalHost,
}: ControlBarProps) {
  const [showMicOptions, setShowMicOptions] = useState(false)
  const [showCamOptions, setShowCamOptions] = useState(false)

  const canToggleWhiteboard = isLocalHost || !disableWhiteboard

  return (
    <div className="flex items-center justify-center gap-1.5 p-3 shrink-0">
      <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-1.5">
        <ButtonGroup
          label={isMicOn ? 'Mute' : 'Unmute'}
          icon={isMicOn ? Mic : MicOff}
          active={isMicOn}
          danger={!isMicOn}
          onClick={onMicToggle}
          onArrowClick={() => setShowMicOptions(!showMicOptions)}
          showOptions={showMicOptions}
        >
          {showMicOptions && (
            <div className="absolute bottom-full mb-2 bg-zinc-900 border border-zinc-700 rounded-xl p-2 w-64 shadow-2xl z-50">
              {audioDevices.length === 0 ? (
                <p className="text-xs text-zinc-500 px-3 py-2">No microphones found</p>
              ) : (
                audioDevices.map(d => (
                  <button
                    key={d.deviceId}
                    onClick={() => { onSwitchAudioDevice(d.deviceId); setShowMicOptions(false) }}
                    className="block w-full text-left text-xs px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors truncate"
                  >
                    {d.label || `Microphone ${d.deviceId.slice(0, 6)}`}
                  </button>
                ))
              )}
            </div>
          )}
        </ButtonGroup>

        <ButtonGroup
          label={isCamOn ? 'Stop Camera' : 'Start Camera'}
          icon={isCamOn ? Video : VideoOff}
          active={isCamOn}
          danger={!isCamOn}
          onClick={onCamToggle}
          onArrowClick={() => setShowCamOptions(!showCamOptions)}
          showOptions={showCamOptions}
        >
          {showCamOptions && (
            <div className="absolute bottom-full mb-2 bg-zinc-900 border border-zinc-700 rounded-xl p-2 w-64 shadow-2xl z-50">
              {videoDevices.length === 0 ? (
                <p className="text-xs text-zinc-500 px-3 py-2">No cameras found</p>
              ) : (
                videoDevices.map(d => (
                  <button
                    key={d.deviceId}
                    onClick={() => { onSwitchVideoDevice(d.deviceId); setShowCamOptions(false) }}
                    className="block w-full text-left text-xs px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors truncate"
                  >
                    {d.label || `Camera ${d.deviceId.slice(0, 6)}`}
                  </button>
                ))
              )}
            </div>
          )}
        </ButtonGroup>

        {isSharing ? (
          <ControlButton label="Stop Sharing" icon={MonitorUp} active danger onClick={onStopScreenshare} />
        ) : (
          <ControlButton label="Share Screen" icon={MonitorUp} active={false} onClick={onScreenshare} />
        )}
        <ControlButton label="Raise Hand" icon={Hand} active={isRaisedHand} onClick={onHandRaise} />
        <ControlButton
          label={isDeafened ? 'Undeafen' : 'Deafen'}
          icon={isDeafened ? EarOff : Ear}
          active={isDeafened}
          onClick={onDeafen}
          danger={isDeafened}
        />

        <div className="w-px h-6 bg-zinc-800 mx-1" />
        <ControlButton
          label={selfViewMode === 'floating' ? 'Self View: Floating' : 'Self View: Grid'}
          icon={User}
          active={selfViewMode === 'floating'}
          onClick={onSelfViewModeToggle}
        />

        <div className="w-px h-6 bg-zinc-800 mx-1" />
        <ControlButton
          label="Whiteboard"
          icon={PenTool}
          active={whiteboardOpen}
          onClick={onToggleWhiteboard}
          disabled={!canToggleWhiteboard}
        />
        <ControlButton
          label="Toggle Sidebar"
          icon={sidebarOpen ? PanelRightClose : PanelRight}
          active={sidebarOpen}
          onClick={onToggleSidebar}
        />
        <ControlButton label="Settings" icon={Settings} active={false} onClick={onSettings} />

        <div className="w-px h-6 bg-zinc-800 mx-1" />
        <button onClick={onEndCall} className="p-2.5 rounded-xl bg-red-600 hover:bg-red-500 transition-colors" title="End Call">
          <PhoneOff size={18} />
        </button>
      </div>
    </div>
  )
}

function ControlButton({ label, icon: Icon, active, danger, onClick, disabled }: { label: string; icon: React.ComponentType<{ size?: number }>; active: boolean; danger?: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={label}
      disabled={disabled}
      className={`p-2.5 rounded-xl transition-colors ${
        disabled ? 'opacity-50 cursor-not-allowed' :
        active ? 'bg-indigo-600/30 text-indigo-400' : danger ? 'text-red-400 bg-red-500/10' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
      }`}
    >
      <Icon size={18} />
    </button>
  )
}

function ButtonGroup({ label, icon: Icon, active, danger, onClick, onArrowClick, showOptions, children }: {
  label: string
  icon: React.ComponentType<{ size?: number }>
  active: boolean
  danger?: boolean
  onClick: () => void
  onArrowClick: () => void
  showOptions: boolean
  children: React.ReactNode
}) {
  return (
    <div className="relative flex">
      <button onClick={onClick} title={label} className={`p-2.5 rounded-l-xl transition-colors ${active ? 'bg-indigo-600/30 text-indigo-400' : danger ? 'text-red-400 bg-red-500/10' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`}>
        <Icon size={18} />
      </button>
      <button onClick={onArrowClick} className={`p-2.5 pr-2 rounded-r-xl transition-colors border-l border-zinc-800 ${active ? 'bg-indigo-600/30 text-indigo-400' : danger ? 'text-red-400 bg-red-500/10' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`}>
        <ChevronUp size={12} />
      </button>
      {showOptions && children}
    </div>
  )
}
