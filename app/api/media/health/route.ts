import { NextRequest, NextResponse } from 'next/server'
import { RADIO_STATIONS } from '@/lib/radio/stations'
import { ALL_TV_STATIONS } from '@/lib/tv/stations'

// In-memory cache (per server instance) — refreshed at most once per 60s.
let cache: { ts: number; radio: Record<string, boolean>; tv: Record<string, boolean> } | null = null
const TTL = 60_000

// YouTube embeds and iframe sources don't respond to HEAD — treat as online.
function isIframeUrl(url: string): boolean {
  return url.includes('youtube.com/embed') || url.includes('youtube-nocookie.com/embed')
}

// Probe direct stream URLs (HLS, Icecast, MP3) with a lightweight request.
async function probe(url: string): Promise<boolean> {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 5000)
    try {
      // For HLS manifests, a small GET is more reliable than HEAD.
      const isHls = url.includes('.m3u8')
      const res = await fetch(url, {
        method: isHls ? 'GET' : 'HEAD',
        signal: ctrl.signal,
        headers: { 'User-Agent': '026connet!-health/1.0' },
        redirect: 'follow',
        ...(isHls && { headers: { Range: 'bytes=0-1023', 'User-Agent': '026connet!-health/1.0' } }),
      })
      clearTimeout(t)
      if (res.status < 400 || res.status === 401 || res.status === 403 || res.status === 405) return true
      if (isHls) return res.status < 500
      // Fallback: tiny ranged GET for audio streams that reject HEAD.
      const ctrl2 = new AbortController()
      const t2 = setTimeout(() => ctrl2.abort(), 5000)
      const res2 = await fetch(url, {
        method: 'GET',
        signal: ctrl2.signal,
        headers: { Range: 'bytes=0-1', 'User-Agent': '026connet!-health/1.0' },
      })
      clearTimeout(t2)
      return res2.status < 500
    } finally {
      clearTimeout(t)
    }
  } catch {
    return false
  }
}

export async function GET(_req: NextRequest) {
  const now = Date.now()
  if (cache && now - cache.ts < TTL) {
    return NextResponse.json(cache)
  }

  // Radio: probe direct stream URLs.
  const radioResults = await Promise.all(
    RADIO_STATIONS.map(async (s) => [s.id, await probe(s.streamUrl)] as const)
  )

  // TV: iframe/YouTube embeds are always online; probe HLS (.m3u8) URLs only.
  const tvResults = await Promise.all(
    ALL_TV_STATIONS.map(async (s) => {
      const url = s.streamUrl
      if (isIframeUrl(url)) return [s.id, true] as const
      return [s.id, await probe(url)] as const
    })
  )

  const radio: Record<string, boolean> = {}
  const tv: Record<string, boolean> = {}
  radioResults.forEach(([id, ok]) => (radio[id] = ok))
  tvResults.forEach(([id, ok]) => (tv[id] = ok))

  cache = { ts: now, radio, tv }
  return NextResponse.json(cache)
}
