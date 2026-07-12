import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { User, ChatMessage, SidebarTab } from '../types'
import { Mic, MicOff, Video, VideoOff, MonitorUp, MessageSquare, Users, MoreVertical, UserX, VolumeX, VideoOff as VideoSlash, Smile, Image, PenTool, Wifi, WifiOff, WifiHigh, Hand } from 'lucide-react'
import { AudioLevelBar } from './AudioVisualizer'

const EMOJIS = ['😀', '😂', '😍', '😎', '👍', '👎', '❤️', '🔥', '🎉', '😢', '😡', '🤔', '😴', '🤯', '👋', '🙏', '💪', '🍕', '☕', '🚀', '✨', '💯', '🤝', '🎯', '💡', '🌟', '⚡', '🎨', '🎮', '🎵']

interface SidebarProps {
  users: User[]
  localIdentity: string
  messages: ChatMessage[]
  tab: SidebarTab
  onTabChange: (tab: SidebarTab) => void
  chatDisabled?: boolean
  onSendMessage: (message: string) => void
  isLocalHost: boolean
  onBroadcastHostAction: (action: string) => void
  onToggleWhiteboard: () => void
  whiteboardOpen: boolean
}

export default function Sidebar({
  users, localIdentity, messages, tab, onTabChange, chatDisabled, onSendMessage,
  isLocalHost, onBroadcastHostAction, onToggleWhiteboard, whiteboardOpen
}: SidebarProps) {
  const [input, setInput] = useState('')

  const send = () => {
    if (!input.trim() || chatDisabled) return
    onSendMessage(input.trim())
    setInput('')
  }

  return (
    <div className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col h-full min-h-0 shrink-0">
      <div className="flex items-center p-2 gap-1 border-b border-zinc-800 shrink-0">
        <button onClick={() => onTabChange('participants')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${tab === 'participants' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'}`}>
          <Users size={14} /> Participants ({users.length})
        </button>
        <button onClick={() => onTabChange('chat')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${tab === 'chat' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'}`}>
          <MessageSquare size={14} /> Chat
        </button>
        <button onClick={() => onTabChange('tools')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${tab === 'tools' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'}`}>
          <PenTool size={14} /> Tools
        </button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        {tab === 'participants' ? (
          <ParticipantsTab
            users={users}
            localIdentity={localIdentity}
            isLocalHost={isLocalHost}
            onBroadcastHostAction={onBroadcastHostAction}
          />
        ) : tab === 'chat' ? (
          <ChatTab messages={messages} onSend={send} input={input} onInputChange={setInput} disabled={chatDisabled} />
        ) : (
          <ToolsTab onToggleWhiteboard={onToggleWhiteboard} whiteboardOpen={whiteboardOpen} />
        )}
      </div>
    </div>
  )
}

function ParticipantsTab({ 
  users, localIdentity, isLocalHost, onBroadcastHostAction 
}: { 
  users: User[]; localIdentity: string; 
  isLocalHost: boolean; 
  onBroadcastHostAction: (action: string) => void;
}) {
  const [showMenuFor, setShowMenuFor] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const menuBtnRef = useRef<HTMLButtonElement | null>(null)

  const raisedHands = users.filter(u => u.handRaised)
  const others = users.filter(u => !u.handRaised)

  useEffect(() => {
    if (!showMenuFor) return
    const close = (e: MouseEvent) => {
      if (menuBtnRef.current?.contains(e.target as Node)) return
      setShowMenuFor(null)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [showMenuFor])

  const openMenu = (userId: string, btn: HTMLButtonElement) => {
    if (showMenuFor === userId) {
      setShowMenuFor(null)
      return
    }
    const rect = btn.getBoundingClientRect()
    const menuWidth = 180
    const menuHeight = 200
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let left = rect.right
    let top = rect.top - 8

    if (left + menuWidth > viewportWidth - 8) left = rect.left - menuWidth - 8
    if (top + menuHeight > viewportHeight - 8) top = viewportHeight - menuHeight - 8
    if (top < 8) top = 8

    setMenuPos({ top, left })
    setShowMenuFor(userId)
    menuBtnRef.current = btn
  }

  const handleMute = (user: User) => {
    onBroadcastHostAction('muteUser:' + user.id)
  }

  const handleRemove = (user: User) => {
    onBroadcastHostAction('removeUser:' + user.id)
  }

  const handleDisableCam = (user: User) => {
    onBroadcastHostAction('disableUserCam:' + user.id)
  }

  const handleLowerHand = (user: User) => {
    onBroadcastHostAction('lowerHand:' + user.id)
  }

  function getConnectionQualityIcon(quality: number) {
    if (quality >= 4.5) return <WifiHigh size={12} className="text-green-400" />
    if (quality >= 3.5) return <Wifi size={12} className="text-green-400" />
    if (quality >= 2.5) return <Wifi size={12} className="text-yellow-400" />
    if (quality >= 1.5) return <Wifi size={12} className="text-orange-400" />
    return <WifiOff size={12} className="text-red-400" />
  }

  function getConnectionQualityText(quality: number) {
    if (quality >= 4.5) return 'Excellent'
    if (quality >= 3.5) return 'Good'
    if (quality >= 2.5) return 'Fair'
    if (quality >= 1.5) return 'Poor'
    return 'Lost'
  }

  function getConnectionQualityColor(quality: number) {
    if (quality >= 3.5) return 'text-green-400'
    if (quality >= 2.5) return 'text-yellow-400'
    if (quality >= 1.5) return 'text-orange-400'
    return 'text-red-400'
  }

  const renderParticipant = (u: User) => (
    <div key={u.id} className={`flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-zinc-800 transition-colors relative ${u.isSpeaking ? 'ring-1 ring-indigo-500/50' : ''}`}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 relative" style={{ backgroundColor: u.color || '#6366f1' }}>
        <span className="text-xs font-medium text-white">{u.name[0]}</span>
        {(u.connectionQuality !== undefined && u.connectionQuality > 0) && (
          <div className="absolute -bottom-1 -right-1 bg-zinc-900 rounded-full p-0.5">
            {getConnectionQualityIcon(u.connectionQuality)}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium truncate block" style={{ color: u.color }}>
          {u.name}{u.id === localIdentity ? ' (You)' : ''}{u.isHost ? ' · Host' : ''}
        </span>
        <div className="flex items-center gap-1.5 mt-1">
          {u.micOn ? <Mic size={10} className="text-green-400 shrink-0" /> : <MicOff size={10} className="text-red-400 shrink-0" />}
          {u.camOn ? <Video size={10} className="text-green-400 shrink-0" /> : <VideoOff size={10} className="text-red-400 shrink-0" />}
          {u.isSharing && <MonitorUp size={10} className="text-emerald-400 shrink-0" />}
          {u.micOn && <AudioLevelBar level={u.audioLevel} isSpeaking={u.isSpeaking} />}
          {u.connectionQuality !== undefined && (
            <span className={`text-[10px] font-medium ${getConnectionQualityColor(u.connectionQuality)}`}>
              {getConnectionQualityText(u.connectionQuality)}
            </span>
          )}
        </div>
      </div>
      {u.id !== localIdentity && isLocalHost && (
        <div className="absolute top-1 right-1">
          <button
            ref={menuBtnRef}
            onClick={() => openMenu(u.id, menuBtnRef.current!)}
            className="p-1 rounded-lg bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
          >
            <MoreVertical size={12} />
          </button>
        </div>
      )}
      {showMenuFor === u.id && isLocalHost && createPortal(
        <div className="fixed z-[100] w-[180px] bg-zinc-900 border border-zinc-700 rounded-xl p-2 shadow-2xl flex flex-col gap-1.5" style={{ top: menuPos.top, left: menuPos.left }}>
          <button onClick={() => { handleMute(u); setShowMenuFor(null); }} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors text-red-400">
            <VolumeX size={14} /> {u.micOn ? 'Mute' : 'Unmute'}
          </button>
          <button onClick={() => { handleDisableCam(u); setShowMenuFor(null); }} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors text-orange-400">
            <VideoSlash size={14} /> {u.camOn ? 'Disable Camera' : 'Enable Camera'}
          </button>
          {u.handRaised && (
            <button onClick={() => { handleLowerHand(u); setShowMenuFor(null); }} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors text-yellow-400">
              <Hand size={14} /> Lower Hand
            </button>
          )}
          <button onClick={() => { handleRemove(u); setShowMenuFor(null); }} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors text-red-500">
            <UserX size={14} /> Remove
          </button>
        </div>,
        document.body
      )}
    </div>
  )

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-2">
      {raisedHands.length > 0 && (
        <div className="mb-2 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-xl">
          <h4 className="text-xs uppercase tracking-widest text-yellow-400 mb-2">Raised Hands</h4>
          {raisedHands.map(renderParticipant)}
        </div>
      )}

      {others.length === 0 && raisedHands.length === 0 && (
        <p className="text-xs text-zinc-500 text-center py-8">No participants yet</p>
      )}

      {others.map(renderParticipant)}
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
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showImageUpload, setShowImageUpload] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return

    const reader = new FileReader()
    reader.onload = () => {
      onInputChange(`${input}[img:${reader.result}]`)
    }
    reader.readAsDataURL(file)
    setShowImageUpload(false)
  }

  const insertEmoji = (emoji: string) => {
    onInputChange(input + emoji)
    inputRef.current?.focus()
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 flex flex-col gap-2">
        {messages.length === 0 && (
          <p className="text-xs text-zinc-500 text-center py-8">No messages yet. Say hello!</p>
        )}
        {messages.map(msg => (
          <div key={msg.id} className="flex flex-col gap-0.5 shrink-0">
            <span className="text-xs text-zinc-500">
              {msg.sender}{' '}
              <span className="text-zinc-700">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </span>
            <p className="text-xs break-words whitespace-pre-wrap p-2 bg-zinc-800/50 rounded-lg">
              {msg.isImage ? (
                <img src={msg.content} alt="Shared image" className="max-w-full rounded-lg" />
              ) : (
                msg.content
              )}
            </p>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-zinc-800 shrink-0">
        {disabled && (
          <p className="text-xs text-red-400 mb-2">Chat has been disabled by the host</p>
        )}
        <div className="relative">
          <div className="flex gap-2 items-end">
            {!disabled && (
              <>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors shrink-0"
                  title="Emojis"
                >
                  <Smile size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowImageUpload(!showImageUpload)}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors shrink-0"
                  title="Upload Image"
                >
                  <Image size={18} />
                </button>
              </>
            )}
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => onInputChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  onSend()
                }
              }}
              placeholder={disabled ? 'Chat disabled' : 'Type a message...'}
              disabled={disabled}
              rows={2}
              className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 focus:border-indigo-500 outline-none text-xs transition-colors disabled:opacity-50 resize-none max-h-28 overflow-y-auto pr-20"
            />
            <button
              onClick={onSend}
              disabled={disabled || !input.trim()}
              className="px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 shrink-0"
            >
              Send
            </button>
          </div>

          {showEmojiPicker && createPortal(
            <div className="fixed z-[100] bg-zinc-900 border border-zinc-700 rounded-xl p-3 shadow-2xl w-64">
              <div className="flex flex-wrap gap-1">
                {EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => insertEmoji(emoji)}
                    className="w-8 h-8 rounded-lg hover:bg-zinc-800 transition-colors text-xl flex items-center justify-center"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>,
            document.body
          )}

          {showImageUpload && createPortal(
            <div className="fixed z-[100] bg-zinc-900 border border-zinc-700 rounded-xl p-3 shadow-2xl w-56">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full text-xs"
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowImageUpload(false)}
                  className="flex-1 px-2 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>,
            document.body
          )}
        </div>
      </div>
    </div>
  )
}

function ToolsTab({ onToggleWhiteboard, whiteboardOpen }: { onToggleWhiteboard: () => void; whiteboardOpen: boolean }) {
  return (
    <div className="flex-1 min-h-0 p-4">
      <div className="space-y-4">
        <div className="p-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl">
          <h4 className="text-xs font-medium text-zinc-400 mb-3 uppercase tracking-wide">Whiteboard</h4>
          <button
            onClick={onToggleWhiteboard}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              whiteboardOpen 
                ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400' 
                : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <PenTool size={18} />
            <div className="flex-1 text-left">
              <div className="font-medium">{whiteboardOpen ? 'Close Whiteboard' : 'Open Whiteboard'}</div>
              <div className="text-xs text-zinc-500">Collaborative drawing canvas</div>
            </div>
            {whiteboardOpen && <span className="text-xs text-emerald-400">Active</span>}
          </button>
        </div>
        
        <div className="p-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl">
          <h4 className="text-xs font-medium text-zinc-400 mb-3 uppercase tracking-wide">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            <button className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-800 transition-colors flex flex-col items-center gap-1">
              <span className="text-lg">📋</span>
              <span className="text-xs text-zinc-300">Poll</span>
            </button>
            <button className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-800 transition-colors flex flex-col items-center gap-1">
              <span className="text-lg">📊</span>
              <span className="text-xs text-zinc-300">Quiz</span>
            </button>
            <button className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-800 transition-colors flex flex-col items-center gap-1">
              <span className="text-lg">📝</span>
              <span className="text-xs text-zinc-300">Notes</span>
            </button>
            <button className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-800 transition-colors flex flex-col items-center gap-1">
              <span className="text-lg">🔗</span>
              <span className="text-xs text-zinc-300">Share Link</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
