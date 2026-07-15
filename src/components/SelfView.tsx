import { Monitor, Hand } from 'lucide-react'
import ParticipantVideo from './ParticipantVideo'
import { useRoom, useLocalIdentity } from '../context/LiveKitContext'
import DraggablePanel from './DraggablePanel'
import { getUserColor, getDesaturatedColor } from '../utils/colors'

interface SelfViewProps {
  username: string
  camOn: boolean
  isSharing?: boolean
  isSpeaking?: boolean
  isRaisedHand?: boolean
  floating?: boolean
}

export default function SelfView({ username, camOn, isSharing, isSpeaking, isRaisedHand, floating }: SelfViewProps) {
  const room = useRoom()
  const localIdentity = useLocalIdentity()
  const localParticipant = room?.localParticipant
  const userColor = getUserColor(localIdentity)

  const speakingRing = isSpeaking ? 'ring-2 ring-haze-500' : ''

  // Self view always shows camera (or avatar), never screenshare — screenshare is a separate tile
  const content = camOn && localParticipant ? (
    <ParticipantVideo participant={localParticipant} isLocal />
  ) : (
    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: userColor }}>
      <span className="text-sm font-medium text-white">{username[0]}</span>
    </div>
  )

  if (floating) {
    return (
      <DraggablePanel className={`w-52 rounded-xl overflow-hidden shadow-2xl glass-strong ${speakingRing}`}>
        <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
          <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: getDesaturatedColor(userColor, 0.25) }}>
            {content}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-bg-primary/80 to-transparent">
            <span className="text-xs font-medium" style={{ color: userColor }}>{username} (You)</span>
            {isRaisedHand && <Hand size={10} className="inline ml-1 text-accent-warning" />}
            {isSharing && <Monitor size={10} className="inline ml-1 text-accent-success" />}
          </div>
        </div>
      </DraggablePanel>
    )
  }

  return (
    <div className={`relative rounded-xl overflow-hidden glass-strong/50 border border-border-primary/30 ${speakingRing}`} style={{ aspectRatio: '16/9' }}>
      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: getDesaturatedColor(userColor, 0.25) }}>
        {content}
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-bg-primary/80 to-transparent">
        <span className="text-xs font-medium" style={{ color: userColor }}>{username} (You)</span>
        {isRaisedHand && <Hand size={10} className="inline ml-1 text-accent-warning" />}
      </div>
    </div>
  )
}
