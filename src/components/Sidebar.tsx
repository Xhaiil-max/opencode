import { useState } from 'react'
import type { User, ChatMessage } from '../types'
import { Mic, MicOff, Video, VideoOff, MonitorUp, Hand, MessageSquare, Users } from 'lucide-react'

interface SidebarProps {
  users: User[]
  localIdentity: string
  messages: ChatMessage[]
  tab: 'participants' | 'chat'
  onTabChange: (tab: 'participants' | 'chat') => void
  isHost: boolean
  chatDisabled?: boolean
  onSendMessage: (message: string) => void
}

export default function Sidebar({
  users, localIdentity, messages, tab, onTabChange, chatDisabled, onSendMessage,
}: SidebarProps) {
  const [input, setInput] = useState('')

  const send = () => {
    if (!input.trim() || chatDisabled) return
    onSendMessage(input.trim())
    setInput('')
  }

  return (
    <div className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col h-full shrink-0">
      <div className="flex items-center p-2 gap-1 border-b border-zinc-800">
        <button onClick={() => onTabChange('participants')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${tab === 'participants' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'}`}>
          <Users size={14} /> Participants ({users.length})
        </button>
        <button onClick={() => onTabChange('chat')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${tab === 'chat' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'}`}>
          <MessageSquare size={14} /> Chat
        </button>
      </div>

      {tab === 'participants' ? (
        <ParticipantsTab users={users} localIdentity={localIdentity} />
      ) : (
        <ChatTab messages={messages} onSend={send} input={input} onInputChange={setInput} disabled={chatDisabled} />
      )}
    </div>
  )
}

function ParticipantsTab({ users, localIdentity }: { users: User[]; localIdentity: string }) {
  const raisedHands = users.filter(u => u.handRaised)
  const others = users.filter(u => !u.handRaised)

  return (
    <div className="flex-1 overflow-y-auto p-2">
      {raisedHands.length > 0 && (
        <div className="mb-2 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-xl">
          <h4 className="text-xs uppercase tracking-widest text-yellow-400 mb-2">Raised Hands</h4>
          {raisedHands.map(u => (
            <div key={u.id} className="flex items-center gap-2 py-1.5">
              <Hand size={14} className="text-yellow-400" />
              <span className="text-xs">{u.name}{u.id === localIdentity ? ' (You)' : ''}</span>
            </div>
          ))}
        </div>
      )}

      {others.length === 0 && raisedHands.length === 0 && (
        <p className="text-xs text-zinc-500 text-center py-8">No participants yet</p>
      )}

      {others.map(u => (
        <div key={u.id} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-zinc-800 transition-colors">
          <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
            <span className="text-xs font-medium">{u.name[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium truncate block">
              {u.name}{u.id === localIdentity ? ' (You)' : ''}{u.isHost ? ' · Host' : ''}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              {u.micOn ? <Mic size={10} className="text-green-400" /> : <MicOff size={10} className="text-red-400" />}
              {u.camOn ? <Video size={10} className="text-green-400" /> : <VideoOff size={10} className="text-red-400" />}
              {u.isSharing && <MonitorUp size={10} className="text-emerald-400" />}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ChatTab({
  messages, onSend, input, onInputChange, disabled,
}: {
  messages: ChatMessage[]
  onSend: () => void
  input: string
  onInputChange: (value: string) => void
  disabled?: boolean
}) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {messages.length === 0 && (
          <p className="text-xs text-zinc-500 text-center py-8">No messages yet. Say hello!</p>
        )}
        {messages.map(msg => (
          <div key={msg.id} className="flex flex-col gap-0.5">
            <span className="text-xs text-zinc-500">
              {msg.sender}{' '}
              <span className="text-zinc-700">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </span>
            <p className="text-xs break-words p-2 bg-zinc-800/50 rounded-lg">{msg.content}</p>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-zinc-800">
        {disabled && (
          <p className="text-xs text-red-400 mb-2">Chat has been disabled by the host</p>
        )}
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => onInputChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSend()}
            placeholder={disabled ? 'Chat disabled' : 'Type a message...'}
            disabled={disabled}
            className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 focus:border-indigo-500 outline-none text-xs transition-colors disabled:opacity-50"
          />
          <button
            onClick={onSend}
            disabled={disabled}
            className="px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
