'use client'

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
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

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const hlsRef = useRef<{ destroy: () => void } | null>(null)

  const cleanupHLS = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }
  }

  const playStation = async (station: TVStation) => {
    const video = videoRef.current
    if (!video) return

    if (currentStation?.id === station.id) {
      toggle()
      return
    }

    cleanupHLS()
    setCurrentStation(station)
    setStatus('loading')
    setError(null)

    if (station.embedType === 'hls') {
      const url = station.streamUrl

      // Try native HLS support (Safari)
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url
        video.muted = true
        try {
          await video.play()
          setIsPlaying(true)
          setStatus('playing')
        } catch {
          setStatus('error')
          setError('Stream unavailable — try another station')
          setIsPlaying(false)
        }
        return
      }

      // Use hls.js for other browsers
      const initHLS = async () => {
        const win = window as unknown as Record<string, unknown>
        if (!win.Hls) {
          const script = document.createElement('script')
          script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest'
          script.async = true
          await new Promise<void>((resolve) => {
            script.onload = () => resolve()
            document.head.appendChild(script)
          })
        }

        const HlsClass = (window as unknown as Record<string, unknown>).Hls as {
          new (config?: Record<string, unknown>): {
            loadSource: (url: string) => void
            attachMedia: (video: HTMLVideoElement) => void
            on: (event: string, cb: () => void) => void
            destroy: () => void
          }
          isSupported: () => boolean
        }

        if (HlsClass && HlsClass.isSupported()) {
          const hls = new HlsClass({ enableWorker: true, lowLatencyMode: true })
          hls.loadSource(url)
          hls.attachMedia(video)
          hls.on('MANIFEST_PARSED', () => {
            video.muted = true
            video.play().catch(() => {})
          })
          hlsRef.current = hls
        }
      }

      initHLS()
    } else if (station.embedType === 'iframe') {
      // For iframe stations, we handle via the widget
      setIsPlaying(true)
      setStatus('playing')
    }
  }

  const toggle = () => {
    const video = videoRef.current
    if (!video || !currentStation) return

    if (currentStation.embedType === 'iframe') {
      // For iframe stations, toggle the widget visibility
      setIsPlaying(prev => !prev)
      return
    }

    if (isPlaying) {
      video.pause()
      setIsPlaying(false)
      setStatus('idle')
    } else {
      setStatus('loading')
      video.play().catch(() => {
        setStatus('error')
        setError('Stream unavailable — try another station')
        setIsPlaying(false)
      })
    }
  }

  const stop = () => {
    const video = videoRef.current
    if (video) {
      video.pause()
      video.src = ''
    }
    cleanupHLS()
    setIsPlaying(false)
    setCurrentStation(null)
    setStatus('idle')
    setError(null)
  }

  // Handle video events for HLS
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onPlay = () => { setIsPlaying(true); setStatus('playing') }
    const onPause = () => { setIsPlaying(false); setStatus('idle') }
    const onError = () => { setStatus('error'); setError('Stream error'); setIsPlaying(false) }
    const onWaiting = () => { setStatus('loading') }
    const onPlaying = () => { setIsPlaying(true); setStatus('playing') }

    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('error', onError)
    video.addEventListener('waiting', onWaiting)
    video.addEventListener('playing', onPlaying)

    return () => {
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('error', onError)
      video.removeEventListener('waiting', onWaiting)
      video.removeEventListener('playing', onPlaying)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupHLS()
    }
  }, [])

  return (
    <TVContext.Provider value={{
      currentStation,
      isPlaying,
      status,
      error,
      playStation,
      toggle,
      stop,
    }}>
      {children}
      <TVWidget />
      <video
        ref={videoRef}
        style={{ display: 'none' }}
        playsInline
        muted
        preload="none"
      />
    </TVContext.Provider>
  )
}