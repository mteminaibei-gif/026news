export interface HlsCallbacks {
  onPlaying?: () => void
  onError?: (msg: string) => void
  onFatal?: () => void
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

export async function initHlsPlayback(
  video: HTMLVideoElement,
  url: string,
  callbacks?: HlsCallbacks,
): Promise<() => void> {
  // Native HLS (Safari)
  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = url
    video.muted = true
    video.play()
      .then(() => callbacks?.onPlaying?.())
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
    }
    isSupported: () => boolean
  }

  if (!HlsClass.isSupported()) {
    callbacks?.onError?.('HLS not supported in this browser')
    return () => {}
  }

  const hls = new HlsClass({ enableWorker: true, lowLatencyMode: true })
  hls.loadSource(url)
  hls.attachMedia(video)

  hls.on('MANIFEST_PARSED', () => {
    video.muted = true
    video.play()
      .then(() => callbacks?.onPlaying?.())
      .catch(() => {})
  })

  hls.on('ERROR', (_: unknown, data: { fatal: boolean; type?: number }) => {
    if (data.fatal) {
      hls.destroy()
      callbacks?.onFatal?.()
    }
  })

  return () => { hls.destroy() }
}

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

    // If initHlsPlayback succeeded synchronously (native HLS), retries won't happen
    // For hls.js, fatal errors are handled inside the callbacks above
    return () => { currentCleanup?.() }
  }

  return tryPlay()
}
