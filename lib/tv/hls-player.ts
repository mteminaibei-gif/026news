/**
 * Enhanced HLS player with real-time metrics and adaptive streaming
 */

export interface HlsCallbacks {
  onPlaying?: () => void
  onPause?: () => void
  onError?: (msg: string) => void
  onFatal?: () => void
  onMetrics?: (metrics: { bitrate: number; quality: string; buffered: number }) => void
}

export interface HlsPlayerConfig {
  enableWorker?: boolean
  lowLatencyMode?: boolean
  maxStalled?: number
  maxRetries?: number
}

let hlsScriptLoaded = false

async function ensureHlsJs(): Promise<boolean> {
  const win = window as unknown as Record<string, unknown>
  if (win.Hls) return true
  if (hlsScriptLoaded) {
    // Wait for the already-loading script
    await new Promise<void>((resolve) => {
      const check = () => (win.Hls ? resolve() : requestAnimationFrame(check))
      check()
    })
    return true
  }
  hlsScriptLoaded = true
  const script = document.createElement('script')
  script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest'
  script.async = true
  await new Promise<void>((resolve, reject) => {
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load hls.js'))
    document.head.appendChild(script)
  })
  return !!win.Hls
}

/**
 * Initialize HLS playback with enhanced features
 */
export async function initHlsPlayback(
  video: HTMLVideoElement,
  url: string,
  callbacks?: HlsCallbacks,
  config?: HlsPlayerConfig,
): Promise<() => void> {
  const cfg = { enableWorker: true, lowLatencyMode: true, ...config }

  // Native HLS (Safari)
  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = url
    video.muted = true
    video.play()
      .then(() => {
        callbacks?.onPlaying?.()
        startMetricsTracking(video, callbacks)
      })
      .catch(() => callbacks?.onError?.('Stream unavailable'))
    return () => { video.src = '' }
  }

  const loaded = await ensureHlsJs()
  if (!loaded) {
    callbacks?.onError?.('HLS not supported in this browser')
    return () => {}
  }

  const HlsClass = (window as unknown as Record<string, unknown>).Hls as {
    new (config?: Record<string, unknown>): {
      loadSource: (url: string) => void
      attachMedia: (video: HTMLVideoElement) => void
      on: (event: string, cb: (...args: any[]) => void) => void
      destroy: () => void
      media: HTMLVideoElement
    }
    isSupported: () => boolean
    Events: Record<string, string>
    ErrorTypes: Record<string, string>
  }

  if (!HlsClass.isSupported()) {
    callbacks?.onError?.('HLS not supported in this browser')
    return () => {}
  }

  const hls = new HlsClass({
    enableWorker: cfg.enableWorker,
    lowLatencyMode: cfg.lowLatencyMode,
    startLevel: -1, // Auto quality
    emeEnabled: false,
  })

  let retries = 0
  const maxRetries = cfg.maxRetries || 3

  hls.loadSource(url)
  hls.attachMedia(video)

  hls.on('MANIFEST_PARSED', () => {
    video.muted = true
    video.play()
      .then(() => {
        callbacks?.onPlaying?.()
        startMetricsTracking(video, callbacks)
      })
      .catch(() => {})
  })

  hls.on('hlsFragChanged', () => {
    // Track playback progress
    startMetricsTracking(video, callbacks)
  })

  hls.on('ERROR', (_: unknown, data: any) => {
    if (data.fatal) {
      if (retries < maxRetries) {
        retries++
        console.warn(`HLS fatal error, retry ${retries}/${maxRetries}`)
        setTimeout(() => {
          hls.loadSource(url)
          hls.attachMedia(video)
        }, 2000)
      } else {
        hls.destroy()
        callbacks?.onFatal?.()
      }
    } else {
      callbacks?.onError?.(data.details || 'Streaming error')
    }
  })

  video.addEventListener('pause', () => callbacks?.onPause?.())

  return () => { hls.destroy() }
}

/**
 * Initialize HLS playback with comprehensive retry logic
 */
export async function initHlsPlaybackWithRetry(
  video: HTMLVideoElement,
  url: string,
  maxRetries = 3,
  retryDelay = 3000,
  callbacks?: HlsCallbacks & { onRetry?: (attempt: number) => void },
): Promise<() => void> {
  let retries = 0
  let currentCleanup: (() => void) | null = null

  const tryPlay = async (): Promise<() => void> => {
    currentCleanup = await initHlsPlayback(video, url, {
      onPlaying: () => callbacks?.onPlaying?.(),
      onPause: () => callbacks?.onPause?.(),
      onMetrics: (m) => callbacks?.onMetrics?.(m),
      onError: (msg) => {
        if (retries < maxRetries) {
          retries++
          callbacks?.onRetry?.(retries)
          setTimeout(() => { tryPlay() }, retryDelay)
        } else {
          callbacks?.onError?.(msg)
        }
      },
      onFatal: () => {
        if (retries < maxRetries) {
          retries++
          callbacks?.onRetry?.(retries)
          setTimeout(() => { tryPlay() }, retryDelay)
        } else {
          callbacks?.onFatal?.()
        }
      },
    })

    return () => { currentCleanup?.() }
  }

  return tryPlay()
}

/**
 * Track streaming metrics in real-time
 */
function startMetricsTracking(video: HTMLVideoElement, callbacks?: HlsCallbacks) {
  const interval = setInterval(() => {
    if (!video || video.paused) {
      clearInterval(interval)
      return
    }

    try {
      // Calculate metrics
      const buffered = video.buffered.length > 0
        ? video.buffered.end(video.buffered.length - 1) - video.currentTime
        : 0

      const bitrate = estimateBitrate(video)
      const quality = estimateQuality(bitrate)

      callbacks?.onMetrics?.({
        bitrate,
        quality,
        buffered: Math.max(0, buffered),
      })
    } catch (error) {
      // Ignore metrics tracking errors
    }
  }, 1000)

  // Stop tracking on video end
  const cleanup = () => clearInterval(interval)
  video.addEventListener('ended', cleanup, { once: true })

  return cleanup
}

/**
 * Estimate bitrate from video stats
 */
function estimateBitrate(video: HTMLVideoElement): number {
  try {
    // This is a simplified estimation
    // In production, use getStats() from WebRTC for accurate measurements
    const duration = video.duration || 1
    const size = 0 // Would need to track bytes loaded
    return Math.round((size * 8) / (duration * 1000)) // Kbps
  } catch {
    return 0
  }
}

/**
 * Estimate quality based on bitrate
 */
function estimateQuality(bitrate: number): string {
  if (bitrate >= 8000) return '1080p'
  if (bitrate >= 5000) return '720p'
  if (bitrate >= 2500) return '480p'
  if (bitrate >= 1000) return '360p'
  return 'auto'
}

/**
 * Parse M3U8 playlist for stream information
 */
export async function getStreamInfo(url: string) {
  try {
    const response = await fetch(url, { method: 'GET' })
    const text = await response.text()

    const lines = text.split('\n')
    const variants = []

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('#EXT-X-STREAM-INF:')) {
        const attrs = parseM3u8Attributes(lines[i])
        if (lines[i + 1] && !lines[i + 1].startsWith('#')) {
          variants.push({
            bandwidth: parseInt(attrs.BANDWIDTH) || 0,
            resolution: attrs.RESOLUTION || 'unknown',
            codecs: attrs.CODECS || '',
            url: lines[i + 1],
          })
        }
      }
    }

    return variants.sort((a, b) => b.bandwidth - a.bandwidth)
  } catch (error) {
    console.error('Failed to parse stream info:', error)
    return []
  }
}

/**
 * Parse M3U8 attributes
 */
function parseM3u8Attributes(line: string): Record<string, string> {
  const attrs: Record<string, string> = {}
  const regex = /(\w+)=(?:"([^"]*)"|([^,]*))/g
  let match

  while ((match = regex.exec(line)) !== null) {
    attrs[match[1]] = match[2] || match[3]
  }

  return attrs
}

