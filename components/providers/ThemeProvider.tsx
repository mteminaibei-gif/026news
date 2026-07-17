'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface ThemeContextType {
  darkMode: boolean
  toggleDarkMode: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('026connet!-dark-mode')
    if (saved === 'true') setDarkMode(true)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem('026connet!-dark-mode', darkMode.toString())
    const html = document.documentElement
    html.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    if (darkMode) {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }, [darkMode, mounted])

  const toggleDarkMode = () => setDarkMode(!darkMode)

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
