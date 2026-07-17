import { NextRequest, NextResponse } from 'next/server'
import { RADIO_STATIONS } from '@/lib/radio/stations'
import { ALL_TV_STATIONS } from '@/lib/tv/stations'

// In-memory cache (per server instance) — refreshed at most once per 60s.
let cache: { ts: number; radio: Record<string, boolean>; tv: Record<string, boolean> } | null = null
const TTL = 60_000

async function probe(url: string): Promise<boolean> {
  // For HLS/audio we only need to confirm the endpoint responds (HEAD, fallback GET range).
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 6000)
    try {
      const res = await fetch(url, {
        method: 'HEAD',
        signal: ctrl.signal,
        headers: { 'User-Agent': '026news-health/1.0' },
        redirect: 'follow',
      })
      clearTimeout(t)
      if (res.status < 400 || res.status === 401 || res.status === 403 || res.status === 405) return true
      // Some servers reject HEAD — retry with a tiny ranged GET.
      const ctrl2 = new AbortController()
      const t2 = setTimeout(() => ctrl2.abort(), 6000)
      const res2 = await fetch(url, {
        method: 'GET',
        signal: ctrl2.signal,
        headers: { Range: 'bytes=0-1', 'User-Agent': '026news-health/1.0' },
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

  const [radioResults, tvResults] = await Promise.all([
    Promise.all(RADIO_STATIONS.map(async (s) => [s.id, await probe(s.streamUrl)] as const)),
    Promise.all(ALL_TV_STATIONS.map(async (s) => [s.id, await probe(s.streamUrl)] as const)),
  ])

  const radio: Record<string, boolean> = {}
  const tv: Record<string, boolean> = {}
  radioResults.forEach(([id, ok]) => (radio[id] = ok))
  tvResults.forEach(([id, ok]) => (tv[id] = ok))

  cache = { ts: now, radio, tv }
  return NextResponse.json(cache)
}
