import { useState, useEffect, useRef, useMemo, forwardRef } from 'react'
import type { User, ChatMessage, SidebarTab, HostSettings } from '../types'
import { Mic, MicOff, Video, VideoOff, MonitorUp, MessageSquare, Users, Smile, PenTool, Hand, MoreHorizontal, VolumeX, Trash2, X, Pin, EarOff } from 'lucide-react'
import { WaveformDots } from './AudioVisualizer'

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
  hostSettings: HostSettings
  onUpdateHostSettings: (settings: HostSettings) => void
  onClose: () => void
  onSidebarTabChange?: (tab: SidebarTab) => void
  pinnedParticipantId?: string | null
  pinParticipant?: (identity: string) => void
  unpinParticipant?: (identity: string) => void
}

const Sidebar = forwardRef<HTMLDivElement, SidebarProps>(function Sidebar({
  users, localIdentity, messages, tab, onTabChange, chatDisabled, onSendMessage,
  isLocalHost, onBroadcastHostAction, onToggleWhiteboard, whiteboardOpen,
  hostSettings, onUpdateHostSettings, onClose,
  pinnedParticipantId, pinParticipant, unpinParticipant
}, ref) {
  const [input, setInput] = useState('')

  const send = () => {
    if (!input.trim() || chatDisabled) return
    onSendMessage(input.trim())
    setInput('')
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          const reader = new FileReader()
          reader.onload = () => {
            const base64 = reader.result as string
            // Send image as a special message
            onSendMessage(`[IMAGE:${base64}]`)
          }
          reader.readAsDataURL(file)
        }
      }
    }
  }

  return (
    <div ref={ref} className="w-80 glass border-r border-border-primary flex flex-col h-full min-h-0 shrink-0 z-40">
      <div className="flex items-center justify-between p-2 gap-1 border-b border-border-primary shrink-0">
        <div className="flex items-center gap-1 flex-1">
          <button onClick={() => onTabChange('participants')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${tab === 'participants' ? 'bg-bg-tertiary text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'}`}>
            <Users size={14} /> Participants ({users.length})
          </button>
          <button onClick={() => onTabChange('chat')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${tab === 'chat' ? 'bg-bg-tertiary text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'}`}>
            <MessageSquare size={14} /> Chat
          </button>
          <button onClick={() => onTabChange('tools')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${tab === 'tools' ? 'bg-bg-tertiary text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'}`}>
            <PenTool size={14} /> Tools
          </button>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors" title="Close sidebar">
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        {tab === 'participants' ? (
          <ParticipantsTab
            users={users}
            localIdentity={localIdentity}
            isLocalHost={isLocalHost}
            onBroadcastHostAction={onBroadcastHostAction}
            pinnedParticipantId={pinnedParticipantId}
            pinParticipant={pinParticipant}
            unpinParticipant={unpinParticipant}
          />
        ) : tab === 'chat' ? (
          <ChatTab messages={messages} onSend={send} input={input} onInputChange={setInput} disabled={chatDisabled} onPaste={handlePaste} users={users} localIdentity={localIdentity} />
        ) : (
          <ToolsTab 
            onToggleWhiteboard={onToggleWhiteboard} 
            whiteboardOpen={whiteboardOpen}
            isLocalHost={isLocalHost}
            hostSettings={hostSettings}
            onUpdateHostSettings={onUpdateHostSettings}
          />
        )}
      </div>
    </div>
  )
})
export default Sidebar

function ParticipantsTab({
  users, localIdentity, isLocalHost, onBroadcastHostAction,
  pinnedParticipantId, pinParticipant, unpinParticipant
}: {
  users: User[]; localIdentity: string;
  isLocalHost: boolean;
  onBroadcastHostAction: (action: string) => void;
  pinnedParticipantId?: string | null;
  pinParticipant?: (identity: string) => void;
  unpinParticipant?: (identity: string) => void;
}) {
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const menuBtnRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  // Sort users: pinned first, then others, with current user always at the end
  const sortedUsers = useMemo(() => {
    const pinned = users.filter(user => pinnedParticipantId && user.id === pinnedParticipantId && !user.isLocal)
    const unpinned = users.filter(user => !(pinnedParticipantId && user.id === pinnedParticipantId) && !user.isLocal)
    const current = users.filter(user => user.isLocal)

    // Sort alphabetically by name
    pinned.sort((a: User, b: User) => a.name.localeCompare(b.name))
    unpinned.sort((a: User, b: User) => a.name.localeCompare(b.name))

    return [...pinned, ...unpinned, ...current]
  }, [users, pinnedParticipantId])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Host controls menu component with proper positioning
  const HostControlsMenu = ({ isPinned, onClose, onAction, onTogglePin, onUnpin, buttonRef }: {
    isPinned: boolean
    onClose: () => void
    onAction: (action: string) => void
    onTogglePin: () => void
    onUnpin: () => void
    buttonRef: React.RefObject<HTMLButtonElement | null>
  }) => {
    const [position, setPosition] = useState({ top: 0, left: 0 })

    useEffect(() => {
      const btn = buttonRef.current
      if (!btn) return
      const rect = btn.getBoundingClientRect()
      const menuWidth = 224
      const menuHeight = 180
      
      let left = rect.left
      let top = rect.bottom + 4
      
      if (left + menuWidth > window.innerWidth) {
        left = window.innerWidth - menuWidth - 8
      }
      if (left < 8) {
        left = 8
      }
      // Check if menu would go off bottom of screen
      if (top + menuHeight > window.innerHeight) {
        top = rect.top - menuHeight - 4
      }
      // Check if menu would go off top of screen
      if (top < 0) {
        top = 8
      }
      
      setPosition({ top, left })
    }, [buttonRef])

    return (
      <div
        className="fixed z-[9999] glass-strong rounded-xl p-1 shadow-2xl min-w-[160px] animate-fade-in"
        style={position}
      >
        <div className="px-2 py-1 text-xs font-medium text-text-muted uppercase tracking-wide">Host Controls</div>
        <button onClick={() => { onAction('muteParticipant'); onClose() }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors">
          <VolumeX size={14} className="text-accent-warning" />
          Mute
        </button>
        <button onClick={() => { onAction('deafenParticipant'); onClose() }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors">
          <EarOff size={14} className="text-accent-warning" />
          Deafen
        </button>
        <button onClick={() => { onAction('disableVideo'); onClose() }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors">
          <VideoOff size={14} className="text-accent-warning" />
          Turn off Camera
        </button>
        <button onClick={() => { onAction('removeParticipant'); onClose() }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-accent-error hover:bg-accent-error/10 rounded-lg transition-colors">
          <Trash2 size={14} />
          Remove
        </button>
        {!isPinned && (
          <button onClick={onTogglePin} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors">
            <Pin size={14} className="text-accent-success" />
            Pin
          </button>
        )}
        {isPinned && (
          <button onClick={onUnpin} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors">
            <Pin size={14} className="text-accent-warning" />
            Unpin
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
      {sortedUsers.map(user => {
        const isCurrent = user.id === localIdentity
        const initials = user.name.split(' ').slice(0, 2).map(n => n[0]).join('')
        const userColor = user.color || '#6366f1'
        const isMenuOpen = openMenu === user.id
        const isPinned = pinnedParticipantId === user.id

        const handleHostAction = (action: string) => {
          onBroadcastHostAction(`${action}:${user.id}`)
          setOpenMenu(null)
        }

        return (
          <div key={user.id} className="relative" ref={isMenuOpen ? menuRef : undefined}>
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-bg-tertiary transition-colors">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{backgroundColor: userColor}}>
                <span className="text-sm font-medium text-white">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-sm font-medium truncate" style={{color: userColor}}>{user.name}{isCurrent ? ' (You)' : ''}</span>
                  {user.handRaised && <Hand size={12} className="text-accent-warning flex-shrink-0" />}
                  {user.isDeafened && <EarOff size={12} className="text-accent-error flex-shrink-0" />}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                  {user.micOn ? <Mic size={10} className="text-accent-success" /> : <MicOff size={10} className="text-accent-error" />}
                  {user.camOn ? <Video size={10} className="text-accent-success" /> : <VideoOff size={10} className="text-accent-error" />}
                  {user.isSharing && <MonitorUp size={10} className="text-accent-success" />}
                  {user.audioLevel > 5 && user.micOn && <WaveformDots level={user.audioLevel} isSpeaking={user.isSpeaking} className="ml-1" />}
                </div>
              </div>
              {!isCurrent && isLocalHost && (
                <div className="relative">
                  <button
                    ref={menuBtnRef}
                    onClick={() => setOpenMenu(isMenuOpen ? null : user.id)}
                    className="p-1.5 rounded-lg hover:bg-bg-tertiary transition-colors text-text-muted hover:text-text-primary"
                    title="Host controls"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                  {isMenuOpen && (
                    <HostControlsMenu
                      buttonRef={menuBtnRef}
                      isPinned={isPinned}
                      onClose={() => setOpenMenu(null)}
                      onAction={handleHostAction}
                      onTogglePin={() => {
                        pinParticipant?.(user.id)
                        onBroadcastHostAction(`pinParticipant:${user.id}`)
                        setOpenMenu(null)
                      }}
                      onUnpin={() => {
                        unpinParticipant?.(user.id)
                        onBroadcastHostAction(`unpinParticipant:${user.id}`)
                        setOpenMenu(null)
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        )})}
      </div>
  )
}

function ChatTab({ messages, onSend, input, onInputChange, disabled, onPaste, users, localIdentity }: { messages: ChatMessage[]; onSend: () => void; input: string; onInputChange: (v: string) => void; disabled?: boolean; onPaste?: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void; users: User[]; localIdentity: string }) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [showMentionPicker, setShowMentionPicker] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const emojiBtnRef = useRef<HTMLButtonElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const mentionRef = useRef<HTMLDivElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const userScrolledRef = useRef(false)
  const scrollBtnRef = useRef<HTMLButtonElement | null>(null)

  // Filter users for mention (max 10)
  const mentionableUsers = users
    .filter(u => u.id !== localIdentity)
    .slice(0, 10)
    .filter(u => u.name.toLowerCase().includes(mentionQuery.toLowerCase()))

  useEffect(() => {
    if (!showEmojiPicker) return
    const close = (e: MouseEvent) => {
      if (emojiBtnRef.current?.contains(e.target as Node) || inputRef.current?.contains(e.target as Node)) return
      setShowEmojiPicker(false)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [showEmojiPicker])

  // Handle @mentions - detect @ and show picker
  useEffect(() => {
    const atIndex = input.lastIndexOf('@')
    if (atIndex >= 0 && (atIndex === 0 || input[atIndex - 1] === ' ' || input[atIndex - 1] === '\n')) {
      const query = input.slice(atIndex + 1)
      if (query.length > 0 || mentionableUsers.length > 0) {
        setMentionQuery(query)
        setShowMentionPicker(true)
        return
      }
    }
    setShowMentionPicker(false)
  }, [input, mentionableUsers.length])

  // Close mention picker on click outside
  useEffect(() => {
    if (!showMentionPicker) return
    const close = (e: MouseEvent) => {
      if (mentionRef.current?.contains(e.target as Node) || inputRef.current?.contains(e.target as Node)) return
      setShowMentionPicker(false)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [showMentionPicker])

  const selectMention = (user: User) => {
    const atIndex = input.lastIndexOf('@')
    if (atIndex >= 0) {
      const beforeAt = input.slice(0, atIndex)
      onInputChange(`${beforeAt}@${user.name} `)
    }
    setShowMentionPicker(false)
    inputRef.current?.focus()
  }

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })
    userScrolledRef.current = false
    setShowScrollButton(false)
  }

  const handleScroll = () => {
    if (!containerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
    
    if (!isAtBottom && !userScrolledRef.current) {
      userScrolledRef.current = true
    }
    
    // Reset scroll state when user scrolls back to bottom
    if (isAtBottom && userScrolledRef.current) {
      userScrolledRef.current = false
    }
    
    setShowScrollButton(!isAtBottom)
  }

  // Auto-scroll to bottom when new messages arrive (unless user has scrolled up)
  useEffect(() => {
    if (!userScrolledRef.current) {
      scrollToBottom(false)
    }
  }, [messages.length])

  const renderMessageContent = (content: string) => {
    // Check if it's an image message
    if (content.startsWith('[IMAGE:')) {
      const base64 = content.slice(7, -1) // Remove '[IMAGE:' prefix and ']' suffix
      return (
        <div className="mt-1">
          <img
            src={base64}
            alt="Shared image"
            className="max-w-full rounded-lg border border-border-primary cursor-pointer"
            onClick={() => window.open(base64, '_blank')}
          />
        </div>
      )
    }

    // Process mentions in the message content
    const words = content.split(' ');
    const processedWords = words.map(word => {
      // Check if word is a mention (starts with @)
      if (word.startsWith('@') && word.length > 1) {
        const mentionedUsername = word.substring(1);
        // Check if this mentioned user exists in the users list
        const userExists = users.some(user => user.name === mentionedUsername);
        return userExists ? (
          <span
            key={word}
            className="bg-haze-500/20 px-1 rounded-md text-haze-300 hover:bg-haze-500/30 transition-colors"
          >
            {word}
          </span>
        ) : (
          <span key={word}>{word}</span>
        );
      }
      return <span key={word}>{word}</span>;
    });

    return (
      <div className="text-sm whitespace-pre-wrap text-text-primary">
        {processedWords.map((word, index) => (
          <>
            {word}
            {index < processedWords.length - 1 && ' '}
          </>
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin"
        onScroll={handleScroll}
      >
        {messages.map((msg, i) => (
          <div key={i} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-text-primary">{msg.sender}</span>
              <span className="text-xs text-text-muted">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            {renderMessageContent(msg.content)}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button ref={scrollBtnRef}
          onClick={() => scrollToBottom()}
          className="absolute bottom-16 right-3 p-2 rounded-full glass-strong shadow-lg text-text-primary hover:text-haze-400 transition-colors z-10"
          title="Jump to latest messages"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
            <polyline points="6 15 12 21 18 15" />
          </svg>
        </button>
      )}
        <div className="p-3 border-t border-border-primary shrink-0 relative">
        {disabled ? (
          <p className="text-xs text-text-muted text-center py-2">Chat is disabled by host</p>
        ) : (
          <div className="flex items-end gap-2">
            <button ref={emojiBtnRef} onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors text-text-secondary hover:text-text-primary" aria-label="Emoji picker">
              <Smile size={20} />
            </button>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => onInputChange(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
              onPaste={onPaste}
              placeholder="Message..."
              className="input flex-1 resize-none min-h-[44px] max-h-24"
              rows={1}
            />
            <button onClick={onSend} disabled={!input.trim()} className="btn-primary shrink-0">Send</button>
          </div>
        )}
        {showEmojiPicker && (
          <div className="absolute bottom-full mb-2 left-11 glass-strong rounded-xl p-2 shadow-2xl z-50 flex flex-wrap gap-1 max-w-[280px]">
            {EMOJIS.map(emoji => (
              <button key={emoji} onClick={() => { onInputChange(input + emoji); inputRef.current?.focus(); }} className="p-1.5 hover:bg-bg-tertiary rounded-lg transition-colors text-lg">{emoji}</button>
            ))}
          </div>
        )}
        {showMentionPicker && mentionableUsers.length > 0 && (
          <div ref={mentionRef} className="absolute bottom-full mb-2 left-11 glass-strong rounded-xl p-1 shadow-2xl z-50 min-w-[180px] max-w-[240px]">
            {mentionableUsers.map(user => (
              <button
                key={user.id}
                onClick={() => selectMention(user)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-bg-tertiary transition-colors"
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white" style={{ backgroundColor: user.color }}>
                  {user.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                </div>
                <span className="text-text-primary truncate">{user.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ToolsTab({ 
  onToggleWhiteboard, whiteboardOpen, isLocalHost, hostSettings, onUpdateHostSettings 
}: { 
  onToggleWhiteboard: () => void; whiteboardOpen: boolean; isLocalHost: boolean;
  hostSettings: HostSettings; onUpdateHostSettings: (settings: HostSettings) => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
      <div className="p-3 bg-bg-tertiary border border-border-primary rounded-xl">
        <h4 className="text-xs font-medium text-text-muted mb-3 uppercase tracking-wide">Whiteboard</h4>
        <button
          onClick={onToggleWhiteboard}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border ${whiteboardOpen ? 'bg-haze-500/20 border-haze-500/50 text-haze-400' : 'bg-bg-secondary border-border-primary text-text-primary hover:bg-bg-tertiary'}`}
        >
          <PenTool size={18} />
          <div className="flex-1 text-left">
            <div className="font-medium">{whiteboardOpen ? 'Close Whiteboard' : 'Open Whiteboard'}</div>
            <div className="text-xs text-text-muted">Collaborative drawing canvas</div>
          </div>
          {whiteboardOpen && <span className="text-xs text-accent-success">Active</span>}
        </button>
        
        {isLocalHost && whiteboardOpen && (
          <div className="mt-3 pt-3 border-t border-border-primary space-y-2">
            <h5 className="text-xs font-medium text-text-muted">Host Controls</h5>
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={hostSettings.disableWhiteboard}
                onChange={(e) => onUpdateHostSettings({ ...hostSettings, disableWhiteboard: e.target.checked })}
                className="w-4 h-4 accent-haze-500 rounded border-border-primary bg-bg-secondary"
              />
              Prevent participants from starting whiteboard
            </label>
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={hostSettings.disableWhiteboardDrawing}
                onChange={(e) => onUpdateHostSettings({ ...hostSettings, disableWhiteboardDrawing: e.target.checked })}
                className="w-4 h-4 accent-haze-500 rounded border-border-primary bg-bg-secondary"
              />
              Prevent participants from drawing on whiteboard
            </label>
          </div>
        )}
      </div>
      
      <div className="p-3 bg-bg-tertiary border border-border-primary rounded-xl">
        <h4 className="text-xs font-medium text-text-muted mb-3 uppercase tracking-wide">Quick Actions</h4>
        <div className="grid grid-cols-2 gap-2">
          <button className="p-3 rounded-lg bg-bg-secondary border border-border-primary hover:bg-bg-tertiary transition-colors flex flex-col items-center gap-1">
            <span className="text-lg">📋</span>
            <span className="text-xs text-text-secondary">Poll</span>
          </button>
          <button className="p-3 rounded-lg bg-bg-secondary border border-border-primary hover:bg-bg-tertiary transition-colors flex flex-col items-center gap-1">
            <span className="text-lg">📊</span>
            <span className="text-xs text-text-secondary">Quiz</span>
          </button>
          <button className="p-3 rounded-lg bg-bg-secondary border border-border-primary hover:bg-bg-tertiary transition-colors flex flex-col items-center gap-1">
            <span className="text-lg">📝</span>
            <span className="text-xs text-text-secondary">Notes</span>
          </button>
          <button className="p-3 rounded-lg bg-bg-secondary border border-border-primary hover:bg-bg-tertiary transition-colors flex flex-col items-center gap-1">
            <span className="text-lg">🔗</span>
            <span className="text-xs text-text-secondary">Share Link</span>
          </button>
        </div>
      </div>
    </div>
  )
}
