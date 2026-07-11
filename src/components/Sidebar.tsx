import { useState } from 'react'
import type { User, ChatMessage } from '../types'
import { INITIAL_CHAT } from '../mockData'
import { Mic, MicOff, Video, VideoOff, MonitorUp, Hand, MessageSquare, Users, X, Ban, UserX } from 'lucide-react'

interface SidebarProps {
  users: User[]
  tab: 'participants' | 'chat'
  onTabChange: (tab: 'participants' | 'chat') => void
  isHost: boolean
  onMute: (userId: string) => void
  onToggleCam: (userId: string) => void
}

export default function Sidebar({ users, tab, onTabChange, isHost }: SidebarProps) {
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
        <ParticipantsTab users={users} isHost={isHost} />
      ) : (
        <ChatTab />
      )}
    </div>
  );
}

function ParticipantsTab({ users, isHost }: { users: User[]; isHost: boolean }) {
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());

  const toggleMenu = (id: string) => {
    const next = new Set(openMenus);
    if (next.has(id)) next.delete(id); else next.add(id);
    setOpenMenus(next);
  };

  const raisedHands = users.filter(u => u.handRaised);
  const others = users.filter(u => !u.handRaised);

  return (
    <div className="flex-1 overflow-y-auto p-2">
      {raisedHands.length > 0 && (
        <div className="mb-2 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-xl">
          <h4 className="text-xs uppercase tracking-widest text-yellow-400 mb-2">Raised Hands</h4>
          {raisedHands.map(u => (
            <div key={u.id} className="flex items-center gap-2 py-1.5">
              <Hand size={14} className="text-yellow-400" />
              <span className="text-xs">{u.name}</span>
            </div>
          ))}
        </div>
      )}

      {others.map(u => (
        <div key={u.id} className="group flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-zinc-800 transition-colors">
          <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
            <span className="text-xs font-medium">{u.name[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium truncate block">{u.name}{u.isHost ? ' (Host)' : ''}</span>
            <div className="flex items-center gap-0.5 mt-0.5">
              {u.micOn ? <Mic size={10} className="text-green-400" /> : <MicOff size={10} className="text-red-400" />}
              {u.camOn ? <Video size={10} className="text-green-400" /> : <VideoOff size={10} className="text-red-400" />}
              {u.isSharing && <MonitorUp size={10} className="text-emerald-400" />}
              {u.handRaised && <Hand size={10} className="text-yellow-400" />}
            </div>
          </div>

          {isHost && !u.isHost && (
            <div className="relative">
              <button onClick={() => toggleMenu(u.id)} className="p-1 rounded-lg hover:bg-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity">
                <X size={14} />
              </button>
              {openMenus.has(u.id) && (
                <div className="absolute right-0 top-8 w-48 bg-zinc-900 border border-zinc-700 rounded-xl p-2 shadow-2xl z-40 flex flex-col">
                  <HostAction icon={MicOff} label="Mute Globally" />
                  <HostAction icon={VideoOff} label="Hide Video" />
                  <HostAction icon={MonitorUp} label="Block Screenshare" />
                  <HostAction icon={Ban} label="Restrict Chat" />
                  <div className="border-t border-zinc-700 my-1" />
                  <HostAction icon={UserX} label="Kick" danger />
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function HostAction({ icon: Icon, label, danger }: { icon: any; label: string; danger?: boolean }) {
  return (
    <button className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg transition-colors ${danger ? 'text-red-400 hover:bg-red-500/10' : 'text-zinc-300 hover:bg-zinc-800' }`}>
      <Icon size={14} /> {label}
    </button>
  );
}

function ChatTab() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT);
  const [input, setInput] = useState('');

  const send = () => {
    if (!input.trim()) return;
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'You',
      content: input.trim(),
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {messages.map(msg => (
          <div key={msg.id} className="flex flex-col gap-0.5">
            <span className="text-xs text-zinc-500">{msg.sender} <span className="text-zinc-700">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></span>
            {msg.isImage || (msg.isLink && /\.(png|jpg|jpeg|gif|webp)/i.test(msg.content)) ? (
              <div className="bg-zinc-800 rounded-lg p-2">
                <div className="w-full h-24 bg-gradient-to-br from-zinc-700 to-zinc-800 rounded flex items-center justify-center">
                  <span className="text-xs text-zinc-500">Image</span>
                </div>
                {!msg.isImage && <span className="text-xs mt-1 text-zinc-400 block">{msg.content}</span>}
              </div>
            ) : msg.isLink || /https?:\/\/[^\s]+/.test(msg.content) ? (
              <p className="text-xs break-words p-2 bg-zinc-800/50 rounded-lg">
                {msg.content.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" class="text-indigo-400 underline">$1</a>')}
              </p>
            ) : (
              <p className="text-xs break-words p-2 bg-zinc-800/50 rounded-lg">{msg.content}</p>
            )}
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-zinc-800">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Type here..."
            className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 focus:border-indigo-500 outline-none text-xs transition-colors"
          />
        </div>
      </div>
    </div>
  );
}
