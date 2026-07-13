import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Initialize theme and font size from localStorage
const savedTheme = localStorage.getItem('theme')
if (savedTheme && savedTheme !== 'dark') {
  document.documentElement.classList.add(`theme-${savedTheme}`)
}

const savedFontSize = localStorage.getItem('fontSize')
if (savedFontSize) {
  document.documentElement.style.setProperty('--font-size-base', savedFontSize + 'rem')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
