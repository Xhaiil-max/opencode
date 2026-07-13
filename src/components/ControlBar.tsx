import { useState } from 'react'
import {
  Mic, MicOff, Video, VideoOff, MonitorUp, Hand, Ear, EarOff,
  Settings, PhoneOff, ChevronUp, PanelRight, PanelRightClose, User, PenTool,
  Grid3x3, SplitSquareVertical, Menu
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
  sidebarTab: 'participants' | 'chat' | 'tools'
  onSidebarTabChange: (tab: 'participants' | 'chat' | 'tools') => void
  selfViewMode: string
  onSelfViewModeToggle: () => void
  onSwitchAudioDevice: (deviceId: string) => void
  onSwitchVideoDevice: (deviceId: string) => void
  whiteboardOpen: boolean
  onToggleWhiteboard: () => void
  disableWhiteboard?: boolean
  isLocalHost?: boolean
  gridPreset: 'tiled' | 'spotlight' | 'speaker' | 'sidebar'
  onGridPresetChange: (preset: 'tiled' | 'spotlight' | 'speaker' | 'sidebar') => void
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
  gridPreset, onGridPresetChange,
}: ControlBarProps) {
  const [showMicOptions, setShowMicOptions] = useState(false)
  const [showCamOptions, setShowCamOptions] = useState(false)
  const [showGridOptions, setShowGridOptions] = useState(false)

  const canToggleWhiteboard = isLocalHost || !disableWhiteboard

  return (
    <div className="flex items-center justify-center gap-1.5 p-3 shrink-0">
      <div className="flex items-center gap-1 glass p-1.5 rounded-2xl border border-border-primary/50 backdrop-blur">
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
            <div className="absolute bottom-full mb-2 glass-strong rounded-xl p-2 w-64 shadow-2xl z-50">
              {audioDevices.length === 0 ? (
                <p className="text-xs text-text-muted px-3 py-2">No microphones found</p>
              ) : (
                ): (
                <div className="absolute bottom-full mb-2 w-64 glass-strong rounded-xl p-2 shadow-2xl z-50 max-h-[80vh] overflow-y-auto">
                  {audioDevices.map(d => (
                    <button
                      key={d.deviceId}
                      onClick={() => { onSwitchAudioDevice(d.deviceId); setShowMicOptions(false) }}
                      className="block w-full text-left text-xs px-3 py-2 rounded-lg hover:bg-bg-tertiary transition-colors truncate"
                      title={d.label || `Microphone ${d.deviceId.slice(0, 6)}`}
                    >
                      {d.label || `Microphone ${d.deviceId.slice(0, 6)}`}
                    </button>
                  ))
                )}
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
            <div className="absolute bottom-full mb-2 glass-strong rounded-xl p-2 w-64 shadow-2xl z-50">
              {videoDevices.length === 0 ? (
                <p className="text-xs text-text-muted px-3 py-2">No cameras found</p>
              ) : (
                ): (
                <div className="absolute bottom-full mb-2 w-64 glass-strong rounded-xl p-2 shadow-2xl z-50 max-h-[80vh] overflow-y-auto">
                  {videoDevices.map(d => (
                    <button
                      key={d.deviceId}
                      onClick={() => { onSwitchVideoDevice(d.deviceId); setShowCamOptions(false) }}
                      className="block w-full text-left text-xs px-3 py-2 rounded-lg hover:bg-bg-tertiary transition-colors truncate"
                      title={d.label || `Camera ${d.deviceId.slice(0, 6)}`}
                    >
                      {d.label || `Camera ${d.deviceId.slice(0, 6)}`}
                    </button>
                  ))
                )}
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

        <div className="w-px h-6 bg-border-primary mx-1" />
        <ControlButton
          label={selfViewMode === 'floating' ? 'Self View: Floating' : 'Self View: Grid'}
          icon={User}
          active={selfViewMode === 'floating'}
          onClick={onSelfViewModeToggle}
        />

        <div className="w-px h-6 bg-border-primary mx-1" />
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

        {/* Grid Layout Controls */}
        <div className="relative">
          <button
            onClick={() => setShowGridOptions(!showGridOptions)}
            title="Grid Layout"
            className="p-2.5 rounded-xl hover:bg-bg-tertiary transition-colors duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Grid3x3 size={18} />
          </button>
          {showGridOptions && (
            <div className="absolute bottom-full mb-2 w-56 glass-strong rounded-xl p-2 shadow-2xl z-50 max-h-[60vh] overflow-y-auto">
              <div className="space-y-1">
                {[
                  { id: 'tiled', label: 'Tiled', icon: Grid3x3 },
                  { id: 'spotlight', label: 'Spotlight', icon: SplitSquareVertical },
                  { id: 'speaker', label: 'Speaker', icon: Menu },
                  { id: 'sidebar', label: 'Sidebar', icon: PanelRight }
                ].map(option => (
                  <button
                    key={option.id}
                    onClick={() => {
                      onGridPresetChange(option.id as GridPreset);
                      setShowGridOptions(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-bg-tertiary transition-colors ${
                      gridPreset === option.id ? 'bg-haze-500/20 text-haze-400' : 'text-text-secondary'
                    }`}
                    title={option.label}
                  >
                    {option.icon && <option.icon size={16} />}
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <ControlButton label="Settings" icon={Settings} active={false} onClick={onSettings} />

        <div className="w-px h-6 bg-border-primary mx-1" />
        <button onClick={onEndCall} className="p-2.5 rounded-xl bg-accent-error/20 hover:bg-accent-error/30 text-accent-error transition-colors" title="End Call">
          <PhoneOff size={18} />
        </button>
      </div>
    </div>
  )
}

function ControlButton({
  label,
  icon: Icon,
  active,
  danger,
  onClick,
  disabled,
  variant = 'default',
  size = 'md'
}: {
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  active: boolean;
  danger?: boolean;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'ghost';
  size?: 'md' | 'icon';
}) {
  const sizeClasses = {
    md: 'p-2.5 rounded-xl',
    icon: 'p-2 rounded-lg',
  }

  const variantClasses = {
    default: active
      ? 'bg-haze-500/20 text-haze-400'
      : danger
        ? 'text-accent-error bg-accent-error/10'
        : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-all duration-200',
    ghost: active
      ? 'bg-haze-500/20 text-haze-400'
      : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-all duration-200',
  }

  return (
    <button
      onClick={onClick}
      title={label}
      disabled={disabled}
      className={`${sizeClasses[size]} transition-colors ${variantClasses[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} hover:scale-[1.02] active:scale-[0.98]`}
    >
      <Icon size={size === 'md' ? 18 : 16} />
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
      <button onClick={onClick} title={label} className={`p-2.5 rounded-l-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
        active ? 'bg-haze-500/20 text-haze-400' : danger ? 'text-accent-error bg-accent-error/10' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
      }`}>
        <Icon size={18} />
      </button>
      <button onClick={onArrowClick} className={`p-2.5 pr-2 rounded-r-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] border-l border-border-primary ${
        active ? 'bg-haze-500/20 text-haze-400' : danger ? 'text-accent-error bg-accent-error/10' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
      }`}>
        <ChevronUp size={12} />
      </button>
      {showOptions && children}
    </div>
  )
}
