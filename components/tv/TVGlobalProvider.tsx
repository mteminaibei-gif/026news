'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import type { TVStation } from '@/lib/tv/stations'
import { TVWidget } from './TVWidget'

interface TVContextValue {
  currentStation: TVStation | null
  isPlaying: boolean
  status: 'idle' | 'loading' | 'playing' | 'error'
  error: string | null
  playStation: (station: TVStation) => void
  toggle: () => void
  stop: () => void
  setStatus: (s: 'idle' | 'loading' | 'playing' | 'error') => void
  setError: (e: string | null) => void
}

const TVContext = createContext<TVContextValue | null>(null)

export function useTVGlobal() {
  const ctx = useContext(TVContext)
  if (!ctx) throw new Error('useTVGlobal must be used within <TVGlobalProvider>')
  return ctx
}

export function TVGlobalProvider({ children }: { children: ReactNode }) {
  const [currentStation, setCurrentStation] = useState<TVStation | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const playStation = (station: TVStation) => {
    if (currentStation?.id === station.id) {
      toggle()
      return
    }
    setCurrentStation(station)
    setIsPlaying(true)
    setStatus('loading')
    setError(null)
  }

  const toggle = () => {
    setIsPlaying(prev => {
      if (prev) {
        setStatus('idle')
      }
      return !prev
    })
  }

  const stop = () => {
    setIsPlaying(false)
    setCurrentStation(null)
    setStatus('idle')
    setError(null)
  }

  return (
    <TVContext.Provider value={{
      currentStation,
      isPlaying,
      status,
      error,
      playStation,
      toggle,
      stop,
      setStatus,
      setError,
    }}>
      {children}
      <TVWidget />
    </TVContext.Provider>
  )
}
