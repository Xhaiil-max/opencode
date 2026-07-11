import type { User } from '../types'
import ParticipantTile from './ParticipantTile'

interface ParticipantGridProps {
  users: User[]
}

export default function ParticipantGrid({ users }: ParticipantGridProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 h-full content-start">
      {users.map(u => (
        <ParticipantTile key={u.id} user={u} isCurrent={u.id === '1'} />
      ))}
    </div>
  )
}
