import { useState } from 'react'

interface HostControlRowProps {
  label: string
  defaultChecked?: boolean
  onClick?: () => void
}

export default function HostControlRow({ label, defaultChecked, onClick }: HostControlRowProps) {
  const [checked, setChecked] = useState(defaultChecked || false)
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-zinc-300">{label}</span>
      <button
        onClick={() => { setChecked(!checked); onClick?.() }}
        className={`w-8 h-4 rounded-full transition-colors relative ${checked ? 'bg-indigo-500' : 'bg-zinc-700'}`}
      >
        <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}
