'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import type { TVStation } from '@/lib/tv/stations'
import { TVWidget } from './TVWidget'

interface TVContextValue {
  currentStation: TVStation | null
  isPlaying: boolean
  playStation: (station: TVStation) => void
  stop: () => void
}

const TVContext = createContext<TVContextValue | null>(null)

export function useTV() {
  const ctx = useContext(TVContext)
  if (!ctx) throw new Error('useTV must be used within <TVProvider>')
  return ctx
}

export function TVProvider({ children }: { children: ReactNode }) {
  const [currentStation, setCurrentStation] = useState<TVStation | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const playStation = (station: TVStation) => {
    if (currentStation?.id === station.id) {
      setIsPlaying(prev => !prev)
      return
    }
    setCurrentStation(station)
    setIsPlaying(true)
  }

  const stop = () => {
    setCurrentStation(null)
    setIsPlaying(false)
  }

  return (
    <TVContext.Provider value={{ currentStation, isPlaying, playStation, stop }}>
      {children}
      <TVWidget />
    </TVContext.Provider>
  )
}
