// Color palette for user avatars/names
export const USER_COLORS = [
  '#e11d48', // rose-600
  '#f43f5e', // rose-500
  '#ec4899', // pink-500
  '#d946ef', // fuchsia-500
  '#a855f7', // purple-500
  '#9333ea', // purple-600
  '#7c3aed', // violet-600
  '#6366f1', // indigo-500
  '#4f46e5', // indigo-600
  '#3b82f6', // blue-500
  '#2563eb', // blue-600
  '#0ea5e9', // sky-500
  '#06b6d4', // cyan-500
  '#0891b2', // cyan-600
  '#14b8a6', // teal-500
  '#0d9488', // teal-600
  '#22c55e', // green-500
  '#16a34a', // green-600
  '#84cc16', // lime-500
  '#65a30d', // lime-600
  '#eab308', // yellow-500
  '#ca8a04', // yellow-600
  '#f97316', // orange-500
  '#ea580c', // orange-600
]

// Gradient options for color picker
export const USER_GRADIENTS = [
  'linear-gradient(135deg, #e11d48 0%, #ec4899 100%)',
  'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
  'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
  'linear-gradient(135deg, #14b8a6 0%, #22c55e 100%)',
  'linear-gradient(135deg, #f97316 0%, #eab308 100%)',
  'linear-gradient(135deg, #ec4899 0%, #f97316 100%)',
  'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  'linear-gradient(135deg, #06b6d4 0%, #14b8a6 100%)',
  'linear-gradient(135deg, #22c55e 0%, #84cc16 100%)',
  'linear-gradient(135deg, #eab308 0%, #f43f5e 100%)',
]

const USER_COLOR_KEY = 'userColor'

// Get user's chosen color from localStorage or generate one
export function getUserColor(userId: string): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(USER_COLOR_KEY)
    if (stored) return stored
  }
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length]
}

// Set user's chosen color in localStorage
export function setUserColor(color: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_COLOR_KEY, color)
  }
}

// Get a less saturated version of a color for backgrounds
export function getDesaturatedColor(color: string, opacity = 0.15): string {
  // Convert hex to rgb
  const hex = color.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

// Get gradient for a user (based on their solid color)
export function getUserGradient(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return USER_GRADIENTS[Math.abs(hash) % USER_GRADIENTS.length]
}