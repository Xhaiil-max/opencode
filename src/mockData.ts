import type { User, ChatMessage, Stat, Keybind } from './types'

export const MOCK_USERS: User[] = [
  { id: '1', name: 'You', micOn: true, camOn: true, handRaised: false, isSharing: false, isSpeaking: false, volume: 80, localVideoDisabled: false, localScreenshareDisabled: false, isHost: true },
  { id: '2', name: 'Sarah Chen', micOn: true, camOn: true, handRaised: false, isSharing: false, isSpeaking: true, volume: 75, localVideoDisabled: false, localScreenshareDisabled: false, isHost: false },
  { id: '3', name: 'Marcus Kim', micOn: false, camOn: true, handRaised: true, isSharing: false, isSpeaking: false, volume: 70, localVideoDisabled: false, localScreenshareDisabled: false, isHost: false },
  { id: '4', name: 'Elena Rodriguez', micOn: true, camOn: false, handRaised: false, isSharing: false, isSpeaking: false, volume: 65, localVideoDisabled: false, localScreenshareDisabled: false, isHost: false },
  { id: '5', name: 'Alex Wang', micOn: false, camOn: false, handRaised: false, isSharing: true, isSpeaking: false, volume: 80, localVideoDisabled: false, localScreenshareDisabled: false, isHost: false },
  { id: '6', name: 'Jamie Park', micOn: true, camOn: true, handRaised: false, isSharing: false, isSpeaking: false, volume: 70, localVideoDisabled: false, localScreenshareDisabled: false, isHost: false },
]

export const INITIAL_CHAT: ChatMessage[] = [
  { id: '1', sender: 'Sarah Chen', content: 'Hey everyone! Ready for the stream?', timestamp: Date.now() - 120000 },
  { id: '2', sender: 'Marcus Kim', content: 'Just fixed the audio issues', timestamp: Date.now() - 60000 },
  { id: '3', sender: 'Elena Rodriguez', content: 'https://miro.medium.com/v2/1*Ty2N0zI7lS0gD_v3VNf0gQ.png', timestamp: Date.now() - 30000, isImage: true },
]

export const STATS: Stat[] = [
  { label: 'Ping', audio: '24 ms', video: '42 ms', screenshare: '38 ms' },
  { label: 'Packet Loss', audio: '0%', video: '0.1%', screenshare: '0%' },
  { label: 'Receive Rate', audio: '48 Kbps', video: '2.4 Mbps', screenshare: '3.1 Mbps' },
  { label: 'Send Rate', audio: '44 Kbps', video: '1.8 Mbps', screenshare: '2.5 Mbps' },
]

export const DEFAULT_KEYBINDS: Keybind[] = [
  { id: 'toggle-mic', label: 'Toggle Mic', keys: 'Ctrl+Shift+M' },
  { id: 'toggle-cam', label: 'Toggle Cam', keys: 'Ctrl+Shift+C' },
  { id: 'toggle-deafen', label: 'Toggle Deafen', keys: 'Ctrl+Shift+D' },
  { id: 'toggle-stream-volume', label: 'Toggle Stream Volume', keys: 'Ctrl+Shift+V' },
]
