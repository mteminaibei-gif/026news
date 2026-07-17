'use client'

import { useEffect, useState, useCallback } from 'react'

export interface Podcast {
  title: string
  author: string
  region: 'ke' | 'global'
  episodes: number
  duration: string
  cover_color: string
}

export interface RecentItem {
  title: string
  station: string
  played_at: string
  time: string
}

interface MediaData {
  kenyaPodcasts: Podcast[]
  globalPodcasts: Podcast[]
  recentlyPlayed: RecentItem[]
}

export function useMedia() {
  const [data, setData] = useState<MediaData>({
    kenyaPodcasts: [],
    globalPodcasts: [],
    recentlyPlayed: [],
  })
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (revalidate = false) => {
    try {
      const res = await fetch('/api/media', {
        cache: revalidate ? 'no-store' : 'force-cache',
        headers: revalidate ? { 'Cache-Control': 'no-cache' } : {},
      })
      if (res.ok) {
        const json = await res.json()
        setData({
          kenyaPodcasts: json.kenyaPodcasts ?? [],
          globalPodcasts: json.globalPodcasts ?? [],
          recentlyPlayed: json.recentlyPlayed ?? [],
        })
      }
    } catch {
      /* keep previous data on failure */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    // Defer initial load to a microtask so setState isn't synchronous in the effect
    void Promise.resolve().then(() => { if (active) load(false) })
    // Realtime refresh every 30s (matches CDN s-maxage window)
    const t = setInterval(() => load(true), 30_000)
    return () => { active = false; clearInterval(t) }
  }, [load])

  const recordPlay = useCallback(async (title: string, station: string, source = 'radio', coverColor?: string) => {
    try {
      await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, station, source, coverColor }),
      })
      // Optimistic local update
      setData(prev => ({
        ...prev,
        recentlyPlayed: [
          { title, station, played_at: new Date().toISOString(), time: 'just now' },
          ...prev.recentlyPlayed.filter(r => !(r.title === title && r.station === station)),
        ].slice(0, 12),
      }))
    } catch {
      /* non-critical */
    }
  }, [])

  return { ...data, loading, reload: load, recordPlay }
}
