'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useTVGlobal } from './TVGlobalProvider'
import { useRadio } from '@/components/radio/RadioProvider'
import { usePathname } from 'next/navigation'
import { RefreshCw, Shuffle } from 'lucide-react'
import { ALL_TV_STATIONS } from '@/lib/tv/stations'

export function TVWidget() {
  const { currentStation, isPlaying, status, error, stop, playStation, setStatus, setError } = useTVGlobal()
  const { currentStation: currentRadioStation, isPlaying: isRadioPlaying } = useRadio()
  const [minimized, setMinimized] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<{ destroy: () => void } | null>(null)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pathname = usePathname()

  const isTVPage = pathname === '/tv' || pathname.startsWith('/tv/')

  useEffect(() => {
    if (!videoRef.current) {
      const video = document.createElement('video')
      video.playsInline = true
      video.muted = true
      video.preload = 'none'
      video.style.display = 'none'
      document.body.appendChild(video)
      videoRef.current = video
    }
    return () => {
      if (videoRef.current) {
        videoRef.current.remove()
      }
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    }
  }, [])

  const retry = useCallback(() => {
    if (!currentStation) return
    setRetryCount(c => c + 1)
    setStatus('loading')
    setError(null)
    playStation(currentStation)
  }, [currentStation, playStation, setStatus, setError])

  // Handle HLS playback for the widget
  useEffect(() => {
    const video = videoRef.current
    if (!video || !currentStation || !isPlaying) return

    setRetryCount(0)

    const cleanupHLS = () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }

    if (currentStation.embedType === 'hls') {
      const url = currentStation.streamUrl
      let retries = 0
      const MAX_RETRIES = 3

      const tryNativePlay = () => {
        video.src = url
        video.muted = true
        video.play().then(() => {
          setStatus('playing')
        }).catch(() => {
          if (retries < MAX_RETRIES) {
            retries++
            retryTimerRef.current = setTimeout(tryNativePlay, 3000)
          } else {
            setStatus('error')
            setError('Stream unavailable')
          }
        })
      }

      // Try native HLS support (Safari)
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        tryNativePlay()
        return
      }

      // Use hls.js for other browsers
      const init = async () => {
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
            on: (event: string, cb: (...args: any[]) => void) => void
            destroy: () => void
          }
          isSupported: () => boolean
        }

        if (HlsClass && HlsClass.isSupported()) {
          const attemptPlay = () => {
            const hls = new HlsClass({ enableWorker: true, lowLatencyMode: true })
            hls.loadSource(url)
            hls.attachMedia(video)
            hls.on('MANIFEST_PARSED', () => {
              video.muted = true
              video.play().then(() => {
                setStatus('playing')
              }).catch(() => {})
            })
            hls.on('ERROR', (_: unknown, data: { fatal: boolean; type?: number }) => {
              if (data.fatal) {
                if (retries < MAX_RETRIES) {
                  retries++
                  hls.destroy()
                  retryTimerRef.current = setTimeout(attemptPlay, 3000)
                } else {
                  setStatus('error')
                  setError('Stream ended or unavailable')
                }
              }
            })
            hlsRef.current = hls
          }
          attemptPlay()
        } else {
          setStatus('error')
          setError('HLS not supported in this browser')
        }
      }

      init()
    } else if (currentStation.embedType === 'iframe') {
      setStatus('playing')
    }

    return () => {
      cleanupHLS()
      video.src = ''
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current)
        retryTimerRef.current = null
      }
    }
  }, [currentStation, isPlaying, playStation])

  if (!currentStation || isTVPage) return null

  // Calculate position: if radio is playing, place TV above it
  const isRadioActive = currentRadioStation && isRadioPlaying
  const bottomOffset = isRadioActive ? 120 : 16

  return (
    <div
      className="fixed z-50 shadow-2xl transition-all duration-300"
      style={{
        bottom: minimized ? bottomOffset : bottomOffset,
        right: 16,
        width: minimized ? 200 : 420,
        maxWidth: 'calc(100vw - 32px)',
        borderRadius: 16,
        overflow: 'hidden',
        background: '#000',
        border: `2px solid ${currentStation.color}`,
      }}
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ background: currentStation.color }}
      >
        <div className="flex items-center gap-2">
          <span style={{ fontSize: '1rem' }}>{currentStation.logo}</span>
          <span className="text-white font-bold text-sm truncate">{currentStation.name}</span>
          <span className="flex items-center gap-1 text-white/80 text-[10px] font-bold uppercase">
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${status === 'playing' ? 'bg-white' : 'bg-yellow-300'}`} />
            {status === 'playing' ? 'LIVE' : status === 'loading' ? 'LOADING' : 'PAUSED'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(!minimized)}
            className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xs transition-colors"
            aria-label={minimized ? 'Expand' : 'Minimize'}
          >
            {minimized ? '⤢' : '⤡'}
          </button>
          <button
            onClick={stop}
            className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xs transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Video embed */}
      {isPlaying && !minimized && currentStation.embedType === 'iframe' && (
        <div className="relative" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={currentStation.streamUrl}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={`Live: ${currentStation.name}`}
          />
        </div>
      )}

      {isPlaying && !minimized && currentStation.embedType === 'hls' && (
        <div className="relative" style={{ paddingBottom: '56.25%' }}>
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-contain bg-black"
            controls
            autoPlay
            playsInline
            muted
          />
        </div>
      )}

      {/* Minimized thumbnail */}
      {isPlaying && minimized && (
        <div
          className="relative flex items-center justify-center"
          style={{ height: 80, background: `linear-gradient(135deg, ${currentStation.color} 0%, ${currentStation.color}88 100%)` }}
        >
          <span style={{ fontSize: '2rem' }}>📺</span>
          <div className="absolute bottom-1 left-2 text-white/80 text-[10px] font-semibold">
            {currentStation.genre}
          </div>
        </div>
      )}

      {/* Station info bar */}
      {!minimized && (
        <div className="px-3 py-2" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)' }}>
          <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{currentStation.name}</p>
          <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
            {currentStation.genre}
            {status === 'loading' && <span className="text-yellow-400 ml-1">(Connecting...)</span>}
          </p>
          {status === 'error' && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-red-400">({error})</span>
              <button onClick={retry}
                className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'var(--primary)', color: '#fff' }}>
                <RefreshCw size={10} /> Retry
              </button>
              <button onClick={() => { const others = ALL_TV_STATIONS.filter(s => s.id !== currentStation.id); if (others.length) playStation(others[Math.floor(Math.random() * others.length)]) }}
                className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
                <Shuffle size={10} /> Try Another
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
