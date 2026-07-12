interface HostControlRowProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export default function HostControlRow({ label, checked, onChange }: HostControlRowProps) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-text-secondary">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`w-8 h-4 rounded-full transition-colors relative ${checked ? 'bg-haze-500' : 'bg-bg-elevated'}`}
      >
        <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}
