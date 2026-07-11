import { useState } from 'react'
import {
  Mic, MicOff, Video, VideoOff, MonitorUp, Hand, Ear, EarOff,
  Minimize, Settings, PhoneOff, ChevronUp, PanelRight, PanelRightClose
} from 'lucide-react'

interface ControlBarProps {
  isMicOn: boolean; isCamOn: boolean; isSharing: boolean; isRaisedHand: boolean; isDeafened: boolean
  /* eslint-disable @typescript-eslint/no-unused-vars */
  __isSharing?: boolean
  onMicToggle: () => void; onCamToggle: () => void; onScreenshare: () => void; onHandRaise: () => void
  onDeafen: () => void; onFullscreen: () => void; onSettings: () => void; onEndCall: () => void
  onTogglePip: () => void; sidebarOpen: boolean; onToggleSidebar: () => void
  selfViewMode: string; onSelfViewModeToggle: () => void
}

export default function ControlBar({
  isMicOn, isCamOn, isRaisedHand, isDeafened, onMicToggle, onCamToggle,
  onScreenshare, onHandRaise, onDeafen, onFullscreen, onSettings, onEndCall, onTogglePip,
  sidebarOpen, onToggleSidebar, selfViewMode, onSelfViewModeToggle
}: ControlBarProps) {
  const [showMicOptions, setShowMicOptions] = useState(false)
  const [showCamOptions, setShowCamOptions] = useState(false)

  const devices = ['Microphone (Scarlett 2i2)', 'USB Headset', 'Webcam Mic'];

  return (
    <div className="flex items-center justify-center gap-1.5 p-3">
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
            <div className="absolute bottom-full mb-2 bg-zinc-900 border border-zinc-700 rounded-xl p-2 w-56 shadow-2xl">
              {devices.map(d => (
                <button key={d} className="block w-full text-left text-xs px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors">{d}</button>
              ))}
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
            <div className="absolute bottom-full mb-2 bg-zinc-900 border border-zinc-700 rounded-xl p-2 w-56 shadow-2xl">
              {['Logitech C920', 'MacBook Camera', 'External 4K'].map(d => (
                <button key={d} className="block w-full text-left text-xs px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors">{d}</button>
              ))}
            </div>
          )}
        </ButtonGroup>

        <ControlButton label="Share Screen" icon={MonitorUp} active={false} onClick={onScreenshare} />
        <ControlButton label="Raise Hand" icon={Hand} active={isRaisedHand} onClick={onHandRaise} />
        <ControlButton label={isDeafened ? "Undeafen" : "Deafen"} icon={isDeafened ? EarOff : Ear} active={isDeafened} onClick={onDeafen} danger={isDeafened} />
        <div className="w-px h-6 bg-zinc-800 mx-1" />
        <ControlButton label="Fullscreen" icon={Minimize} active={false} onClick={onFullscreen} />
        <ControlButton label="Pop Out" icon={Minimize} active={false} onClick={onTogglePip} />
        <ControlButton label="Self View" icon={selfViewMode === 'floating' ? Minimize : Minimize} active={selfViewMode === 'floating'} onClick={onSelfViewModeToggle} />

        <div className="w-px h-6 bg-zinc-800 mx-1" />
        <ControlButton label="Toggle Sidebar" icon={sidebarOpen ? PanelRightClose : PanelRight} active={sidebarOpen} onClick={onToggleSidebar} />
        <ControlButton label="Settings" icon={Settings} active={false} onClick={onSettings} />

        <div className="w-px h-6 bg-zinc-800 mx-1" />
        <button onClick={onEndCall} className="p-2.5 rounded-xl bg-red-600 hover:bg-red-500 transition-colors" title="End Call">
          <PhoneOff size={18} />
        </button>
      </div>
    </div>
  )
}

function ControlButton({ label, icon: Icon, active, danger, onClick }: { label: string; icon: any; active: boolean; danger?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`p-2.5 rounded-xl transition-colors ${
        active ? 'bg-indigo-600/30 text-indigo-400' : danger ? 'text-red-400 bg-red-500/10' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
      }`}
    >
      <Icon size={18} />
    </button>
  )
}

function ButtonGroup({ label, icon: Icon, active, danger, onClick, onArrowClick, showOptions, children }: { label: string; icon: any; active: boolean; danger?: boolean; onClick: () => void; onArrowClick: () => void; showOptions: boolean; children: React.ReactNode }) {
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
