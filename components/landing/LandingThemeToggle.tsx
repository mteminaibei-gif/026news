'use client'

import { useTheme } from '@/components/providers/ThemeProvider'
import { Sun, Moon } from 'lucide-react'

export function LandingThemeToggle() {
  const { darkMode, toggleDarkMode } = useTheme()

  return (
    <button
      onClick={toggleDarkMode}
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.15)',
        background: 'rgba(255,255,255,0.08)',
        color: 'rgba(255,255,255,0.85)',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.16)'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
      }}
    >
      {darkMode ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  )
}
