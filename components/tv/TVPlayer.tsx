'use client'

import { useEffect, useRef } from 'react'
import type { TVStation } from '@/lib/tv/stations'

interface Props {
  station: TVStation
  isPlaying: boolean
}

export function TVPlayer({ station, isPlaying }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (!isPlaying || !videoRef.current) return

    const video = videoRef.current
    let hlsInstance: { destroy: () => void } | null = null

    if (station.embedType === 'hls') {
      const url = station.streamUrl

      // Try native HLS support (Safari)
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url
        video.play().catch(() => {})
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
            on: (event: string, cb: () => void) => void
            destroy: () => void
          }
          isSupported: () => boolean
        }

        if (HlsClass && HlsClass.isSupported()) {
          const hls = new HlsClass({ enableWorker: true, lowLatencyMode: true })
          hls.loadSource(url)
          hls.attachMedia(video)
          hls.on('MANIFEST_PARSED', () => { video.play().catch(() => {}) })
          hlsInstance = hls
        }
      }

      init()
    }

    return () => {
      if (hlsInstance) {
        hlsInstance.destroy()
      }
      video.src = ''
    }
  }, [isPlaying, station])

  if (station.embedType === 'iframe') {
    return (
      <iframe
        src={station.streamUrl}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title={`Live: ${station.name}`}
        style={{ border: 'none' }}
      />
    )
  }

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 w-full h-full object-contain bg-black"
      controls
      autoPlay
      playsInline
      muted={false}
    />
  )
}
