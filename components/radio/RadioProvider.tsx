'use client'

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { RadioStation } from '@/lib/radio/stations'
import { RadioWidget } from './RadioWidget'

type Status = 'idle' | 'loading' | 'playing' | 'error'

interface RadioContextValue {
  stations: RadioStation[]
  currentStation: RadioStation | null
  isPlaying: boolean
  volume: number
  status: Status
  error: string | null
  playStation: (station: RadioStation) => void
  toggle: () => void
  setVolume: (v: number) => void
  stop: () => void
}

const RadioContext = createContext<RadioContextValue | null>(null)

export function useRadio() {
  const ctx = useContext(RadioContext)
  if (!ctx) throw new Error('useRadio must be used within <RadioProvider>')
  return ctx
}

export function RadioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolumeState] = useState(75)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  // Wire up audio element event listeners once.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = volume / 100

    const onPlay = () => {
      setIsPlaying(true)
      setStatus('playing')
      setError(null)
    }
    const onPause = () => setIsPlaying(false)
    const onWaiting = () => setStatus('loading')
    const onPlaying = () => {
      setIsPlaying(true)
      setStatus('playing')
      setError(null)
    }
    const onError = () => {
      setStatus('error')
      setError('Stream unavailable — try another station')
      setIsPlaying(false)
    }

    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('waiting', onWaiting)
    audio.addEventListener('playing', onPlaying)
    audio.addEventListener('error', onError)

    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('waiting', onWaiting)
      audio.removeEventListener('playing', onPlaying)
      audio.removeEventListener('error', onError)
    }
  }, [])

  const playStation = (station: RadioStation) => {
    const audio = audioRef.current
    if (!audio) return

    if (currentStation?.id === station.id) {
      toggle()
      return
    }

    setCurrentStation(station)
    setStatus('loading')
    setError(null)
    audio.src = station.streamUrl
    audio.volume = volume / 100
    audio.load()
    audio.play().catch(() => {
      setStatus('error')
      setError('Stream unavailable — try another station')
      setIsPlaying(false)
    })
  }

  const toggle = () => {
    const audio = audioRef.current
    if (!audio || !currentStation) return
    if (isPlaying) {
      audio.pause()
    } else {
      setStatus('loading')
      audio.play().catch(() => {
        setStatus('error')
        setError('Stream unavailable — try another station')
        setIsPlaying(false)
      })
    }
  }

  const setVolume = (v: number) => {
    setVolumeState(v)
    if (audioRef.current) audioRef.current.volume = v / 100
  }

  const stop = () => {
    const audio = audioRef.current
    if (audio) audio.pause()
    setIsPlaying(false)
    setCurrentStation(null)
    setStatus('idle')
    setError(null)
  }

  const value: RadioContextValue = {
    stations: [],
    currentStation,
    isPlaying,
    volume,
    status,
    error,
    playStation,
    toggle,
    setVolume,
    stop,
  }

  return (
    <RadioContext.Provider value={value}>
      {children}
      <RadioWidget />
      <audio ref={audioRef} preload="none" />
    </RadioContext.Provider>
  )
}
