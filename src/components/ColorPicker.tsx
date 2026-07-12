import { useState, useRef, useEffect } from 'react'
import { X, Droplet, Square } from 'lucide-react'
import { USER_COLORS, USER_GRADIENTS, setUserColor } from '../utils/colors'

interface ColorPickerProps {
  userColor: string
  onUserColorChange: (color: string) => void
}

export default function ColorPicker({ userColor, onUserColorChange }: ColorPickerProps) {
  const [activeTab, setActiveTab] = useState<'solid' | 'gradient'>('solid')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        // Don't close immediately, let the parent handle it
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleColorClick = (color: string) => {
    setUserColor(color)
    onUserColorChange(color)
  }

  return (
    <div
      ref={containerRef}
      className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 shadow-2xl w-80 animate-fade-in"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">Choose Color</h3>
        <button onClick={() => onUserColorChange(userColor)} className="p-1 rounded hover:bg-zinc-800"><X size={16} /></button>
      </div>

      <div className="flex gap-2 mb-4 border-b border-zinc-700">
        <button
          onClick={() => setActiveTab('solid')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'solid' ? 'bg-indigo-600/20 text-indigo-400' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Droplet size={12} /> Solid
        </button>
        <button
          onClick={() => setActiveTab('gradient')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'gradient' ? 'bg-indigo-600/20 text-indigo-400' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Square size={12} /> Gradient
        </button>
      </div>

      <div className="max-h-64 overflow-y-auto">
        {activeTab === 'solid' && (
          <div className="grid grid-cols-6 gap-2">
            {USER_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => handleColorClick(color)}
                className={`w-10 h-10 rounded-lg border-2 transition-all ${
                  color === userColor
                    ? 'border-white scale-110 shadow-lg'
                    : 'border-transparent hover:border-zinc-600'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        )}

        {activeTab === 'gradient' && (
          <div className="grid grid-cols-2 gap-2">
            {USER_GRADIENTS.map((gradient, i) => (
              <button
                key={i}
                onClick={() => handleColorClick(gradient)}
                className={`h-16 rounded-lg border-2 transition-all ${
                  gradient === userColor
                    ? 'border-white scale-105 shadow-lg'
                    : 'border-transparent hover:border-zinc-600'
                }`}
                style={{ background: gradient }}
                title={`Gradient ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-zinc-700">
        <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
          <input
            type="color"
            value={userColor.startsWith('#') ? userColor : '#6366f1'}
            onChange={(e) => handleColorClick(e.target.value)}
            className="w-6 h-6 rounded border-0 cursor-pointer"
          />
          <span>Custom Color</span>
        </label>
      </div>
    </div>
  )
}