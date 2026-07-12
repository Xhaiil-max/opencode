import { createContext, useContext } from 'react'
import type { Room } from 'livekit-client'

export const LiveKitRoomContext = createContext<Room | null>(null)
export const LocalIdentityContext = createContext<string>('')

export function useRoom() {
  return useContext(LiveKitRoomContext)
}

export function useLocalIdentity() {
  return useContext(LocalIdentityContext)
}
